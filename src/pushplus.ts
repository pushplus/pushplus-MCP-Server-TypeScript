/**
 * PushPlus API 客户端模块
 * 提供 PushPlus 推送服务的 TypeScript 接口
 */

import { z } from 'zod';

export const TEMPLATE_TYPES = [
  'html',
  'txt',
  'json',
  'markdown',
  'cloudMonitor',
  'jenkins',
  'route',
  'pay',
  'order',
  'verify',
  'form',
  'doc',
  'excel',
  'webdiff'
] as const;

export const CHANNEL_TYPES = [
  'wechat',
  'webhook',
  'cp',
  'mail',
  'sms',
  'voice',
  'extension',
  'app',
  'clawbot'
] as const;

export const PUSH_ID_TEMPLATES = new Set(['form', 'doc', 'excel', 'webdiff']);

export const TemplateEnumSchema = z.enum(TEMPLATE_TYPES);
export const ChannelEnumSchema = z.enum(CHANNEL_TYPES);

// PushPlus API 响应模式定义
export const PushPlusResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: z.string().optional(),
  count: z.number().optional()
});

export type PushPlusResponse = z.infer<typeof PushPlusResponseSchema>;

// 推送消息参数模式定义（对齐 /send 接口 SendMsgDto）
export const PushMessageSchema = z.object({
  token: z.string().describe('用户令牌或消息令牌，32位字符串'),
  title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题，可选'),
  content: z.string().describe('具体消息内容，根据template参数进行渲染'),
  icon: z.string().optional().describe('消息图标'),
  topic: z.string().optional().describe('群组编码，不填仅发送给自己；与to互斥，topic优先'),
  template: TemplateEnumSchema.default('html').describe('发送消息模板'),
  channel: ChannelEnumSchema.default('wechat').describe('发送渠道'),
  to: z.string().optional().describe('好友令牌，微信公众号渠道填写好友令牌，企业微信渠道填写企业微信用户id。多人用逗号隔开'),
  pre: z.string().optional().describe('预处理编码，仅供会员使用'),
  webhook: z.string().optional().describe('第三方webhook编码（非URL）'),
  option: z.string().optional().describe('渠道配置参数(原webhook参数)，与webhook等价'),
  callbackUrl: z.string().optional().describe('消息回调地址'),
  timestamp: z.union([z.string(), z.number()]).optional().describe('毫秒时间戳，服务器时间大于此值则不发送'),
  pushId: z.string().optional().describe('push类模板详情页ID；form/doc/excel/webdiff模板必填')
}).superRefine((data, ctx) => {
  if (PUSH_ID_TEMPLATES.has(data.template) && !data.pushId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pushId'],
      message: `template为${data.template}时，pushId不能为空`
    });
  }
});

export type PushMessage = z.infer<typeof PushMessageSchema>;

// 多渠道批量发送消息参数模式定义（对齐 /batchSend 接口）
export const BatchSendMessageSchema = z.object({
  token: z.string().describe('用户token或消息token'),
  title: z.string().max(200, '消息标题最大长度200字符').optional().describe('消息标题'),
  content: z.string().describe('具体消息内容，根据不同template支持不同格式'),
  icon: z.string().optional().describe('消息图标'),
  channel: z.string().default('wechat').describe('发送渠道，多个用逗号隔开，最多5个。如："wechat,webhook,mail"'),
  option: z.string().optional().describe('渠道配置参数(原webhook参数)，多个渠道时用逗号隔开，与channel一一对应'),
  topic: z.string().optional().describe('群组编码，不填仅发送给自己；channel为webhook时无效'),
  template: TemplateEnumSchema.default('html').describe('发送模板'),
  callbackUrl: z.string().optional().describe('发送结果回调地址'),
  timestamp: z.union([z.string(), z.number()]).optional().describe('毫秒时间戳。服务器时间戳大于此时间戳，则消息不会发送'),
  to: z.string().optional().describe('好友令牌，多人用逗号隔开'),
  pre: z.string().optional().describe('预处理编码，仅供会员使用'),
  pushId: z.string().optional().describe('push类模板详情页ID；form/doc/excel/webdiff模板必填')
}).superRefine((data, ctx) => {
  if (PUSH_ID_TEMPLATES.has(data.template) && !data.pushId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pushId'],
      message: `template为${data.template}时，pushId不能为空`
    });
  }
});

export type BatchSendMessage = z.infer<typeof BatchSendMessageSchema>;

// 多渠道发送单条渠道响应
export interface BatchSendChannelResult {
  shortCode: string;
  message: string;
  code: number;
  channel: string;
}

// 多渠道发送响应
export interface BatchSendResponse {
  code: number;
  msg: string;
  data: BatchSendChannelResult[];
}

const USER_AGENT = 'PushPlus-MCP-Server/1.0.7';

