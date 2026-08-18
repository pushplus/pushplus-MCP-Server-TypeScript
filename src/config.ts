/**
 * 环境配置管理模块
 * 处理环境变量和配置信息
 */

import { z } from 'zod';
import { config } from 'dotenv';
import { TemplateEnumSchema, ChannelEnumSchema } from './pushplus.js';

// 配置环境变量模式
export const ConfigSchema = z.object({
  // pushplus相关配置：token 同时用于发送与开放接口鉴权
  pushplusToken: z.string().default(''),
  secretKey: z.string().default(''),
  baseUrl: z.string().url().default('https://www.pushplus.plus'),
  // 开放接口前缀（官方文档为 /api；/send 不走此前缀）
  openApiPrefix: z.string().default('/api'),

  // MCP服务器配置
  mcpServerName: z.string().default('pushplus-mcp-server'),
  mcpServerVersion: z.string().default('1.0.8'),

  // 默认配置
  defaultTemplate: TemplateEnumSchema.default('html'),
  defaultChannel: ChannelEnumSchema.default('wechat'),

  // 调试配置
  debug: z.boolean().default(false)
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * 配置管理类
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    try {
      config();
    } catch {
      // .env 不存在时继续使用系统环境变量
    }

    this.config = this.parseConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private parseConfig(): Config {
    const envConfig = {
      pushplusToken: process.env.PUSHPLUS_TOKEN || '',
      secretKey: process.env.PUSHPLUS_SECRET_KEY || '',
      baseUrl: process.env.PUSHPLUS_BASE_URL || 'https://www.pushplus.plus',
      openApiPrefix: process.env.PUSHPLUS_OPEN_API_PREFIX || '/api',
      mcpServerName: process.env.MCP_SERVER_NAME || 'pushplus-mcp-server',
      mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.8',
      defaultTemplate: process.env.DEFAULT_TEMPLATE || 'html',
      defaultChannel: process.env.DEFAULT_CHANNEL || 'wechat',
      debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
    };

    try {
      return ConfigSchema.parse(envConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`配置验证失败:\n${errorMessages.join('\n')}`);
      }
      throw error;
    }
  }

  public getConfig(): Config {
    return this.config;
  }

  public getPushPlusToken(): string {
    return this.config.pushplusToken;
  }

  public getSecretKey(): string {
    return this.config.secretKey;
  }

  public getBaseUrl(): string {
    return this.config.baseUrl.replace(/\/+$/, '');
  }

  /** 开放接口根地址，如 https://www.pushplus.plus/api */
  public getOpenApiBaseUrl(): string {
    let prefix = (this.config.openApiPrefix || '/api').trim();
    if (!prefix) {
      return this.getBaseUrl();
    }
    if (!prefix.startsWith('/')) {
      prefix = `/${prefix}`;
    }
    return `${this.getBaseUrl()}${prefix.replace(/\/+$/, '')}`;
  }

  /** 开放接口需要 token + secretKey */
  public hasOpenCredentials(): boolean {
    return Boolean(this.config.pushplusToken && this.config.secretKey);
  }

  public getMcpServerName(): string {
    return this.config.mcpServerName;
  }

  public getMcpServerVersion(): string {
    return this.config.mcpServerVersion;
  }

  public getDefaultTemplate(): string {
    return this.config.defaultTemplate;
  }

  public getDefaultChannel(): string {
    return this.config.defaultChannel;
  }

  public isDebugMode(): boolean {
    return this.config.debug;
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.pushplusToken) {
      errors.push('缺少 PUSHPLUS_TOKEN 环境变量（发送与开放接口共用）');
    } else if (!/^[a-zA-Z0-9]{32}$/.test(this.config.pushplusToken)) {
      errors.push('PUSHPLUS_TOKEN 格式不正确，应为32位字符串');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  public printConfig(): void {
    const mask = (value: string) =>
      value ? value.slice(0, 8) + '***' + value.slice(-4) : '未设置';

    console.log('🔧 pushplus mcp server 配置信息:');
    console.log(`   服务器名称: ${this.config.mcpServerName}`);
    console.log(`   服务器版本: ${this.config.mcpServerVersion}`);
    console.log(`   Base URL: ${this.getBaseUrl()}`);
    console.log(`   pushplus token: ${mask(this.config.pushplusToken)}`);
    console.log(`   Secret Key: ${this.config.secretKey ? '已设置' : '未设置（开放接口不可用）'}`);
    console.log(`   默认模板: ${this.config.defaultTemplate}`);
    console.log(`   默认渠道: ${this.config.defaultChannel}`);
    console.log(`   调试模式: ${this.config.debug ? '开启' : '关闭'}`);
  }

  public reloadConfig(): void {
    config();
    this.config = this.parseConfig();
  }
}

export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}
