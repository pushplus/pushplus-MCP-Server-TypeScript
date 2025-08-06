# PushPlus MCP Server

一个基于 Model Context Protocol (MCP) 的 PushPlus 推送服务器，让 AI 助手能够通过 PushPlus 发送推送消息到微信、邮箱等渠道。

> 🎉 **现已发布到 NPM！**  
> 可直接通过 `npm install -g @perk-net/pushplus-mcp-server` 安装使用，无需下载源码。  
> 详细安装指南请查看 [INSTALL.md](./INSTALL.md)

## 目录

- [功能特性](#功能特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [MCP 集成](#mcp-集成)
- [命令行工具](#命令行工具)
- [开发](#开发)
- [故障排除](#故障排除)

## 功能特性

- 🚀 **完整的 MCP 支持**: 实现 Model Context Protocol 规范
- 📱 **多渠道推送**: 支持微信、邮箱、短信、企业微信等多种推送渠道
- 🎨 **多种消息格式**: 支持 HTML、Markdown、纯文本、JSON 等格式
- 🔧 **灵活配置**: 支持环境变量配置，便于部署
- 🛡️ **类型安全**: 使用 TypeScript 开发，提供完整的类型支持
- 📊 **状态监控**: 提供服务器状态和配置信息查询
- 🧪 **测试友好**: 内置配置测试和消息发送测试

## 安装

### 方式一：从 NPM 安装（推荐）

直接从 NPM 仓库安装，无需下载源码：

```bash
npm install -g @perk-net/pushplus-mcp-server
```

安装完成后，`pushplus-mcp` 命令将全局可用。

### 方式二：从源码构建

如果您需要修改代码或进行开发：

```bash
# 克隆项目
git clone https://github.com/your-org/pushplus-mcp
cd pushplus-mcp

# 安装依赖
npm install

# 构建项目
npm run build
```

## 快速开始

### 1. 配置环境变量

#### 对于 NPM 安装的用户：

直接通过环境变量设置：

```bash
export PUSHPLUS_TOKEN=your_pushplus_token_here
```

#### 对于源码构建的用户：

可以通过 `.env` 文件或环境变量配置：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入您的 PushPlus Token
# PUSHPLUS_TOKEN=your_pushplus_token_here
```

> 💡 获取 PushPlus Token：
> 1. 访问 [PushPlus 官网](https://www.pushplus.plus/)
> 2. 注册并登录账号
> 3. 在用户中心获取您的 Token

### 2. 测试配置

#### 对于 NPM 安装的用户：

```bash
pushplus-mcp --test
```

#### 对于源码构建的用户：

```bash
npm run test
```

如果配置正确，您将收到一条测试推送消息！

## MCP 集成

### Claude Desktop 配置

#### 对于 NPM 安装的用户（推荐）：

在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "pushplus-mcp",
      "env": {
        "PUSHPLUS_TOKEN": "your_pushplus_token_here"
      }
    }
  }
}
```

#### 对于源码构建的用户：

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "node",
      "args": ["/path/to/pushplus-mcp-server/dist/index.js"],
      "env": {
        "PUSHPLUS_TOKEN": "your_pushplus_token_here"
      }
    }
  }
}
```

> 📝 **配置说明**：当您在 Claude Desktop 配置中设置了 `env.PUSHPLUS_TOKEN` 后，就不需要创建 `.env` 文件了。MCP 服务器会自动读取通过 Claude Desktop 传递的环境变量。

### 可用工具

服务器提供以下 MCP 工具：

#### 1. `send_push_message` - 发送推送消息
完整的推送消息工具，支持所有参数：

```json
{
  "title": "消息标题",
  "content": "消息内容",
  "template": "html",
  "channel": "wechat",
  "topic": "群组编码（可选）",
  "to": "好友令牌（可选）",
  "pre": "预处理编码（可选，仅供会员使用）",
  "webhook": "webhook地址（可选）",
  "callbackUrl": "回调地址（可选）"
}
```

#### 2. `send_text_message` - 发送文本消息
快速发送纯文本消息：

```json
{
  "title": "消息标题",
  "content": "纯文本内容",
  "topic": "群组编码（可选）",
  "to": "好友令牌（可选）",
  "pre": "预处理编码（可选）"
}
```

#### 3. `send_html_message` - 发送HTML消息
发送带有 HTML 格式的消息：

```json
{
  "title": "消息标题",
  "content": "<h1>HTML内容</h1><p>支持HTML标签</p>",
  "topic": "群组编码（可选）",
  "to": "好友令牌（可选）",
  "pre": "预处理编码（可选）"
}
```

#### 4. `send_markdown_message` - 发送Markdown消息
发送 Markdown 格式的消息：

```json
{
  "title": "消息标题",
  "content": "# Markdown标题\n\n支持**粗体**和*斜体*",
  "topic": "群组编码（可选）",
  "to": "好友令牌（可选）",
  "pre": "预处理编码（可选）"
}
```

### 可用资源

服务器提供以下 MCP 资源：

#### 1. `pushplus://status` - 服务器状态
获取服务器运行状态和配置信息

#### 2. `pushplus://templates` - 支持的模板
获取所有支持的消息模板类型

#### 3. `pushplus://channels` - 支持的渠道
获取所有支持的推送渠道信息

## 支持的消息模板

| 模板类型 | 描述 | 示例 |
|---------|------|------|
| `html` | HTML格式消息，支持HTML标签和样式 | `<h1>标题</h1><p>内容</p>` |
| `txt` | 纯文本消息，简单易读 | `标题\n内容` |
| `json` | JSON格式消息，适合结构化数据 | `{"title": "标题", "content": "内容"}` |
| `markdown` | Markdown格式消息，支持Markdown语法 | `# 标题\n\n内容` |
| `cloudMonitor` | 云监控消息格式，适合告警通知 | `告警: 服务器CPU使用率过高` |

## 支持的推送渠道

| 渠道类型 | 描述 | 备注 |
|---------|------|------|
| `wechat` | 微信推送，通过微信公众号发送 | 默认渠道 |
| `webhook` | 第三方webhook推送 | 需要提供webhook参数 |
| `cp` | 企业微信推送 | 需要配置企业微信应用 |
| `mail` | 邮箱推送 | 需要绑定邮箱 |
| `sms` | 短信推送 | 需要绑定手机号 |

## 命令行工具

### 基本命令

#### 对于 NPM 安装的用户：

```bash
# 显示帮助信息
pushplus-mcp --help

# 显示版本信息
pushplus-mcp --version

# 测试配置（包含发送测试消息）
pushplus-mcp --test

# 显示当前配置
pushplus-mcp --config

# 启动服务器（默认命令）
pushplus-mcp
```

#### 对于源码构建的用户：

```bash
# 显示帮助信息
node dist/index.js --help

# 显示版本信息
node dist/index.js --version

# 测试配置（包含发送测试消息）
npm run test

# 显示当前配置
node dist/index.js --config

# 启动服务器（默认命令）
npm start
```

### 环境变量

| 变量名 | 描述 | 默认值 | 必需 |
|--------|------|--------|------|
| `PUSHPLUS_TOKEN` | PushPlus API Token | - | ✅ |
| `MCP_SERVER_NAME` | MCP 服务器名称 | pushplus-mcp-server | ❌ |
| `MCP_SERVER_VERSION` | MCP 服务器版本 | 1.0.0 | ❌ |
| `DEFAULT_TEMPLATE` | 默认消息模板 | html | ❌ |
| `DEFAULT_CHANNEL` | 默认推送渠道 | wechat | ❌ |
| `DEBUG` | 调试模式 | false | ❌ |

## 开发

### 项目结构

```
pushplus-mcp-server/
├── src/
│   ├── index.ts          # 程序入口
│   ├── server.ts         # MCP 服务器实现
│   ├── pushplus.ts       # PushPlus API 客户端
│   └── config.ts         # 配置管理
├── dist/                 # 编译输出目录
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目文档
```

### 开发脚本

```bash
# 构建项目
npm run build

# 监听模式构建
npm run watch

# 清理构建文件
npm run clean

# 重新构建
npm run rebuild

# 开发模式（构建并启动）
npm run dev
```

### TypeScript 支持

项目使用 TypeScript 开发，提供完整的类型支持：

- **严格类型检查**: 启用 TypeScript 严格模式
- **Zod 验证**: 使用 Zod 进行运行时类型验证
- **完整类型定义**: 所有 API 和配置都有完整的类型定义

## 故障排除

### 常见问题

#### 1. Token 无效
```
❌ 配置验证失败: PUSHPLUS_TOKEN 格式不正确，应为32位字符串
```

**解决方案**: 检查您的 PushPlus Token 是否正确，Token 应该是32位的字母数字组合。

#### 2. 推送失败
```
❌ 发送失败: HTTP请求失败: 400 Bad Request
```

**解决方案**: 
- 检查消息内容是否符合格式要求
- 确认 Token 有效且有足够的推送额度
- 检查网络连接

#### 3. 配置文件问题
```
❌ 配置验证失败: 缺少 PUSHPLUS_TOKEN 环境变量
```

**解决方案**: 
- 确保 `.env` 文件存在并包含正确的配置
- 或者通过环境变量直接设置 `PUSHPLUS_TOKEN`（如 Claude Desktop 配置）
- 检查环境变量是否正确传递到 MCP 服务器

### 调试模式

启用调试模式获取更多信息：

```bash
DEBUG=true pushplus-mcp
```

或在 `.env` 文件中设置：

```env
DEBUG=true
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [PushPlus 官网](https://www.pushplus.plus/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/)