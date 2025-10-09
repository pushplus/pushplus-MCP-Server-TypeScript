/**
 * PushPlus MCP Server 主文件
 * 实现 Model Context Protocol 服务器，提供 PushPlus 推送功能
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PushPlusClient, PushMessageSchema } from './pushplus.js';
import { getConfig } from './config.js';

/**
 * PushPlus MCP Server 类
 */
export class PushPlusMcpServer {
  private server: McpServer;
  private pushPlusClient: PushPlusClient;
  private config = getConfig();

  constructor() {
    // 验证配置
    const validation = this.config.validateConfig();
    if (!validation.valid) {
      throw new Error(`配置验证失败:\n${validation.errors.join('\n')}`);
    }

    // 初始化 MCP 服务器
    this.server = new McpServer({
      name: this.config.getMcpServerName(),
      version: this.config.getMcpServerVersion()
    });

    // 初始化 PushPlus 客户端
    this.pushPlusClient = new PushPlusClient(this.config.getPushPlusToken());

    // 注册工具和资源
    this.registerTools();
    this.registerResources();
  }

  /**
   * 注册 MCP 工具
   */
  private registerTools(): void {
    // 发送推送消息工具
    this.server.registerTool(
      'send_push_message',
      {
        title: '发送推送消息',
        description: '通过 PushPlus 发送推送消息到微信、邮箱等渠道',
        inputSchema: {
          title: z.string().max(100, '消息标题最大长度100字符').describe('消息标题'),
          content: z.string().describe('消息内容，支持HTML、文本、Markdown等格式'),
          template: z.enum(['html', 'txt', 'json', 'markdown', 'cloudMonitor', 'jenkins', 'route', 'pay']).optional().describe('消息模板类型'),
          channel: z.enum(['wechat', 'webhook', 'cp', 'mail', 'sms', 'extension']).optional().describe('推送渠道'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，微信公众号渠道填写好友令牌，企业微信渠道填写企业微信用户id。多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用。可提前自定义代码来修改消息内容'),
          webhook: z.string().url().optional().describe('第三方webhook地址（仅当channel为webhook时使用）'),
          callbackUrl: z.string().url().optional().describe('消息回调地址')
        }
      },
      async ({ title, content, template, channel, topic, to, pre, webhook, callbackUrl }) => {
        try {
          const result = await this.pushPlusClient.sendMessage({
            title,
            content,
            template: (template as any) || this.config.getDefaultTemplate(),
            channel: (channel as any) || this.config.getDefaultChannel(),
            topic,
            to,
            pre,
            webhook,
            callbackUrl
          });

          const success = result.code === 200;
          const statusText = success ? '✅ HTTP请求成功' : '❌ HTTP请求失败';
          
          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;
          
          if (result.data) {
            responseText += `\n- 📋 流水号: ${result.data} （重要！可用于查询消息发送状态）`;
          }
          
          responseText += `\n- 计数: ${result.count || 0}`;
          
          if (success) {
            responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
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
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // 发送快速文本消息工具
    this.server.registerTool(
      'send_text_message',
      {
        title: '发送文本消息',
        description: '快速发送纯文本推送消息',
        inputSchema: {
          title: z.string().max(100, '消息标题最大长度100字符').describe('消息标题'),
          content: z.string().describe('消息内容（纯文本）'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用')
        }
      },
      async ({ title, content, topic, to, pre }) => {
        try {
          const result = await this.pushPlusClient.sendTextMessage(title, content, { topic, to, pre });
          
          const success = result.code === 200;
          const statusText = success ? '✅ 文本消息HTTP请求成功' : '❌ 文本消息HTTP请求失败';
          
          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;
          
          if (result.data) {
            responseText += `\n- 📋 流水号: ${result.data} （重要！可用于查询消息发送状态）`;
          }
          
          responseText += `\n- 计数: ${result.count || 0}`;
          
          if (success) {
            responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
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
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // 发送HTML消息工具
    this.server.registerTool(
      'send_html_message',
      {
        title: '发送HTML消息',
        description: '发送带有HTML格式的推送消息',
        inputSchema: {
          title: z.string().max(100, '消息标题最大长度100字符').describe('消息标题'),
          content: z.string().describe('消息内容（HTML格式）'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用')
        }
      },
      async ({ title, content, topic, to, pre }) => {
        try {
          const result = await this.pushPlusClient.sendHtmlMessage(title, content, { topic, to, pre });
          
          const success = result.code === 200;
          const statusText = success ? '✅ HTML消息HTTP请求成功' : '❌ HTML消息HTTP请求失败';
          
          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;
          
          if (result.data) {
            responseText += `\n- 📋 流水号: ${result.data} （重要！可用于查询消息发送状态）`;
          }
          
          responseText += `\n- 计数: ${result.count || 0}`;
          
          if (success) {
            responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
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
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // 发送Markdown消息工具
    this.server.registerTool(
      'send_markdown_message',
      {
        title: '发送Markdown消息',
        description: '发送Markdown格式的推送消息',
        inputSchema: {
          title: z.string().max(100, '消息标题最大长度100字符').describe('消息标题'),
          content: z.string().describe('消息内容（Markdown格式）'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用')
        }
      },
      async ({ title, content, topic, to, pre }) => {
        try {
          const result = await this.pushPlusClient.sendMarkdownMessage(title, content, { topic, to, pre });
          
          const success = result.code === 200;
          const statusText = success ? '✅ Markdown消息HTTP请求成功' : '❌ Markdown消息HTTP请求失败';
          
          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;
          
          if (result.data) {
            responseText += `\n- 📋 流水号: ${result.data} （重要！可用于查询消息发送状态）`;
          }
          
          responseText += `\n- 计数: ${result.count || 0}`;
          
          if (success) {
            responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
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
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    // 发送JSON消息工具
    this.server.registerTool(
      'send_json_message',
      {
        title: '发送JSON消息',
        description: '发送JSON格式的推送消息',
        inputSchema: {
          title: z.string().max(100, '消息标题最大长度100字符').describe('消息标题'),
          content: z.string().describe('消息内容（JSON格式）'),
          topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
          to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
          pre: z.string().optional().describe('预处理编码，仅供会员使用')
        }
      },
      async ({ title, content, topic, to, pre }) => {
        try {
          const result = await this.pushPlusClient.sendJsonMessage(title, content, { topic, to, pre });
          
          const success = result.code === 200;
          const statusText = success ? '✅ JSON消息HTTP请求成功' : '❌ JSON消息HTTP请求失败';
          
          let responseText = `${statusText}\n\n📊 响应详情:\n- 状态码: ${result.code}\n- 消息: ${result.msg}`;
          
          if (result.data) {
            responseText += `\n- 📋 流水号: ${result.data} （重要！可用于查询消息发送状态）`;
          }
          
          responseText += `\n- 计数: ${result.count || 0}`;
          
          if (success) {
            responseText += '\n\n⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。';
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
              text: `❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`
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
    // 服务器状态资源
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
            api_endpoint: 'https://www.pushplus.plus/send'
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

    // 支持的模板类型资源
    this.server.registerResource(
      'templates',
      'pushplus://templates',
      {
        title: '支持的消息模板',
        description: '获取 PushPlus 支持的所有消息模板类型',
        mimeType: 'application/json'
      },
      async () => {
        const templates = {
          templates: [
            {
              name: 'html',
              description: 'HTML格式消息，支持HTML标签和样式',
              example: '<h1>标题</h1><p>内容</p>'
            },
            {
              name: 'txt',
              description: '纯文本消息，简单易读',
              example: '标题\\n内容'
            },
            {
              name: 'json',
              description: 'JSON格式消息，适合结构化数据',
              example: '{"title": "标题", "content": "内容"}'
            },
            {
              name: 'markdown',
              description: 'Markdown格式消息，支持Markdown语法',
              example: '# 标题\\n\\n内容'
            },
            {
              name: 'cloudMonitor',
              description: '云监控消息格式，适合告警通知',
              example: '告警: 服务器CPU使用率过高'
            },
            {
              name: 'jenkins',
              description: 'Jenkins消息格式，适合Jenkins通知'
            },
            {
              name: 'route',
              description: '路由消息格式，适合路由通知',
            },
            {
              name: 'pay',
              description: '支付消息格式，适合支付通知'
            }
          ]
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

    // 支持的推送渠道资源
    this.server.registerResource(
      'channels',
      'pushplus://channels',
      {
        title: '支持的推送渠道',
        description: '获取 PushPlus 支持的所有推送渠道',
        mimeType: 'application/json'
      },
      async () => {
        const channels = {
          channels: [
            {
              name: 'wechat',
              description: '微信推送，通过微信公众号发送',
              default: true
            },
            {
              name: 'webhook',
              description: '第三方webhook推送',
              requires: ['webhook参数']
            },
            {
              name: 'cp',
              description: '企业微信推送',
              note: '需要配置企业微信应用'
            },
            {
              name: 'mail',
              description: '邮箱推送',
              note: '需要绑定邮箱'
            },
            {
              name: 'sms',
              description: '短信推送',
              note: '需要绑定手机号'
            },
            {
              name: 'extension',
              description: '浏览器插件'
            }
          ]
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
    // MCP SDK 会自动处理清理工作
  }
}