# PushPlus MCP Server 快速开始

## 🚀 一分钟快速体验

### 步骤 1: 安装 PushPlus MCP Server

#### 方式一：从 NPM 安装（推荐）

```bash
npm install -g @perk-net/pushplus-mcp-server
```

#### 方式二：从源码构建

```bash
# 克隆项目
git clone https://github.com/your-org/pushplus-mcp
cd pushplus-mcp

# 安装依赖
npm install
```

### 步骤 2: 配置环境

#### 对于 NPM 安装的用户：

```bash
# 设置环境变量
export PUSHPLUS_TOKEN=your_token_here
```

#### 对于源码构建的用户：

```bash
# 复制环境变量模板
copy env.example .env

# 编辑 .env 文件，填入您的 PushPlus Token
# PUSHPLUS_TOKEN=your_token_here
```

> 📝 **获取 PushPlus Token**:
> 1. 访问 [PushPlus 官网](https://www.pushplus.plus/)
> 2. 微信扫码登录
> 3. 在用户中心获取 Token

### 步骤 3: 构建项目（仅源码构建需要）

```bash
npm run build
```

### 步骤 4: 测试配置

#### 对于 NPM 安装的用户：

```bash
pushplus-mcp --test
```

#### 对于源码构建的用户：

```bash
npm run test
```

如果配置正确，您会收到一条测试推送消息！

### 步骤 5: 集成到 Claude Desktop

1. 打开 Claude Desktop 设置 → Developer → Edit Config
2. 添加以下配置：

#### 对于 NPM 安装的用户（推荐）：

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "pushplus-mcp",
      "env": {
        "PUSHPLUS_TOKEN": "您的Token"
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
      "args": ["您的项目路径/dist/index.js"],
      "env": {
        "PUSHPLUS_TOKEN": "您的Token"
      }
    }
  }
}
```

**注意：** 当您在 Claude Desktop 配置中的 `env` 参数里设置了 `PUSHPLUS_TOKEN` 后，就不需要再创建 `.env` 文件了。环境变量会自动传递给 MCP 服务器。

3. 重启 Claude Desktop

### 步骤 6: 开始使用！

在 Claude 中说：
```
"请发送一条测试推送消息到我的微信"
```

🎉 恭喜！您已成功设置 PushPlus MCP Server！

## 📱 支持的功能

- ✅ 发送文本消息
- ✅ 发送 HTML 消息  
- ✅ 发送 Markdown 消息
- ✅ 自定义推送渠道
- ✅ 群组推送
- ✅ 状态查询

## 🔧 常用命令

### 对于 NPM 安装的用户：

```bash
# 查看帮助
pushplus-mcp --help

# 查看版本
pushplus-mcp --version

# 测试配置
pushplus-mcp --test

# 查看当前配置
pushplus-mcp --config

# 启动服务器
pushplus-mcp
```

### 对于源码构建的用户：

```bash
# 查看帮助
node dist/index.js --help

# 查看版本
node dist/index.js --version

# 测试配置
npm run test

# 查看当前配置
node dist/index.js --config

# 开发模式
npm run dev

# 监听模式构建
npm run watch
```

## 🆘 遇到问题？

1. **检查 Token**: 确保 Token 是 32 位字符串
2. **检查网络**: 确认能访问 pushplus.plus
3. **查看日志**: 设置 `DEBUG=true` 查看详细日志
4. **重新测试**: 运行 `npm run test` 验证配置

更多详细信息请查看 [README.md](./README.md) 和 [example.md](./example.md)。