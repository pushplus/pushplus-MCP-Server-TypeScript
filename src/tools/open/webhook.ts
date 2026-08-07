import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

const WEBHOOK_TYPE =
  'webhook类型；1企业微信机器人,2钉钉,3飞书,4Server酱,50bark,6企业微信应用,7腾讯轻联,8IFTTT,9集简云,10Gotify,11WxPusher,12自定义';

export function registerWebhookTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_webhook_add',
    {
      title: '新增 webhook',
      description: [
        'POST /open/webhook/add - 新增 webhook 配置。',
        `请求: webhookCode(编码,必填), webhookName(名称,必填), webhookType(${WEBHOOK_TYPE},必填),`,
        'webhookUrl(调用url,必填), httpMethod/headers/body(仅自定义类型12需要)。',
        `${RESULT_WRAP}`,
        'data: 新建 webhook 编号(数字)。'
      ].join(' '),
      inputSchema: {
        webhookName: z.string().describe('webhook名称'),
        webhookCode: z.string().describe('webhook编码'),
        webhookUrl: z.string().describe('调用的url地址'),
        webhookType: z.number().int().describe(WEBHOOK_TYPE),
        httpMethod: z.string().optional().describe('请求方法（仅自定义类型需要）'),
        body: z.string().optional().describe('body内容（仅自定义类型需要）'),
        headers: z.string().optional().describe('请求头（仅自定义类型需要）')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/webhook/add', args))
  );

  server.registerTool(
    'open_webhook_list',
    {
      title: 'webhook 列表',
      description: [
        'POST /open/webhook/list - 获取 webhook 列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        `list 项: id, webhookCode, webhookName, webhookType(${WEBHOOK_TYPE}), webhookTypeName, webhookUrl, createTime。`
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/webhook/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_webhook_detail',
    {
      title: 'webhook 详情',
      description: [
        'GET /open/webhook/detail - 查看 webhook 详情。',
        '请求(url): webhookId(webhook编号,必填)。',
        `${RESULT_WRAP}`,
        `data: id, webhookCode, webhookName, webhookType(${WEBHOOK_TYPE}), webhookTypeName, webhookUrl, createTime,`,
        'httpMethod/headers/body(仅自定义类型返回)。'
      ].join(' '),
      inputSchema: { webhookId: z.number().describe('webhook编号') }
    },
    async ({ webhookId }) =>
      runOpenTool(client, () => client.get('/open/webhook/detail', { webhookId }))
  );

  server.registerTool(
    'open_webhook_delete',
    {
      title: '删除 webhook',
      description: [
        'GET /open/webhook/delete - 高风险：删除 webhook。',
        '请求(url): webhookId(webhook编号,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { webhookId: z.number().describe('webhook编号') }
    },
    async ({ webhookId }) =>
      runOpenTool(client, () => client.get('/open/webhook/delete', { webhookId }))
  );

  server.registerTool(
    'open_webhook_edit',
    {
      title: '修改 webhook',
      description: [
        'POST /open/webhook/edit - 修改 webhook 配置。',
        `请求: id(编号,必填), webhookCode/Name/Type/Url(必填), httpMethod/headers/body(自定义类型可选)。`,
        `webhookType: ${WEBHOOK_TYPE}。`,
        `${RESULT_WRAP}`,
        'data: 如「修改成功」。'
      ].join(' '),
      inputSchema: {
        id: z.number().describe('webhook编号'),
        webhookName: z.string().describe('webhook名称'),
        webhookCode: z.string().describe('webhook编码'),
        webhookUrl: z.string().describe('调用的url地址'),
        webhookType: z.number().int().describe(WEBHOOK_TYPE),
        httpMethod: z.string().optional().describe('请求方法（仅自定义类型需要）'),
        body: z.string().optional().describe('body内容（仅自定义类型需要）'),
        headers: z.string().optional().describe('请求头（仅自定义类型需要）')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/webhook/edit', args))
  );
}
