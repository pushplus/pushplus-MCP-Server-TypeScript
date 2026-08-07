import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerTokenTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_token_list',
    {
      title: '消息 token 列表',
      description: [
        'POST /open/token/list - 分页获取消息 token 列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(消息token编号), name(令牌名称), expireTime(过期时间), token(消息token字符串)。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/token/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_token_add',
    {
      title: '新增消息 token',
      description: [
        'POST /open/token/add - 新增消息 token。',
        '请求: name(令牌名称,必填), expireTime(过期时间,可选,默认2999-12-31)。',
        `${RESULT_WRAP}`,
        'data: 新建的消息 token 字符串。'
      ].join(' '),
      inputSchema: {
        name: z.string().describe('令牌名称，必填'),
        expireTime: z.string().optional().describe("过期时间，如 2035-05-09 22:34:00；默认 '2999-12-31'")
      }
    },
    async ({ name, expireTime }) =>
      runOpenTool(client, () => client.post('/open/token/add', { name, expireTime }))
  );

  server.registerTool(
    'open_token_delete',
    {
      title: '删除消息 token',
      description: [
        'DELETE /open/token/deleteToken - 高风险：删除消息 token。',
        '请求(url): id(消息token编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「删除成功」。'
      ].join(' '),
      inputSchema: {
        id: z.number().describe('消息 token 编号')
      }
    },
    async ({ id }) =>
      runOpenTool(client, () => client.delete('/open/token/deleteToken', { id }))
  );

  server.registerTool(
    'open_token_edit',
    {
      title: '修改消息 token',
      description: [
        'POST /open/token/edit - 修改消息 token。',
        '请求: id(编号,必填), name(令牌名称,必填), expireTime(过期时间,可选,默认2999-12-31)。',
        `${RESULT_WRAP}`,
        'data: 如「修改成功」。'
      ].join(' '),
      inputSchema: {
        id: z.number().describe('消息 token 编号'),
        name: z.string().describe('令牌名称'),
        expireTime: z.string().optional().describe("过期时间；默认 '2999-12-31'")
      }
    },
    async ({ id, name, expireTime }) =>
      runOpenTool(client, () => client.post('/open/token/edit', { id, name, expireTime }))
  );
}
