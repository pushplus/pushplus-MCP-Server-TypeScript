import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerFriendTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_friend_get_qr_code',
    {
      title: '获取个人二维码',
      description: [
        'GET /open/friend/getQrCode - 获取个人二维码（用于添加好友）。',
        '请求(url): appId(微信公众号Id,可选), content(自定义参数,扫描后回调,可选),',
        'second(有效期秒,默认604800/7天,最长30天), scanCount(1-999或-1无限,默认-1)。',
        `${RESULT_WRAP}`,
        'data: qrCodeImgUrl(二维码图片地址)。'
      ].join(' '),
      inputSchema: {
        appId: z.string().optional().describe('微信公众号Id'),
        content: z.string().optional().describe('自定义参数，扫描后回调（可用于区分扫描渠道）'),
        second: z.number().int().optional().describe('二维码有效期（秒）；默认604800，最长30天'),
        scanCount: z.number().int().optional().describe('可扫码次数；1-999，-1无限；默认-1')
      }
    },
    async (args) => runOpenTool(client, () => client.get('/open/friend/getQrCode', args))
  );

  server.registerTool(
    'open_friend_list',
    {
      title: '好友列表',
      description: [
        'POST /open/friend/list - 获取好友列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(好友编号), friendId(好友id), token(好友令牌,发送好友消息使用),',
        'headImgUrl, nickName, emailStatus(0/1/2), havePhone(0/1), isFollow(0/1), remark, createTime。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/friend/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_friend_delete',
    {
      title: '删除好友',
      description: [
        'GET /open/friend/deleteFriend - 高风险：删除好友。',
        '请求(url): friendId(好友id,必填；来自好友列表 friendId)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        friendId: z.number().describe('好友id（好友列表的 friendId 字段）'),
        appId: z.string().optional().describe('微信公众号Id（可选）')
      }
    },
    async ({ friendId, appId }) =>
      runOpenTool(client, () => client.get('/open/friend/deleteFriend', { friendId, appId }))
  );

  server.registerTool(
    'open_friend_edit_remark',
    {
      title: '修改好友备注',
      description: [
        'POST /open/friend/editRemark - 修改好友备注。',
        '请求: id(好友编号,必填；列表 id 字段), remark(备注,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        id: z.number().describe('好友编号（列表 id 字段）'),
        remark: z.string().max(20).describe('好友备注')
      }
    },
    async ({ id, remark }) =>
      runOpenTool(client, () => client.post('/open/friend/editRemark', { id, remark }))
  );
}
