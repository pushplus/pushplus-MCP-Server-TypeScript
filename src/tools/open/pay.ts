import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { RESULT_WRAP, runOpenTool } from './helpers.js';

export function registerPayTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_pay_transfer_order',
    {
      title: '积分提现',
      description: [
        'POST /open/pay/transferOrder - 高风险：发起积分提现。',
        '请求: accountId(收款账户ID,必填), points(提现积分,可选)。',
        `${RESULT_WRAP}`,
        'data: 提现业务结果对象。'
      ].join(' '),
      inputSchema: {
        accountId: z.number().describe('收款账户ID'),
        points: z.number().optional().describe('提现积分')
      }
    },
    async ({ accountId, points }) =>
      runOpenTool(client, () => client.post('/open/pay/transferOrder', { accountId, points }))
  );
}