/**
 * PushPlus API 客户端类
 */
export class PushPlusClient {
  private readonly sendUrl: string;
  private readonly batchSendUrl: string;

  constructor(
    private defaultToken?: string,
    baseUrl = 'https://www.pushplus.plus'
  ) {
    const root = baseUrl.replace(/\/+$/, '');
    this.sendUrl = `${root}/send`;
    this.batchSendUrl = `${root}/batchSend`;
  }

  /**
   * 发送推送消息
   */
  async sendMessage(
    message: Partial<Omit<PushMessage, 'token'>> & { content: string; token?: string }
  ): Promise<PushPlusResponse> {
    const token = message.token || this.defaultToken;
    if (!token) {
      throw new Error('缺少 PushPlus token，请在消息参数中提供或在初始化时设置默认token');
    }

    const payload = {
      token,
      title: message.title,
      content: message.content,
      icon: message.icon,
      template: message.template || 'html',
      channel: message.channel || 'wechat',
      topic: message.topic,
      to: message.to,
      pre: message.pre,
      webhook: message.webhook,
      option: message.option,
      callbackUrl: message.callbackUrl,
      timestamp: message.timestamp !== undefined ? String(message.timestamp) : undefined,
      pushId: message.pushId
    };

    const validatedPayload = PushMessageSchema.parse(payload);
    const body = {
      ...validatedPayload,
      timestamp: validatedPayload.timestamp !== undefined
        ? String(validatedPayload.timestamp)
        : undefined
    };

    try {
      const response = await fetch(this.sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return PushPlusResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`参数验证失败: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`发送消息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 多渠道批量发送消息
   */
  async batchSendMessage(
    message: Partial<Omit<BatchSendMessage, 'token'>> & { content: string; token?: string }
  ): Promise<BatchSendResponse> {
    const token = message.token || this.defaultToken;
    if (!token) {
      throw new Error('缺少 PushPlus token，请在消息参数中提供或在初始化时设置默认token');
    }

    const payload = {
      token,
      content: message.content,
      title: message.title,
      icon: message.icon,
      channel: message.channel || 'wechat',
      option: message.option,
      topic: message.topic,
      template: message.template || 'html',
      callbackUrl: message.callbackUrl,
      timestamp: message.timestamp !== undefined ? String(message.timestamp) : undefined,
      to: message.to,
      pre: message.pre,
      pushId: message.pushId
    };

    const validatedPayload = BatchSendMessageSchema.parse(payload);
    const body = {
      ...validatedPayload,
      timestamp: validatedPayload.timestamp !== undefined
        ? String(validatedPayload.timestamp)
        : undefined
    };

    try {
      const response = await fetch(this.batchSendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }

      return await response.json() as BatchSendResponse;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`参数验证失败: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`多渠道发送消息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 快速发送文本消息
   */
  async sendTextMessage(
    title: string | undefined,
    content: string,
    options?: Partial<Omit<PushMessage, 'title' | 'content' | 'token' | 'template'>> & { token?: string }
  ): Promise<PushPlusResponse> {
    return this.sendMessage({
      title,
      content,
      template: 'txt',
      ...options
    });
  }

  /**
   * 快速发送HTML消息
   */
  async sendHtmlMessage(
    title: string | undefined,
    content: string,
    options?: Partial<Omit<PushMessage, 'title' | 'content' | 'token' | 'template'>> & { token?: string }
  ): Promise<PushPlusResponse> {
    return this.sendMessage({
      title,
      content,
      template: 'html',
      ...options
    });
  }

  /**
   * 快速发送Markdown消息
   */
  async sendMarkdownMessage(
    title: string | undefined,
    content: string,
    options?: Partial<Omit<PushMessage, 'title' | 'content' | 'token' | 'template'>> & { token?: string }
  ): Promise<PushPlusResponse> {
    return this.sendMessage({
      title,
      content,
      template: 'markdown',
      ...options
    });
  }

  /**
   * 快速发送JSON消息
   */
  async sendJsonMessage(
    title: string | undefined,
    content: string,
    options?: Partial<Omit<PushMessage, 'title' | 'content' | 'token' | 'template'>> & { token?: string }
  ): Promise<PushPlusResponse> {
    return this.sendMessage({
      title,
      content,
      template: 'json',
      ...options
    });
  }

  /**
   * 设置默认token
   */
  setDefaultToken(token: string): void {
    this.defaultToken = token;
  }

  /**
   * 获取当前默认token（脱敏显示）
   */
  getDefaultTokenMasked(): string {
    if (!this.defaultToken) {
      return '未设置';
    }
    return this.defaultToken.slice(0, 8) + '***' + this.defaultToken.slice(-4);
  }

  /**
   * 验证token格式
   */
  static isValidToken(token: string): boolean {
    return /^[a-zA-Z0-9]{32}$/.test(token);
  }
}
