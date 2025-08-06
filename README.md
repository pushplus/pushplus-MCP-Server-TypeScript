# PushPlus MCP Server

一个基于 Model Context Protocol (MCP) 的 PushPlus 推送服务器，让 AI 助手能够通过 PushPlus 发送推送消息到微信、邮箱等渠道。

> 🎉 **现已发布到 NPM！**  
> 可直接通过 `npm install -g @perk-net/pushplus-mcp-server` 安装使用，无需下载源码。

## 📋 目录

- [功能特性](#功能特性)
- [🚀 快速开始](#-快速开始)
- [🔧 安装方式](#-安装方式)
- [⚙️ Claude Desktop 集成](#️-claude-desktop-集成)
- [📱 功能使用](#-功能使用)
- [🛠️ 命令行工具](#️-命令行工具)
- [📖 使用示例](#-使用示例)
- [🔍 故障排除](#-故障排除)
- [👨‍💻 开发](#-开发)

## 功能特性

- 🚀 **完整的 MCP 支持**: 实现 Model Context Protocol 规范
- 📱 **多渠道推送**: 支持微信、邮箱、短信、企业微信等多种推送渠道
- 🎨 **多种消息格式**: 支持 HTML、Markdown、纯文本、JSON 等格式
- 🔧 **灵活配置**: 支持环境变量配置，便于部署
- 🛡️ **类型安全**: 使用 TypeScript 开发，提供完整的类型支持
- 📊 **状态监控**: 提供服务器状态和配置信息查询
- 🧪 **测试友好**: 内置配置测试和消息发送测试

## 🚀 快速开始

### 第一步：安装

```bash
# 从 NPM 安装（推荐）
npm install -g @perk-net/pushplus-mcp-server
```

### 第二步：获取 PushPlus Token

1. 访问 [PushPlus 官网](https://www.pushplus.plus/)
2. 微信扫码登录
3. 在个人中心获取您的 Token

### 第三步：测试配置

```bash
# 设置环境变量
export PUSHPLUS_TOKEN=your_pushplus_token_here

# 测试配置
pushplus-mcp --test
```

如果配置正确，您会收到一条测试推送消息！

### 第四步：集成到 Claude Desktop

1. 打开 Claude Desktop 设置 → Developer → Edit Config
2. 添加配置（根据您的操作系统选择）：

**Windows 用户**：
```json
{
  "mcpServers": {
    "pushplus": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@perk-net/pushplus-mcp-server"
      ],
      "env": {
        "PUSHPLUS_TOKEN": "您的Token"
      }
    }
  }
}
```

**Mac/Linux 用户**：
```json
{
  "mcpServers": {
    "pushplus": {
      "command": "npx",
      "args": [
        "-y",
        "@perk-net/pushplus-mcp-server"
      ],
      "env": {
        "PUSHPLUS_TOKEN": "您的Token"
      }
    }
  }
}
```

3. 重启 Claude Desktop

### 第五步：开始使用！

在 Claude 中说：
```
"请发送一条测试推送消息到我的微信"
```

🎉 恭喜！您已成功设置 PushPlus MCP Server！

## 🔧 安装方式

### 方式一：从 NPM 安装（推荐）

```bash
npm install -g @perk-net/pushplus-mcp-server
```

安装完成后，`pushplus-mcp` 命令将全局可用。

**优势**：
- ✅ 安装简单，一条命令搞定
- ✅ 自动处理依赖关系
- ✅ 支持全局命令行工具
- ✅ 无需下载源码

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

# 测试配置
npm run test
```

**适用场景**：
- 🛠️ 需要自定义功能
- 🔧 参与项目开发
- 📊 需要调试详细日志

## ⚙️ Claude Desktop 集成

### NPM 安装用户配置

根据您的操作系统选择对应的配置：

#### Windows 配置

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@perk-net/pushplus-mcp-server"
      ],
      "env": {
        "PUSHPLUS_TOKEN": "your_pushplus_token_here"
      }
    }
  }
}
```

#### Mac/Linux 配置

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "npx",
      "args": [
        "-y",
        "@perk-net/pushplus-mcp-server"
      ],
      "env": {
        "PUSHPLUS_TOKEN": "your_pushplus_token_here"
      }
    }
  }
}
```

### 源码构建用户配置

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

### 配置文件位置

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

> 📝 **配置说明**：当您在 Claude Desktop 配置中设置了 `env.PUSHPLUS_TOKEN` 后，就不需要创建 `.env` 文件了。MCP 服务器会自动读取通过 Claude Desktop 传递的环境变量。

## 📱 功能使用

### 可用工具

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

#### 5. `send_json_message` - 发送JSON消息
发送 JSON 格式的消息：

```json
{
  "title": "消息标题",
  "content": "{\"data\": \"JSON格式内容\"}",
  "topic": "群组编码（可选）",
  "to": "好友令牌（可选）",
  "pre": "预处理编码（可选）"
}
```

### 可用资源

#### 1. `pushplus://status` - 服务器状态
获取服务器运行状态和配置信息

#### 2. `pushplus://templates` - 支持的模板
获取所有支持的消息模板类型

#### 3. `pushplus://channels` - 支持的渠道
获取所有支持的推送渠道信息

### 支持的消息模板

| 模板类型 | 描述 | 示例 |
|---------|------|------|
| `html` | HTML格式消息，支持HTML标签和样式 | `<h1>标题</h1><p>内容</p>` |
| `txt` | 纯文本消息，简单易读 | `标题\n内容` |
| `json` | JSON格式消息，适合结构化数据 | `{"title": "标题", "content": "内容"}` |
| `markdown` | Markdown格式消息，支持Markdown语法 | `# 标题\n\n内容` |
| `cloudMonitor` | 云监控消息格式，适合告警通知 | `告警: 服务器CPU使用率过高` |

### 支持的推送渠道

| 渠道类型 | 描述 | 备注 |
|---------|------|------|
| `wechat` | 微信推送，通过微信公众号发送 | 默认渠道 |
| `webhook` | 第三方webhook推送 | 需要提供webhook参数 |
| `cp` | 企业微信推送 | 需要配置企业微信应用 |
| `mail` | 邮箱推送 | 需要绑定邮箱 |
| `sms` | 短信推送 | 需要绑定手机号 |

## 🛠️ 命令行工具

### NPM 安装用户

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

### 源码构建用户

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

# 开发模式
npm run dev

# 监听模式构建
npm run watch
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

## 📖 使用示例

### 1. 基本文本推送

在 Claude 中询问：
```
请使用 PushPlus 发送一条测试消息，标题是"测试消息"，内容是"这是一条来自 Claude 的测试消息"
```

Claude 会调用 `send_text_message` 工具发送纯文本消息。

### 2. HTML 格式推送

```
请发送一条 HTML 格式的消息，标题"系统通知"，内容包含：
- 一个标题
- 一个列表
- 一些样式
```

Claude 会调用 `send_html_message` 工具发送带样式的消息。

### 3. Markdown 格式推送

```
请发送一条 Markdown 格式的消息，包含代码块和表格
```

Claude 会调用 `send_markdown_message` 工具发送 Markdown 格式的消息。

### 4. JSON 格式推送

```
请发送一条 JSON 格式的消息，标题"API响应"，内容为用户数据的JSON格式
```

Claude 会调用 `send_json_message` 工具发送 JSON 格式的消息，适合发送结构化数据。

### 5. 自定义参数推送

```
请使用完整参数发送推送消息：
- 标题：重要通知
- 内容：HTML 格式的内容
- 推送渠道：微信
- 群组：开发团队
- 好友令牌：指定接收人
```

Claude 会调用 `send_push_message` 工具，使用所有可用参数。

### 6. 好友推送

```
请发送消息给特定好友，使用好友令牌：token1,token2
```

使用 `to` 参数可以指定具体的接收人，支持多人推送（逗号分隔）。

### 7. 理解响应结果

**⚠️ 重要说明**：HTTP 请求成功（状态码 200）并不代表消息发送成功，只是表示请求已被服务器接收处理。

#### 响应结果解释

当您发送消息后，会收到如下格式的响应：

```json
{
  "code": 200,
  "msg": "请求成功",
  "data": "abc123def456"
}
```

**字段说明**：
- `code`: HTTP 响应状态码
  - `200`: 请求成功被服务器接收
  - 其他值: 请求失败，需检查参数或配置
- `msg`: 服务器返回的消息说明
- `data`: **📋 流水号**（重要！）- 这是消息的唯一标识符，可用于后续查询消息发送状态
- `count`: 消息发送数量

**📌 注意事项**：
- 收到 `code: 200` 只表示服务器接受了推送请求
- 实际的消息发送可能需要一些时间完成
- 如需确认消息是否真正送达，请保存返回的 `data`（流水号）用于后续状态查询

### 8. 查询服务器状态

询问 Claude：
```
请查看 PushPlus MCP Server 的状态信息
```

Claude 会读取 `pushplus://status` 资源，显示服务器状态。

### 9. 查看支持的功能

询问 Claude：
```
PushPlus 支持哪些消息模板？
```

Claude 会读取 `pushplus://templates` 资源，显示所有支持的模板类型。

询问 Claude：
```
PushPlus 支持哪些推送渠道？
```

Claude 会读取 `pushplus://channels` 资源，显示所有支持的推送渠道。

## 🔍 故障排除

### 常见问题

#### 1. Token 无效
```
❌ 配置验证失败: PUSHPLUS_TOKEN 格式不正确，应为32位字符串
```

**解决方案**: 
- 检查您的 PushPlus Token 是否正确，Token 应该是32位的字母数字组合
- 确认 Token 是否有效且有足够的推送额度

#### 2. 推送失败
```
❌ 发送失败: HTTP请求失败: 400 Bad Request
```

**解决方案**: 
- 检查消息内容是否符合格式要求
- 确认 Token 有效且有足够的推送额度
- 检查网络连接
- 确认消息标题不超过100字符

#### 3. 理解响应状态
```
✅ HTTP请求成功
📊 响应详情:
- 状态码: 200
- 消息: 请求成功
- 📋 流水号: abc123def456 （重要！可用于查询消息发送状态）
- 计数: 1
⚠️ 注意：HTTP请求成功不代表消息已送达，实际发送可能需要一些时间。
```

**说明**:
- `状态码 200` 表示服务器成功接收了推送请求
- `流水号` 是消息的唯一标识符，请妥善保存用于后续查询
- 消息实际送达可能需要几秒到几分钟的时间
- 如需确认消息是否真正送达，可使用流水号查询消息状态

#### 4. 配置文件问题
```
❌ 配置验证失败: 缺少 PUSHPLUS_TOKEN 环境变量
```

**解决方案**: 
- 确保 `.env` 文件存在并包含正确的配置
- 或者通过环境变量直接设置 `PUSHPLUS_TOKEN`（如 Claude Desktop 配置）
- 检查环境变量是否正确传递到 MCP 服务器

#### 5. MCP 连接失败

**解决方案**:
- 确认 Claude Desktop 配置正确
- 检查命令和参数是否正确
- 重启 Claude Desktop
- 确认 NPM 包已正确安装

#### 6. NPM 包无法找到

**解决方案**:
```bash
# 重新安装
npm uninstall -g @perk-net/pushplus-mcp-server
npm install -g @perk-net/pushplus-mcp-server

# 验证安装
pushplus-mcp --version
```

## 👨‍💻 开发

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

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 相关链接

- [PushPlus 官网](https://www.pushplus.plus/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop](https://claude.ai/)

---

<div align="center">

**🎉 享受使用 PushPlus MCP Server！**

如有问题，欢迎提交 [Issue](https://github.com/your-org/pushplus-mcp/issues) 或 [Pull Request](https://github.com/your-org/pushplus-mcp/pulls)

</div>