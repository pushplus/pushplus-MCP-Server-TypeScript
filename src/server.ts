/**
 * PushPlus MCP Server 主文件
 * 实现 Model Context Protocol 服务器，提供 PushPlus 推送功能
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  PushPlusClient,
  BatchSendChannelResult,
  TemplateEnumSchema,
  ChannelEnumSchema,
  TEMPLATE_TYPES,
  CHANNEL_TYPES
} from './pushplus.js';
import { getConfig } from './config.js';
import { OpenApiClient } from './open-client.js';
import { registerAllOpenTools } from './tools/open/index.js';

/**
 * PushPlus MCP Server 类
 */
export class PushPlusMcpServer {
  private server: McpServer;
  private pushPlusClient: PushPlusClient;
  private openApiClient: OpenApiClient;
  private config = getConfig();

  constructor() {
    const validation = this.config.validateConfig();
    if (!validation.valid) {
      throw new Error(`配置验证失败:\n${validation.errors.join('\n')}`);
    }

    this.server = new McpServer({
      name: this.config.getMcpServerName(),
      version: this.config.getMcpServerVersion()
    });

    const baseUrl = this.config.getBaseUrl();
    this.pushPlusClient = new PushPlusClient(this.config.getPushPlusToken() || undefined, baseUrl);
    this.openApiClient = new OpenApiClient(
      this.config.getOpenApiBaseUrl(),
      this.config.getPushPlusToken(),
      this.config.getSecretKey()
    );

    this.registerTools();
    this.registerResources();
  }

