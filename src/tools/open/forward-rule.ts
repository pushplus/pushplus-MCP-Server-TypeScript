import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, parseJsonField, runOpenTool } from './helpers.js';

const FORWARD_SOURCE = '触发来源；0-全部，1-消息接口，2-邮件';
const FORWARD_MODE =
  '消息规则总开关；0-关闭（推送与原来一致），1-开启且未命中仍按默认推送，2-开启且未命中不推送';
const VAR_SOURCE = '变量来源；1-请求头，2-Query，3-请求体，4-URL路径，5-主题（邮件）';
const EXTRACT_TYPE = '提取方式；1-序列化数据，2-正则，3-JSONPath，4-原始全文';

const saveFields = {
  ruleName: z.string().describe('规则名称'),
  tokenId: z.number().int().optional().describe('绑定令牌；-1全部令牌，0用户令牌，大于0为消息令牌id'),
  sourceType: z.number().int().optional().describe(FORWARD_SOURCE),
  status: z.number().int().optional().describe('状态；1-启用，0-停用'),
  sort: z.number().int().optional().describe('匹配顺序，越小越先匹配'),
  condition: z.string().optional().describe(
    '图形化触发条件JSON，如 {"logic":"and","items":[{"varName":"alertState","operator":"eq","value":"ALERT"}]}'
  ),
  conditionExpr: z.string().optional().describe('手写触发条件表达式；仅在没有图形化条件时使用'),
  titleTemplate: z.string().optional().describe('消息标题模板；为空则用原始标题。支持{{变量名}}'),
  contentTemplate: z.string().optional().describe('消息内容模板；为空则用原始内容。支持{{变量名}}'),
  template: z.string().optional().describe('消息模板；html/markdown/txt/json，或{{变量名}}'),
  pre: z.string().optional().describe('预处理编码；支持{{变量名}}'),
  stopOnMatch: z.number().int().optional().describe('命中后是否不再匹配后续规则；1-是，0-否'),
  limitPeriod: z.number().int().optional().describe('频率限制周期，单位秒；0不限制'),
  limitCount: z.number().int().optional().describe('频率限制周期内最大触发次数；0不限制'),
  activeStartTime: z.string().optional().describe('触发时间段开始，HH:mm'),
  activeEndTime: z.string().optional().describe('触发时间段结束，HH:mm'),
  activeWeekdays: z.string().optional().describe('触发星期，逗号分隔1-7，例如1,2,3,4,5'),
  remark: z.string().optional().describe('备注'),
  variables: z.string().optional().describe(
    `模板变量JSON数组。项含varName,sourceType(${VAR_SOURCE}),extractType(${EXTRACT_TYPE}),extractKey,defaultValue,sort`
  ),
  targets: z.string().optional().describe(
    '发送目标JSON数组。项含channel,option,messageType(one/topic/friend),topic,to,sort'
  )
};

function buildSaveBody(args: Record<string, unknown>): Record<string, unknown> {
  return {
    ...omitUndefined({
      id: args.id,
      ruleName: args.ruleName,
      tokenId: args.tokenId,
      sourceType: args.sourceType,
      status: args.status,
      sort: args.sort,
      conditionExpr: args.conditionExpr,
      titleTemplate: args.titleTemplate,
      contentTemplate: args.contentTemplate,
      template: args.template,
      pre: args.pre,
      stopOnMatch: args.stopOnMatch,
      limitPeriod: args.limitPeriod,
      limitCount: args.limitCount,
      activeStartTime: args.activeStartTime,
      activeEndTime: args.activeEndTime,
      activeWeekdays: args.activeWeekdays,
      remark: args.remark
    }),
    ...omitUndefined({
      condition: parseJsonField(args.condition as string | undefined),
      variables: parseJsonField(args.variables as string | undefined),
      targets: parseJsonField(args.targets as string | undefined)
    })
  };
}

function omitUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export function registerForwardRuleTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_forward_rule_list',
    {
      title: '消息规则列表',
      description: [
        'POST /open/forwardRule/list - 获取消息规则列表（需会员才能开启）。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        `list 项: id, tokenId(-1全部令牌/0用户令牌/>0消息令牌id), tokenName, ruleName,`,
        `sourceType(${FORWARD_SOURCE}), sourceTypeName, status(1启用/0停用), sort, conditionExpr, targetCount, createTime。`
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/forwardRule/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_forward_rule_detail',
    {
      title: '消息规则详情',
      description: [
        'GET /open/forwardRule/detail - 消息规则详情（需会员才能开启）。',
        '请求(url): ruleId(规则编号,必填)。',
        `${RESULT_WRAP}`,
        `data 含规则字段、condition、variables、targets。${FORWARD_SOURCE}；${VAR_SOURCE}；${EXTRACT_TYPE}。`
      ].join(' '),
      inputSchema: { ruleId: z.number().describe('规则编号') }
    },
    async ({ ruleId }) =>
      runOpenTool(client, () => client.get('/open/forwardRule/detail', { ruleId }))
  );

  server.registerTool(
    'open_forward_rule_add',
    {
      title: '新增消息规则',
      description: [
        'POST /open/forwardRule/add - 新增消息规则（需会员才能开启）。',
        '必填: ruleName。variables/targets/condition 传 JSON 字符串。',
        `${FORWARD_SOURCE}。`,
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: saveFields
    },
    async (args) =>
      runOpenTool(client, () => client.post('/open/forwardRule/add', buildSaveBody(args)))
  );

  server.registerTool(
    'open_forward_rule_edit',
    {
      title: '修改消息规则',
      description: [
        'POST /open/forwardRule/edit - 修改消息规则（需会员才能开启）；会整体覆盖变量和发送目标。',
        '必填: id, ruleName。其余同新增。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        id: z.number().describe('规则编号'),
        ...saveFields
      }
    },
    async (args) =>
      runOpenTool(client, () => client.post('/open/forwardRule/edit', buildSaveBody(args)))
  );

  server.registerTool(
    'open_forward_rule_delete',
    {
      title: '删除消息规则',
      description: [
        'DELETE /open/forwardRule/delete - 高风险：删除消息规则。',
        '请求(url): ruleId(规则编号,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { ruleId: z.number().describe('规则编号') }
    },
    async ({ ruleId }) =>
      runOpenTool(client, () => client.delete('/open/forwardRule/delete', { ruleId }))
  );

  server.registerTool(
    'open_forward_rule_change_status',
    {
      title: '启用停用消息规则',
      description: [
        'GET /open/forwardRule/changeStatus - 启用或停用消息规则。',
        '请求(url): ruleId, status(1启用/0停用)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        ruleId: z.number().describe('规则编号'),
        status: z.number().int().describe('状态；1-启用，0-停用')
      }
    },
    async ({ ruleId, status }) =>
      runOpenTool(client, () => client.get('/open/forwardRule/changeStatus', { ruleId, status }))
  );

  server.registerTool(
    'open_forward_rule_test',
    {
      title: '测试消息规则',
      description: [
        'POST /open/forwardRule/test - 用模拟请求测试规则，不会真正发送（需会员才能开启）。',
        `${RESULT_WRAP}`,
        'data: variables, matched, conditionExpr, errorMessage, title, content, template。'
      ].join(' '),
      inputSchema: {
        sourceType: z.number().int().optional().describe('模拟来源；1-消息接口，2-邮件'),
        contentType: z.string().optional().describe('模拟请求的Content-Type'),
        headers: z.string().optional().describe('模拟请求头JSON对象'),
        query: z.string().optional().describe('模拟Query参数JSON对象'),
        body: z.string().optional().describe('模拟请求体；邮件来源时作为邮件正文'),
        title: z.string().optional().describe('模拟原始标题；邮件来源时作为邮件主题'),
        mailFrom: z.string().optional().describe('模拟发件人，邮件来源时使用'),
        mailTo: z.string().optional().describe('模拟收件人，邮件来源时使用'),
        mailCc: z.string().optional().describe('模拟抄送，邮件来源时使用'),
        condition: z.string().optional().describe('图形化触发条件JSON'),
        conditionExpr: z.string().optional().describe('手写触发条件表达式'),
        titleTemplate: z.string().optional().describe('通知标题模板'),
        contentTemplate: z.string().optional().describe('通知正文模板'),
        template: z.string().optional().describe('消息模板'),
        pre: z.string().optional().describe('预处理编码'),
        variables: z.string().optional().describe('模板变量JSON数组')
      }
    },
    async (args) =>
      runOpenTool(client, () =>
        client.post(
          '/open/forwardRule/test',
          omitUndefined({
            sourceType: args.sourceType,
            contentType: args.contentType,
            headers: parseJsonField(args.headers),
            query: parseJsonField(args.query),
            body: args.body,
            title: args.title,
            mailFrom: args.mailFrom,
            mailTo: args.mailTo,
            mailCc: args.mailCc,
            condition: parseJsonField(args.condition),
            conditionExpr: args.conditionExpr,
            titleTemplate: args.titleTemplate,
            contentTemplate: args.contentTemplate,
            template: args.template,
            pre: args.pre,
            variables: parseJsonField(args.variables)
          })
        )
      )
  );

  server.registerTool(
    'open_forward_rule_get_setting',
    {
      title: '获取消息规则模式',
      description: [
        'GET /open/forwardRule/setting - 获取消息规则总开关。',
        `${RESULT_WRAP}`,
        `data.mode: ${FORWARD_MODE}。`
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/forwardRule/setting'))
  );

  server.registerTool(
    'open_forward_rule_save_setting',
    {
      title: '设置消息规则模式',
      description: [
        'GET /open/forwardRule/setting - 设置消息规则总开关。',
        'mode为1或2时需开通会员，否则返回「消息规则需开通会员后才能开启」。',
        `请求(url): mode(${FORWARD_MODE})。`,
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        mode: z.number().int().describe(FORWARD_MODE)
      }
    },
    async ({ mode }) =>
      runOpenTool(client, () => client.get('/open/forwardRule/setting', { mode }))
  );
}
