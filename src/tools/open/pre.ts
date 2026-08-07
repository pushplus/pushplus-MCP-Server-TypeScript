import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerPreTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_pre_add',
    {
      title: '新增预处理信息',
      description: [
        'POST /open/pre/add - 新增预处理（需会员）。',
        '请求: content(预处理代码,必填), preName(名称,必填), preCode(编码,必填), contentType(编程语言;1-JavaScript,必填)。',
        `${RESULT_WRAP}`,
        'data: 新建预处理编号(数字)。'
      ].join(' '),
      inputSchema: {
        preName: z.string().describe('预处理名称'),
        preCode: z.string().describe('预处理编码'),
        content: z.string().describe('预处理代码'),
        contentType: z.number().int().describe('编程语言类型；1-JavaScript')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/pre/add', args))
  );

  server.registerTool(
    'open_pre_list',
    {
      title: '预处理信息列表',
      description: [
        'POST /open/pre/list - 获取预处理列表（需会员）。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id, preName, preCode, contentType(1-JavaScript), createTime。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/pre/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_pre_detail',
    {
      title: '预处理信息详情',
      description: [
        'GET /open/pre/detail - 预处理详情（需会员）。',
        '请求(url): preId(预处理编号,必填)。',
        `${RESULT_WRAP}`,
        'data: id, preName, preCode, contentType(1-JavaScript), content(预处理代码)。'
      ].join(' '),
      inputSchema: { preId: z.number().describe('预处理信息编号') }
    },
    async ({ preId }) =>
      runOpenTool(client, () => client.get('/open/pre/detail', { preId }))
  );

  server.registerTool(
    'open_pre_delete',
    {
      title: '删除预处理信息',
      description: [
        'DELETE /open/pre/delete - 高风险：删除预处理（需会员）。',
        '请求(url): preId(预处理编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「删除成功」。'
      ].join(' '),
      inputSchema: { preId: z.number().describe('预处理信息编号') }
    },
    async ({ preId }) =>
      runOpenTool(client, () => client.delete('/open/pre/delete', { preId }))
  );

  server.registerTool(
    'open_pre_edit',
    {
      title: '修改预处理信息',
      description: [
        'POST /open/pre/edit - 修改预处理（需会员）。',
        '请求: id(编号,必填), content/preName/preCode/contentType(均为必填；contentType=1 JavaScript)。',
        `${RESULT_WRAP}`,
        'data: 如「修改成功」。'
      ].join(' '),
      inputSchema: {
        id: z.number().describe('预处理信息编号'),
        preName: z.string().describe('预处理名称'),
        preCode: z.string().describe('预处理编码'),
        content: z.string().describe('预处理代码'),
        contentType: z.number().int().describe('编程语言类型；1-JavaScript')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/pre/edit', args))
  );

  server.registerTool(
    'open_pre_test',
    {
      title: '测试预处理代码',
      description: [
        'POST /open/pre/test - 测试预处理代码（需会员）。',
        '请求: content(预处理代码,必填), contentType(1-JavaScript,必填), message(测试消息内容,必填)。',
        `${RESULT_WRAP}`,
        'data: 预处理后的消息内容字符串。'
      ].join(' '),
      inputSchema: {
        message: z.string().describe('测试消息内容'),
        content: z.string().describe('预处理代码'),
        contentType: z.number().int().describe('编程语言类型；1-JavaScript')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/pre/test', args))
  );
}
