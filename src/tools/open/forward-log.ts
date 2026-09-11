import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

const FORWARD_MATCH =
  '匹配结果；0-条件不满足，1-已转发，2-频率限制，3-不在触发时间段，4-执行异常';

export function registerForwardLogTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_forward_log_list',
    {
      title: '消息规则触发记录列表',
      description: [
        'POST /open/forwardLog/list - 获取触发记录列表。',
        `${PAGE_REQ} 可按 ruleId、matchResult 筛选。`,
        `${FORWARD_MATCH}。`,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id, ruleId, ruleName, sourceType, sourceTypeName, requestIp, matchResult, matchResultName, shortCodes, errorMessage, createTime。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50'),
        ruleId: z.number().optional().describe('按规则编号筛选'),
        matchResult: z.number().int().optional().describe(FORWARD_MATCH)
      }
    },
    async ({ current, pageSize, ruleId, matchResult }) =>
      runOpenTool(client, () => {
        const params: Record<string, unknown> = {};
        if (ruleId != null) params.ruleId = ruleId;
        if (matchResult != null) params.matchResult = matchResult;
        return client.post(
          '/open/forwardLog/list',
          pageBody({ current, pageSize, params: Object.keys(params).length ? params : undefined })
        );
      })
  );

  server.registerTool(
    'open_forward_log_detail',
    {
      title: '消息规则触发记录详情',
      description: [
        'GET /open/forwardLog/detail - 查看触发记录详情。',
        '请求(url): logId(记录编号,必填)。',
        `${RESULT_WRAP}`,
        'data: id, ruleId, ruleName, sourceType, sourceTypeName, requestIp, requestMethod,',
        `requestHeaders, requestQuery, requestBody, variables, matchResult(${FORWARD_MATCH}), matchResultName, shortCodes, errorMessage, createTime。`
      ].join(' '),
      inputSchema: { logId: z.number().describe('记录编号') }
    },
    async ({ logId }) =>
      runOpenTool(client, () => client.get('/open/forwardLog/detail', { logId }))
  );
}
