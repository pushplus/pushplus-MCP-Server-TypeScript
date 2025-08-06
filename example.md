# PushPlus MCP Server 使用示例

## 基本设置

1. **复制环境变量文件**
```bash
copy env.example .env
```

2. **编辑环境变量文件**
```env
# 在 .env 文件中设置您的 PushPlus Token
PUSHPLUS_TOKEN=your_pushplus_token_here_32_characters
DEBUG=true
```

3. **测试配置**
```bash
npm run test
```

## Claude Desktop 集成

在 Claude Desktop 的配置文件中添加以下配置：

**Windows 路径**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS 路径**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pushplus": {
      "command": "node",
      "args": ["D:\\path\\to\\pushplus-mcp-server\\dist\\index.js"],
      "env": {
        "PUSHPLUS_TOKEN": "your_pushplus_token_here"
      }
    }
  }
}
```

## 使用示例

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

### 7. 会员预处理

```
请发送消息并使用预处理编码 "format_code_123" 来格式化内容
```

会员用户可以使用 `pre` 参数指定预处理编码来自定义消息格式。

## 查询服务器状态

询问 Claude：
```
请查看 PushPlus MCP Server 的状态信息
```

Claude 会读取 `pushplus://status` 资源，显示服务器状态。

## 查看支持的功能

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

## 错误处理示例

### Token 无效
如果您的 Token 无效，Claude 会收到错误响应并告知您：
```
❌ 发送失败: HTTP请求失败: 403 Forbidden
```

### 参数错误
如果参数格式错误，会收到详细的错误信息：
```
❌ 发送失败: 参数验证失败: 消息标题最大长度100字符
```

## 高级用法

### 1. 批量通知
您可以要求 Claude 发送多条不同类型的消息：
```
请发送以下通知：
1. 文本消息：会议提醒
2. HTML消息：包含会议链接的通知
3. Markdown消息：会议议程
4. JSON消息：会议数据统计
```

### 2. 条件推送
```
如果当前时间是工作时间，请发送工作提醒，否则发送休息提醒
```

### 3. 模板化消息
```
请创建一个日报模板，包含今日任务完成情况，然后发送推送
```

## 故障排除

### 常见问题

1. **Token 验证失败**
   - 检查 Token 是否正确（32位字符）
   - 确认 Token 是否有效且有推送额度

2. **消息发送失败**
   - 检查网络连接
   - 确认消息内容符合格式要求
   - 检查推送渠道是否正确配置

3. **MCP 连接失败**
   - 确认 Claude Desktop 配置正确
   - 检查文件路径是否正确
   - 重启 Claude Desktop

### 调试模式

启用调试模式查看详细日志：
```env
DEBUG=true
```

### 测试连接

使用内置测试命令：
```bash
node dist/index.js --test
```

这将验证配置并发送测试消息。