import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { RESULT_WRAP, runOpenTool } from './helpers.js';

export function registerClawBotTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_clawbot_get_bot_qrcode',
    {
      title: 'ClawBot 绑定二维码',
      description: [
        'GET /open/clawBot/getBotQrcode - 获取微信 ClawBot 绑定二维码。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: url(二维码地址), qrcode(二维码编号,用于查询扫码状态)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/clawBot/getBotQrcode'))
  );

  server.registerTool(
    'open_clawbot_get_qrcode_status',
    {
      title: 'ClawBot 扫码结果查询',
      description: [
        'GET /open/clawBot/getQrcodeStatus - 查询扫码绑定状态。',
        '请求(url): qrcode(二维码编号,必填；来自 getBotQrcode 的 data.qrcode)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { qrcode: z.string().describe('二维码编号（getBotQrcode 返回的 qrcode）') }
    },
    async ({ qrcode }) =>
      runOpenTool(client, () =>
        client.get('/open/clawBot/getQrcodeStatus', { qrcode }, 30000)
      )
  );

  server.registerTool(
    'open_clawbot_bot_info',
    {
      title: 'ClawBot 绑定详情',
      description: [
        'GET /open/clawBot/botInfo - 获取已绑定机器人详情。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: createTime(绑定时间), haveContextToken(是否有对话令牌)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/clawBot/botInfo'))
  );

  server.registerTool(
    'open_clawbot_unbind',
    {
      title: '解绑 ClawBot',
      description: [
        'GET /open/clawBot/unbind - 高风险：解绑微信 ClawBot。',
        '请求参数: 无。',
        `${RESULT_WRAP}`
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/clawBot/unbind'))
  );

  server.registerTool(
    'open_clawbot_get_msg',
    {
      title: 'ClawBot 获取发送消息',
      description: [
        'GET /open/clawBot/getMsg - 获取 ClawBot 侧消息（可能耗时较长）。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: 数组，项含 type(1文字/3语音), text(消息内容)。'
      ].join(' ')
    },
    async () =>
      runOpenTool(client, () => client.get('/open/clawBot/getMsg', undefined, 60000))
  );
}
