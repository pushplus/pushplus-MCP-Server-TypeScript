# PushPlus MCP Server 安装指南

## 🚀 推荐方式：NPM 安装

### 1. 全局安装

```bash
npm install -g @perk-net/pushplus-mcp-server
```

安装完成后，`pushplus-mcp` 命令将全局可用，无需下载源码。

### 2. 配置环境变量

```bash
export PUSHPLUS_TOKEN=your_pushplus_token_here
```

### 3. 测试安装

```bash
pushplus-mcp --test
```

### 4. 在 Claude Desktop 中配置

编辑 Claude Desktop 配置文件：

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

## 🛠️ 开发方式：源码构建

### 1. 克隆项目

```bash
git clone https://github.com/your-org/pushplus-mcp
cd pushplus-mcp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境

```bash
cp .env.example .env
# 编辑 .env 文件，设置 PUSHPLUS_TOKEN
```

### 4. 构建项目

```bash
npm run build
```

### 5. 测试配置

```bash
npm run test
```

### 6. 在 Claude Desktop 中配置

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js"],
      "env": {
        "PUSHPLUS_TOKEN": "您的Token"
      }
    }
  }
}
```

## 获取 PushPlus Token

1. 访问 [PushPlus 官网](https://www.pushplus.plus/)
2. 微信扫码登录
3. 在用户中心获取您的 Token

## 验证安装

安装完成后，在 Claude 中说：

```
"请发送一条测试推送消息到我的微信"
```

如果收到推送消息，说明安装成功！