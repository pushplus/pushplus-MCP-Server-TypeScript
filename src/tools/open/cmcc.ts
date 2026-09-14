import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { RESULT_WRAP, runOpenTool } from './helpers.js';

export function registerCmccTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_cmcc_bind',
    {
      title: '绑定新消息ClawBot',
      description: [
        'POST /open/cmcc/bind - 绑定新消息ClawBot。',
        '请求(body): apiKey(必填；中国移动新消息 Channel API Key，必须以 ak_ 或 app_ 开头)。',
        '需先在手机 5G 消息「新消息ClawBot」应用号中获取 API Key。仅支持中国移动用户。',
        '绑定成功后可用 /send 且 channel=cmcc，无需 option。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        apiKey: z.string().describe('中国移动新消息 Channel API Key，必须以 ak_ 或 app_ 开头')
      }
    },
    async ({ apiKey }) =>
      runOpenTool(client, () => client.post('/open/cmcc/bind', { apiKey }))
  );

  server.registerTool(
    'open_cmcc_info',
    {
      title: '查询新消息ClawBot绑定状态',
      description: [
        'GET /open/cmcc/info - 查询新消息ClawBot绑定状态。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: bound(0未绑定/1已绑定), apiKeyMasked(脱敏后的API Key), createTime(绑定时间)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/cmcc/info'))
  );

  server.registerTool(
    'open_cmcc_unbind',
    {
      title: '解绑新消息ClawBot',
      description: [
        'GET /open/cmcc/unbind - 高风险：解绑新消息ClawBot。',
        '请求参数: 无。',
        `${RESULT_WRAP}`
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/cmcc/unbind'))
  );

  server.registerTool(
    'open_cmcc_test',
    {
      title: '发送新消息ClawBot测试消息',
      description: [
        'GET /open/cmcc/test - 发送新消息ClawBot测试消息。',
        '请求参数: 无。未绑定会返回「未绑定新消息ClawBot」。',
        '测试成功后请到手机 5G 消息应用号中查看。',
        `${RESULT_WRAP}`
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/cmcc/test'))
  );
}
