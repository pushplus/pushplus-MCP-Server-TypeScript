import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerMessageTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_message_list',
    {
      title: '消息列表',
      description: [
        'POST /open/message/list - 分页查询消息列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: channel(wechat/mail/cp/webhook), messageType(1一对一/2一对多),',
        'shortCode(消息短链码,可查发送结果), title(标题), topicName(群组名称,一对多才有), updateTime(更新时间)。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50'),
        isRead: z.number().int().optional().describe('是否已读（扩展筛选，可选）'),
        channel: z.string().optional().describe('发送渠道筛选，如 wechat/mail/cp/webhook'),
        messageType: z.number().int().optional().describe('消息类型；1-一对一，2-一对多')
      }
    },
    async ({ current, pageSize, isRead, channel, messageType }) =>
      runOpenTool(client, () =>
        client.post(
          '/open/message/list',
          pageBody({
            current,
            pageSize,
            params: { isRead, channel, messageType }
          })
        )
      )
  );

  server.registerTool(
    'open_message_send_result',
    {
      title: '查询消息发送结果',
      description: [
        'GET /open/message/sendMessageResult - 按 shortCode 查询投递结果。',
        `${RESULT_WRAP}`,
        'data: status(0未投递/1发送中/2已发送/3发送失败), errorMessage(失败原因), updateTime(更新时间)。'
      ].join(' '),
      inputSchema: {
        shortCode: z.string().describe('消息短链码；发送消息接口同步返回的短链码')
      }
    },
    async ({ shortCode }) =>
      runOpenTool(client, () =>
        client.get('/open/message/sendMessageResult', { shortCode })
      )
  );

  server.registerTool(
    'open_message_delete',
    {
      title: '删除消息',
      description: [
        'DELETE /open/message/deleteMessage - 高风险：删除后所有接收人均无法查看，且无法撤销。',
        '请求: shortCode(消息短链码，必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        shortCode: z.string().describe('消息短链码')
      }
    },
    async ({ shortCode }) =>
      runOpenTool(client, () =>
        client.delete('/open/message/deleteMessage', { shortCode })
      )
  );
}
