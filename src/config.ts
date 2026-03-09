/**
 * 环境配置管理模块
 * 处理环境变量和配置信息
 */

import { z } from 'zod';
import { config } from 'dotenv';

// 配置环境变量模式
export const ConfigSchema = z.object({
  // PushPlus相关配置
  pushplusToken: z.string().min(1, 'PushPlus token 不能为空'),
  
  // MCP服务器配置
  mcpServerName: z.string().default('pushplus-mcp-server'),
  mcpServerVersion: z.string().default('1.0.1'),
  
  // 默认配置
  defaultTemplate: z.enum(['html', 'txt', 'json', 'markdown', 'cloudMonitor', 'jenkins', 'route', 'pay']).default('html'),
  defaultChannel: z.enum(['wechat', 'webhook', 'cp', 'mail', 'sms', 'voice', 'extension', 'app']).default('wechat'),
  
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
    // 尝试加载 .env 文件（如果存在）
    try {
      config();
    } catch (error) {
      // .env 文件不存在或无法读取时，继续使用系统环境变量
      // 这是正常情况，特别是当通过 Claude Desktop 等外部方式设置环境变量时
    }
    
    // 解析并验证配置
    this.config = this.parseConfig();
  }

  /**
   * 获取配置管理器单例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 解析环境变量配置
   */
  private parseConfig(): Config {
    const envConfig = {
      pushplusToken: process.env.PUSHPLUS_TOKEN || '',
      mcpServerName: process.env.MCP_SERVER_NAME || 'pushplus-mcp-server',
      mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.1',
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

  /**
   * 获取配置
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * 获取 PushPlus Token
   */
  public getPushPlusToken(): string {
    return this.config.pushplusToken;
  }

  /**
   * 获取 MCP 服务器名称
   */
  public getMcpServerName(): string {
    return this.config.mcpServerName;
  }

  /**
   * 获取 MCP 服务器版本
   */
  public getMcpServerVersion(): string {
    return this.config.mcpServerVersion;
  }

  /**
   * 获取默认模板
   */
  public getDefaultTemplate(): string {
    return this.config.defaultTemplate;
  }

  /**
   * 获取默认渠道
   */
  public getDefaultChannel(): string {
    return this.config.defaultChannel;
  }

  /**
   * 是否开启调试模式
   */
  public isDebugMode(): boolean {
    return this.config.debug;
  }

  /**
   * 验证配置是否完整
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.pushplusToken) {
      errors.push('缺少 PUSHPLUS_TOKEN 环境变量');
    }

    if (this.config.pushplusToken && !/^[a-zA-Z0-9]{32}$/.test(this.config.pushplusToken)) {
      errors.push('PUSHPLUS_TOKEN 格式不正确，应为32位字符串');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 打印配置信息（敏感信息脱敏）
   */
  public printConfig(): void {
    const maskedToken = this.config.pushplusToken 
      ? this.config.pushplusToken.slice(0, 8) + '***' + this.config.pushplusToken.slice(-4)
      : '未设置';

    console.log('🔧 PushPlus MCP Server 配置信息:');
    console.log(`   服务器名称: ${this.config.mcpServerName}`);
    console.log(`   服务器版本: ${this.config.mcpServerVersion}`);
    console.log(`   PushPlus Token: ${maskedToken}`);
    console.log(`   默认模板: ${this.config.defaultTemplate}`);
    console.log(`   默认渠道: ${this.config.defaultChannel}`);
    console.log(`   调试模式: ${this.config.debug ? '开启' : '关闭'}`);
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    config();
    this.config = this.parseConfig();
  }
}

/**
 * 获取默认配置管理器实例
 */
export function getConfig(): ConfigManager {
  return ConfigManager.getInstance();
}