#!/usr/bin/env node

/**
 * PushPlus MCP Server 入口文件
 * 提供命令行接口和服务器启动功能
 */

import { PushPlusMcpServer } from './server.js';
import { getConfig } from './config.js';

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
🚀 PushPlus MCP Server

用法:
  pushplus-mcp [选项]

选项:
  --help, -h        显示此帮助信息
  --version, -v     显示版本信息
  --test, -t        运行配置测试
  --config, -c      显示当前配置

环境变量配置:
  方式1: 通过 .env 文件配置
  方式2: 通过系统环境变量或 Claude Desktop 配置

  PUSHPLUS_TOKEN         PushPlus API Token (必需)
  MCP_SERVER_NAME        MCP 服务器名称 (默认: pushplus-mcp-server)
  MCP_SERVER_VERSION     MCP 服务器版本 (默认: 1.0.1)
  DEFAULT_TEMPLATE       默认消息模板 (默认: html)
  DEFAULT_CHANNEL        默认推送渠道 (默认: wechat)
  DEBUG                  调试模式 (默认: false)

注意: 当通过 Claude Desktop 配置环境变量时，无需创建 .env 文件

示例:
  # 启动服务器
  pushplus-mcp

  # 测试配置
  pushplus-mcp --test

  # 查看配置
  pushplus-mcp --config

更多信息请访问: https://github.com/your-username/pushplus-mcp-server
`);
}

/**
 * 显示版本信息
 */
function showVersion(): void {
  const version = process.env.MCP_SERVER_VERSION || '1.0.1';
  console.log(`PushPlus MCP Server v${version}`);
}

/**
 * 运行配置测试
 */
async function runTest(): Promise<void> {
  console.log('🧪 运行 PushPlus MCP Server 配置测试...\n');
  
  try {
    const config = getConfig();
    
    // 显示配置
    config.printConfig();
    console.log();
    
    // 验证配置
    const validation = config.validateConfig();
    if (validation.valid) {
      console.log('✅ 配置验证通过');
    } else {
      console.log('❌ 配置验证失败:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      process.exit(1);
    }

    // 测试 PushPlus API 连接
    console.log('\n📡 测试 PushPlus API 连接...');
    try {
      const { PushPlusClient } = await import('./pushplus.js');
      const client = new PushPlusClient(config.getPushPlusToken());
      
      // 尝试发送测试消息
      const testResult = await client.sendMessage({
        title: 'PushPlus MCP Server 测试',
        content: '这是一条来自 PushPlus MCP Server 的测试消息。如果您收到这条消息，说明配置正确。'
      });

      if (testResult.code === 200) {
        console.log('✅ PushPlus API 连接成功，测试消息已发送');
        console.log(`   响应: ${testResult.msg}`);
      } else {
        console.log('⚠️  PushPlus API 响应异常');
        console.log(`   状态码: ${testResult.code}`);
        console.log(`   消息: ${testResult.msg}`);
      }
    } catch (error) {
      console.log('❌ PushPlus API 连接失败');
      console.log(`   错误: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('\n🎉 测试完成');
  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 显示配置信息
 */
function showConfig(): void {
  console.log('📋 PushPlus MCP Server 当前配置:\n');
  
  try {
    const config = getConfig();
    config.printConfig();
    
    console.log('\n📝 配置验证:');
    const validation = config.validateConfig();
    if (validation.valid) {
      console.log('✅ 配置有效');
    } else {
      console.log('❌ 配置无效:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
  } catch (error) {
    console.error('❌ 读取配置失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // 处理命令行参数
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }

  if (args.includes('--test') || args.includes('-t')) {
    await runTest();
    return;
  }

  if (args.includes('--config') || args.includes('-c')) {
    showConfig();
    return;
  }

  // 默认启动服务器
  try {
    const server = new PushPlusMcpServer();
    
    // 处理进程信号
    process.on('SIGINT', async () => {
      console.log('\n🛑 收到中断信号，正在优雅关闭服务器...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 收到终止信号，正在优雅关闭服务器...');
      await server.stop();
      process.exit(0);
    });

    // 启动服务器
    await server.start();
  } catch (error) {
    console.error('❌ 启动失败:', error instanceof Error ? error.message : String(error));
    
    // 如果是配置错误，显示帮助信息
    if (error instanceof Error && error.message.includes('配置')) {
      console.log('\n💡 请检查环境变量配置，或运行 --help 查看帮助信息');
      console.log('💡 您可以运行 --test 来测试配置');
    }
    
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 启动程序
main().catch((error) => {
  console.error('❌ 程序启动失败:', error);
  process.exit(1);
});