/**
 * PushPlus API 客户端模块
 * 提供 PushPlus 推送服务的 TypeScript 接口
 */

import { z } from 'zod';

// PushPlus API 响应模式定义
export const PushPlusResponseSchema = z.object({
  code: z.number(),
  msg: z.string(),
  data: z.string().optional(),
  count: z.number().optional()
});

export type PushPlusResponse = z.infer<typeof PushPlusResponseSchema>;

// 推送消息参数模式定义
export const PushMessageSchema = z.object({
  token: z.string().describe('用户令牌，32位字符串'),
  title: z.string().describe('消息标题，最大长度100'),
  content: z.string().describe('具体消息内容，根据template参数进行渲染'),
  topic: z.string().optional().describe('群组编码，不填仅发送给自己'),
  template: z.enum(['html', 'txt', 'json', 'markdown', 'cloudMonitor', 'jenkins', 'route', 'pay']).default('html').describe('发送消息模板'),
  channel: z.enum(['wechat', 'webhook', 'cp', 'mail', 'sms', 'voice', 'extension', 'app']).default('wechat').describe('发送渠道'),
  to: z.string().optional().describe('好友令牌，微信公众号渠道填写好友令牌，企业微信渠道填写企业微信用户id。多人用逗号隔开，实名用户最多10人，会员100人'),
  pre: z.string().optional().describe('预处理编码，仅供会员使用。可提前自定义代码来修改消息内容'),
  webhook: z.string().url().optional().describe('第三方webhook地址'),
  callbackUrl: z.string().url().optional().describe('消息回调地址'),
  timestamp: z.number().optional().describe('毫秒时间戳，用于防重复')
});

export type PushMessage = z.infer<typeof PushMessageSchema>;

// 多渠道批量发送消息参数模式定义
export const BatchSendMessageSchema = z.object({
  token: z.string().describe('用户token或消息token'),
  title: z.string().optional().describe('消息标题'),
  content: z.string().describe('具体消息内容，根据不同template支持不同格式'),
  channel: z.string().default('wechat').describe('发送渠道，多个用逗号隔开。如："wechat,webhook,extension"'),
  option: z.string().optional().describe('渠道配置参数(原webhook参数)，多个渠道的时候用逗号隔开，一一对应发送渠道'),
  topic: z.string().optional().describe('群组编码，不填仅发送给自己；channel为webhook时无效'),
  template: z.enum(['html', 'txt', 'json', 'markdown', 'cloudMonitor', 'jenkins', 'route', 'pay']).default('html').describe('发送模板'),
  callbackUrl: z.string().optional().describe('发送结果回调地址'),
  timestamp: z.number().optional().describe('毫秒时间戳。服务器时间戳大于此时间戳，则消息不会发送'),
  to: z.string().optional().describe('好友令牌，多人用逗号隔开，实名用户最多10人，会员100人'),
  pre: z.string().optional().describe('预处理编码，仅供会员使用')
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

// 消息状态查询参数
export const MessageStatusQuerySchema = z.object({
  token: z.string(),
  messageId: z.string()
});

export type MessageStatusQuery = z.infer<typeof MessageStatusQuerySchema>;

/**
 * PushPlus API 客户端类
 */
export class PushPlusClient {
  private readonly baseUrl = 'https://www.pushplus.plus/send';
  private readonly batchSendUrl = 'https://www.pushplus.plus/batchSend';
  private readonly queryUrl = 'https://www.pushplus.plus/query';
  
  constructor(private defaultToken?: string) {}

  /**
   * 发送推送消息
   * @param message 消息参数
   * @returns 推送结果
   */
  async sendMessage(message: Partial<Omit<PushMessage, 'token'>> & { title: string; content: string; token?: string }): Promise<PushPlusResponse> {
    const token = message.token || this.defaultToken;
    if (!token) {
      throw new Error('缺少 PushPlus token，请在消息参数中提供或在初始化时设置默认token');
    }

    const payload: PushMessage = {
      token,
      title: message.title,
      content: message.content,
      template: message.template || 'html',
      channel: message.channel || 'wechat',
      topic: message.topic,
      to: message.to,
      pre: message.pre,
      webhook: message.webhook,
      callbackUrl: message.callbackUrl,
      timestamp: message.timestamp
    };

    // 验证参数
    const validatedPayload = PushMessageSchema.parse(payload);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PushPlus-MCP-Server/1.0.1'
        },
        body: JSON.stringify(validatedPayload)
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
   * @param message 批量发送消息参数
   * @returns 批量发送结果，包含每个渠道的流水号
   */
  async batchSendMessage(
    message: Partial<Omit<BatchSendMessage, 'token'>> & { content: string; token?: string }
  ): Promise<BatchSendResponse> {
    const token = message.token || this.defaultToken;
    if (!token) {
      throw new Error('缺少 PushPlus token，请在消息参数中提供或在初始化时设置默认token');
    }

    const payload: BatchSendMessage = {
      token,
      content: message.content,
      title: message.title,
      channel: message.channel || 'wechat',
      option: message.option,
      topic: message.topic,
      template: message.template || 'html',
      callbackUrl: message.callbackUrl,
      timestamp: message.timestamp,
      to: message.to,
      pre: message.pre
    };

    const validatedPayload = BatchSendMessageSchema.parse(payload);

    try {
      const response = await fetch(this.batchSendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PushPlus-MCP-Server/1.0.1'
        },
        body: JSON.stringify(validatedPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as BatchSendResponse;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`参数验证失败: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`多渠道发送消息失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 查询消息发送状态
   * @param query 查询参数
   * @returns 消息状态
   */
  async queryMessageStatus(query: Omit<MessageStatusQuery, 'token'> & { token?: string }): Promise<PushPlusResponse> {
    const token = query.token || this.defaultToken;
    if (!token) {
      throw new Error('缺少 PushPlus token');
    }

    const payload = MessageStatusQuerySchema.parse({
      ...query,
      token
    });

    try {
      const response = await fetch(this.queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PushPlus-MCP-Server/1.0.1'
        },
        body: JSON.stringify(payload)
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
      throw new Error(`查询消息状态失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 快速发送文本消息
   * @param title 消息标题
   * @param content 消息内容
   * @param options 可选参数
   * @returns 推送结果
   */
  async sendTextMessage(
    title: string,
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
   * @param title 消息标题
   * @param content HTML内容
   * @param options 可选参数
   * @returns 推送结果
   */
  async sendHtmlMessage(
    title: string,
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
   * @param title 消息标题
   * @param content Markdown内容
   * @param options 可选参数
   * @returns 推送结果
   */
  async sendMarkdownMessage(
    title: string,
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
   * @param title 消息标题
   * @param content JSON内容
   * @param options 可选参数
   * @returns 推送结果
   */
  async sendJsonMessage(
    title: string,
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
   * @param token PushPlus token
   */
  setDefaultToken(token: string): void {
    this.defaultToken = token;
  }

  /**
   * 获取当前默认token（脱敏显示）
   * @returns 脱敏的token字符串
   */
  getDefaultTokenMasked(): string {
    if (!this.defaultToken) {
      return '未设置';
    }
    return this.defaultToken.slice(0, 8) + '***' + this.defaultToken.slice(-4);
  }

  /**
   * 验证token格式
   * @param token 待验证的token
   * @returns 是否有效
   */
  static isValidToken(token: string): boolean {
    // PushPlus token 通常是32位字符串
    return /^[a-zA-Z0-9]{32}$/.test(token);
  }
}