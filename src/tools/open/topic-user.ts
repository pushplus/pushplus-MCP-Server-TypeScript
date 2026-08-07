import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerTopicUserTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_topic_user_subscriber_list',
    {
      title: '获取群组内用户',
      description: [
        'POST /open/topicUser/subscriberList - 获取群组订阅人列表。',
        `${PAGE_REQ} params.topicId(群组编号,必填)。`,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(用户编号,可用于删除), nickName, openId, headImgUrl,',
        'userSex(0未设置/1男/2女), havePhone(0未绑定/1已绑定), isFollow(0未关注/1已关注),',
        'emailStatus(0未验证/1待验证/2已验证), followTime(关注群组时间), remark(备注)。'
      ].join(' '),
      inputSchema: {
        topicId: z.number().describe('群组编号，必填'),
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ topicId, current, pageSize }) =>
      runOpenTool(client, () =>
        client.post('/open/topicUser/subscriberList', pageBody({ current, pageSize, params: { topicId } }))
      )
  );

  server.registerTool(
    'open_topic_user_delete',
    {
      title: '删除群组内用户',
      description: [
        'POST /open/topicUser/deleteTopicUser - 高风险：删除群组订阅用户。',
        '请求(url): topicRelationId(用户编号,必填；来自订阅人列表的 id)。',
        `${RESULT_WRAP}`,
        'data: 如「删除成功」。'
      ].join(' '),
      inputSchema: {
        topicRelationId: z.number().describe('用户编号（订阅关系ID），来自订阅人列表 id 字段')
      }
    },
    async ({ topicRelationId }) =>
      runOpenTool(client, () =>
        client.request('/open/topicUser/deleteTopicUser', {
          method: 'POST',
          query: { topicRelationId }
        })
      )
  );

  server.registerTool(
    'open_topic_user_edit_remark',
    {
      title: '修改订阅人备注',
      description: [
        'POST /open/topicUser/editRemark - 修改订阅人备注。',
        '请求: id(用户编号,必填), remark(备注,必填,20字以内)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        id: z.number().describe('用户编号（订阅关系ID）'),
        remark: z.string().max(20).describe('订阅人备注信息；20个字以内')
      }
    },
    async ({ id, remark }) =>
      runOpenTool(client, () => client.post('/open/topicUser/editRemark', { id, remark }))
  );
}
