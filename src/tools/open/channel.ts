import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerChannelTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_mail_list',
    {
      title: '邮箱渠道列表',
      description: [
        'POST /open/mail/list - 获取邮箱渠道列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(邮箱编号), mailName(邮箱名称), mailCode(邮箱编码)。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/mail/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_mail_detail',
    {
      title: '邮箱渠道详情',
      description: [
        'GET /open/mail/detail - 邮箱渠道详情。',
        '请求(url): mailId(邮箱编号,必填)。',
        `${RESULT_WRAP}`,
        'data: id, mailName, mailCode, account(邮箱账户), password(邮箱密码),',
        'smtpServer, smtpSsl(1启用/0不启用), smtpPort, createTime。'
      ].join(' '),
      inputSchema: { mailId: z.number().describe('邮箱编号') }
    },
    async ({ mailId }) =>
      runOpenTool(client, () => client.get('/open/mail/detail', { mailId }))
  );

  server.registerTool(
    'open_mp_list',
    {
      title: '微信公众号渠道列表',
      description: [
        'POST /open/mp/list - 获取微信公众号渠道列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id, nickName, headImg, principalName(主体名称), authorizationAppid,',
        'funcInfo(权限集), serviceType(0订阅号/1历史升级订阅号/2服务号),',
        'verifyType(-1未认证/0微信认证), alias(微信号), updateTime。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/mp/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_mp_detail',
    {
      title: '公众号详情',
      description: [
        'GET /open/mp/detail - 公众号详情。',
        '请求(url): id(微信公众号编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 公众号配置详情字段（同列表并可能更完整）。'
      ].join(' '),
      inputSchema: { id: z.number().describe('微信公众号编号') }
    },
    async ({ id }) =>
      runOpenTool(client, () => client.get('/open/mp/detail', { id }))
  );

  server.registerTool(
    'open_cp_list',
    {
      title: '企业微信应用渠道列表',
      description: [
        'POST /open/cp/list - 获取企业微信应用列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(编号), cpName(应用名称), cpCode(应用编码)。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/cp/list', pageBody({ current, pageSize })))
  );
}