  private formatSendResult(result: { code: number; msg: string; data?: string; count?: number }, label = '推送'): {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
  } {
    const success = result.code === 200;
    const statusText = success ? `✅ ${label}HTTP请求成功` : `❌ ${label}HTTP请求失败`;

    let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;

    if (result.data) {
      responseText += `\n- 📋 流水号: ${result.data} （可用于查询消息发送状态）`;
    }

    if (result.count !== undefined) {
      responseText += `\n- 计数: ${result.count}`;
    }

    if (success) {
      responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
    }

    return {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
  }

  /**
   * 注册 MCP 工具
   */
  private registerTools(): void {
    registerAllOpenTools(this.server, this.openApiClient);

    this.server.registerTool(
      'send_push_message',
      {
        title: '发送推送消息',
        description: '通过 PushPlus /send 接口发送推送消息。form/doc/excel/webdiff 模板必须传 pushId。',
        inputSchema: {
          content: z.string().describe('消息内容，支持HTML、文本、Markdown等格式'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
          icon: z.string().optional().describe('消息图标'),
          template: TemplateEnumSchema.optional().describe('消息模板类型，默认html'),
          channel: ChannelEnumSchema.optional().describe('推送渠道，默认wechat'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己；与to互斥，topic优先'),
          to: z.string().optional().describe('好友令牌/企微用户id，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          webhook: z.string().optional().describe('第三方webhook编码（非URL）'),
          option: z.string().optional().describe('渠道配置参数(原webhook参数)，与webhook等价'),
          callbackUrl: z.string().optional().describe('消息回调地址'),
          timestamp: z.union([z.string(), z.number()]).optional().describe('毫秒时间戳，过期则不发送'),
          pushId: z.string().optional().describe('form/doc/excel/webdiff 模板必填的详情页ID')
        }
      },
      async ({ content, title, icon, template, channel, topic, to, pre, webhook, option, callbackUrl, timestamp, pushId }) => {
        try {
          const result = await this.pushPlusClient.sendMessage({
            title,
            content,
            icon,
            template: template || this.config.getDefaultTemplate() as any,
            channel: channel || this.config.getDefaultChannel() as any,
            topic,
            to,
            pre,
            webhook,
            option,
            callbackUrl,
            timestamp,
            pushId
          });
          return this.formatSendResult(result);
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    this.server.registerTool(
      'send_text_message',
      {
        title: '发送文本消息',
        description: '快速发送纯文本推送消息（template=txt）',
        inputSchema: {
          content: z.string().describe('消息内容（纯文本）'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          channel: ChannelEnumSchema.optional().describe('推送渠道')
        }
      },
      async ({ content, title, topic, to, pre, channel }) => {
        try {
          const result = await this.pushPlusClient.sendTextMessage(title, content, {
            topic,
            to,
            pre,
            channel: channel || this.config.getDefaultChannel() as any
          });
          return this.formatSendResult(result, '文本消息');
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    this.server.registerTool(
      'send_html_message',
      {
        title: '发送HTML消息',
        description: '发送带有HTML格式的推送消息（template=html）',
        inputSchema: {
          content: z.string().describe('消息内容（HTML格式）'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          channel: ChannelEnumSchema.optional().describe('推送渠道')
        }
      },
      async ({ content, title, topic, to, pre, channel }) => {
        try {
          const result = await this.pushPlusClient.sendHtmlMessage(title, content, {
            topic,
            to,
            pre,
            channel: channel || this.config.getDefaultChannel() as any
          });
          return this.formatSendResult(result, 'HTML消息');
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    this.server.registerTool(
      'send_markdown_message',
      {
        title: '发送Markdown消息',
        description: '发送Markdown格式的推送消息（template=markdown）',
        inputSchema: {
          content: z.string().describe('消息内容（Markdown格式）'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          channel: ChannelEnumSchema.optional().describe('推送渠道')
        }
      },
      async ({ content, title, topic, to, pre, channel }) => {
        try {
          const result = await this.pushPlusClient.sendMarkdownMessage(title, content, {
            topic,
            to,
            pre,
            channel: channel || this.config.getDefaultChannel() as any
          });
          return this.formatSendResult(result, 'Markdown消息');
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    this.server.registerTool(
      'send_json_message',
      {
        title: '发送JSON消息',
        description: '发送JSON格式的推送消息（template=json）',
        inputSchema: {
          content: z.string().describe('消息内容（JSON格式）'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          channel: ChannelEnumSchema.optional().describe('推送渠道')
        }
      },
      async ({ content, title, topic, to, pre, channel }) => {
        try {
          const result = await this.pushPlusClient.sendJsonMessage(title, content, {
            topic,
            to,
            pre,
            channel: channel || this.config.getDefaultChannel() as any
          });
          return this.formatSendResult(result, 'JSON消息');
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    this.server.registerTool(
      'batch_send_message',
      {
        title: '多渠道批量发送消息',
        description: '通过 PushPlus /batchSend 接口同时向多个渠道发送消息。channel 用逗号隔开（最多5个），option 与 channel 一一对应。form/doc/excel/webdiff 模板必须传 pushId。',
        inputSchema: {
          content: z.string().describe('具体消息内容，根据不同template支持不同格式'),
          channel: z.string().default('wechat').describe('发送渠道，多个用逗号隔开。如："wechat,webhook,mail"'),
          title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题'),
          icon: z.string().optional().describe('消息图标'),
          option: z.string().optional().describe('渠道配置参数(原webhook参数)，多个渠道时用逗号隔开，与channel一一对应。如：",config1,"'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己；channel为webhook时无效'),
          template: TemplateEnumSchema.optional().describe('发送模板'),
          callbackUrl: z.string().optional().describe('发送结果回调地址'),
          timestamp: z.union([z.string(), z.number()]).optional().describe('毫秒时间戳。服务器时间戳大于此时间戳，则消息不会发送'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用'),
          pushId: z.string().optional().describe('form/doc/excel/webdiff 模板必填的详情页ID')
        }
      },
      async ({ content, channel, title, icon, option, topic, template, callbackUrl, timestamp, to, pre, pushId }) => {
        try {
          const result = await this.pushPlusClient.batchSendMessage({
            content,
            channel: channel || this.config.getDefaultChannel(),
            title,
            icon,
            option,
            topic,
            template: template || this.config.getDefaultTemplate() as any,
            callbackUrl,
            timestamp,
            to,
            pre,
            pushId
          });

          const success = result.code === 200;
          const statusText = success ? '✅ 多渠道发送HTTP请求成功' : '❌ 多渠道发送HTTP请求失败';

          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;

          if (result.data && Array.isArray(result.data)) {
            responseText += `\n\n📋 各渠道发送结果 (共 ${result.data.length} 个渠道):`;
            result.data.forEach((item: BatchSendChannelResult, index: number) => {
              const channelSuccess = item.code === 200;
              const iconMark = channelSuccess ? '✅' : '❌';
              responseText += `\n\n  ${iconMark} 渠道 ${index + 1}: ${item.channel}`;
              responseText += `\n  - 状态码: ${item.code}`;
              responseText += `\n  - 消息: ${item.message}`;
              if (item.shortCode) {
                responseText += `\n  - 流水号: ${item.shortCode}`;
              }
            });
          }

          if (success) {
            responseText += '\n\n⚠️ 注意：code=200 仅代表服务端收到请求，并不表示消息发送成功。';
          }

          return {
            content: [{
              type: 'text',
              text: responseText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ 多渠道发送请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  /**
   * 注册 MCP 资源
   */
  private registerResources(): void {
    this.server.registerResource(
      'server_status',
      'pushplus://status',
      {
        title: 'PushPlus MCP Server 状态',
        description: '获取服务器状态和配置信息',
        mimeType: 'application/json'
      },
      async () => {
        const status = {
          server: {
            name: this.config.getMcpServerName(),
            version: this.config.getMcpServerVersion(),
            status: 'running'
          },
          pushplus: {
            token: this.pushPlusClient.getDefaultTokenMasked(),
            base_url: this.config.getBaseUrl(),
            api_endpoint: `${this.config.getBaseUrl()}/send`,
            batch_endpoint: `${this.config.getBaseUrl()}/batchSend`,
            open_api_enabled: this.config.hasOpenCredentials()
          },
          config: {
            default_template: this.config.getDefaultTemplate(),
            default_channel: this.config.getDefaultChannel(),
            debug_mode: this.config.isDebugMode()
          },
          timestamp: new Date().toISOString()
        };

        return {
          contents: [{
            uri: 'pushplus://status',
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2)
          }]
        };
      }
    );

    this.server.registerResource(
      'templates',
      'pushplus://templates',
      {
        title: '支持的消息模板',
        description: '获取 PushPlus 支持的所有消息模板类型',
        mimeType: 'application/json'
      },
      async () => {
        const templateDescriptions: Record<string, { description: string; requiresPushId?: boolean; example?: string }> = {
          html: { description: 'HTML格式消息，支持HTML标签和样式', example: '<h1>标题</h1><p>内容</p>' },
          txt: { description: '纯文本消息，简单易读', example: '标题\\n内容' },
          json: { description: 'JSON格式消息，适合结构化数据', example: '{"title": "标题", "content": "内容"}' },
          markdown: { description: 'Markdown格式消息，支持Markdown语法', example: '# 标题\\n\\n内容' },
          cloudMonitor: { description: '阿里云监控报警定制模板' },
          jenkins: { description: 'Jenkins插件定制模板' },
          route: { description: '路由器插件定制模板' },
          pay: { description: '支付成功通知模板' },
          order: { description: '订单支付成功模板' },
          verify: { description: '实名认证模板' },
          form: { description: '表单格式模板', requiresPushId: true },
          doc: { description: '文档格式模板', requiresPushId: true },
          excel: { description: '表格格式模板', requiresPushId: true },
          webdiff: { description: '网页差异对比模板', requiresPushId: true }
        };

        const templates = {
          templates: TEMPLATE_TYPES.map((name) => ({
            name,
            ...templateDescriptions[name]
          }))
        };

        return {
          contents: [{
            uri: 'pushplus://templates',
            mimeType: 'application/json',
            text: JSON.stringify(templates, null, 2)
          }]
        };
      }
    );

    this.server.registerResource(
      'channels',
      'pushplus://channels',
      {
        title: '支持的推送渠道',
        description: '获取 PushPlus 支持的所有推送渠道',
        mimeType: 'application/json'
      },
      async () => {
        const channelDescriptions: Record<string, { description: string; default?: boolean; note?: string; requires?: string[] }> = {
          wechat: { description: '微信公众号推送', default: true },
          webhook: { description: '第三方webhook推送（企业微信/钉钉/飞书等）', requires: ['webhook或option编码'] },
          cp: { description: '企业微信应用推送', note: '需要配置企业微信应用' },
          mail: { description: '邮箱推送', note: '需要绑定邮箱' },
          sms: { description: '短信推送', note: '需要绑定手机号' },
          voice: { description: '语音推送', note: '需要绑定手机号' },
          extension: { description: '浏览器插件推送' },
          app: { description: 'App推送', note: '需要先登录APP' },
          clawbot: { description: '微信ClawBot推送', note: '需要配置ClawBot' }
        };

        const channels = {
          channels: CHANNEL_TYPES.map((name) => ({
            name,
            ...channelDescriptions[name]
          }))
        };

        return {
          contents: [{
            uri: 'pushplus://channels',
            mimeType: 'application/json',
            text: JSON.stringify(channels, null, 2)
          }]
        };
      }
    );
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.config.isDebugMode()) {
      this.config.printConfig();
      console.log('🚀 启动 PushPlus MCP Server...');
    }

    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      if (this.config.isDebugMode()) {
        console.log('✅ PushPlus MCP Server 已启动，正在监听 stdio...');
      }
    } catch (error) {
      console.error('❌ 启动服务器失败:', error);
      process.exit(1);
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (this.config.isDebugMode()) {
      console.log('🛑 正在停止 PushPlus MCP Server...');
    }
  }
}
