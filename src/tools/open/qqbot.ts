import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerQqBotTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_qqbot_get_bind_link',
    {
      title: 'QQ 机器人绑定链接',
      description: [
        'GET /open/qqBot/getBindLink - 获取 QQ 机器人绑定链接与绑定码。',
        '请求(url): refresh(是否强制刷新,可选,默认false；true 会使旧绑定码失效并重新生成)。',
        `${RESULT_WRAP}`,
        'data: url(带参分享链接,可生成二维码；已绑定用户可能为空), bindCode(绑定码,已是好友时需私聊发给机器人,认领QQ群也用此码),',
        'expireSeconds(有效期秒数,默认300), botAppId(分配的机器人appId), botName(机器人名称), botAvatar(机器人头像)。'
      ].join(' '),
      inputSchema: {
        refresh: z.boolean().optional().describe('是否强制刷新绑定码，默认false')
      }
    },
    async ({ refresh }) =>
      runOpenTool(client, () =>
        client.get('/open/qqBot/getBindLink', refresh === undefined ? undefined : { refresh })
      )
  );

  server.registerTool(
    'open_qqbot_bot_info',
    {
      title: 'QQ 机器人绑定状态',
      description: [
        'GET /open/qqBot/botInfo - 查询 QQ 机器人绑定状态。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: isBind(0未绑定/1已绑定), receiveStatus(1可接收/0用户已关闭单聊接收), createTime(绑定时间),',
        'botInfo(机器人详情: botId, username, avatar, appId, shareUrl(可用于拉机器人进群))。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/qqBot/botInfo'))
  );

  server.registerTool(
    'open_qqbot_unbind',
    {
      title: '解绑 QQ 机器人',
      description: [
        'GET /open/qqBot/unbind - 高风险：解绑 QQ 机器人。',
        '请求参数: 无。',
        `${RESULT_WRAP}`
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/qqBot/unbind'))
  );

  server.registerTool(
    'open_qqbot_group_list',
    {
      title: 'QQ 机器人已加入群列表',
      description: [
        'GET /open/qqBot/groupList - 获取机器人已加入的 QQ 群列表。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: 数组，项含 id(QQ群编号,新增群配置时作为 qqGroupId), groupOpenId, groupRemark,',
        'status(1在群/2群消息接收关闭), groupName(接口未授权时为空), groupFingerMemo(群简介),',
        'groupClassText(群分类), groupTags(群标签), groupMemberNum(群成员数), createTime。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/qqBot/groupList'))
  );

  server.registerTool(
    'open_qqbot_list',
    {
      title: 'QQ 机器人群配置列表',
      description: [
        'POST /open/qqBot/list - 获取 QQ 机器人群配置列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(配置编号), qqName(配置名称), qqCode(配置编码,发送消息时作为 option 传入),',
        'sendType(2发到QQ群), qqGroupId(QQ群编号), groupRemark, groupOpenId, groupName, updateTime。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/qqBot/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_qqbot_add',
    {
      title: '新增 QQ 机器人群配置',
      description: [
        'POST /open/qqBot/add - 新增 QQ 机器人群配置（发到指定QQ群；发给自己无需配置）。',
        '请求: qqName(配置名称,必填,最多64字符), qqCode(配置编码,必填,最多32字符,仅字母/数字/下划线/中划线,创建后不可修改),',
        'qqGroupId(QQ群编号,必填,取自 groupList 的 id；该群需允许机器人主动消息)。',
        '限制: 普通用户最多5个，会员最多30个，同一QQ群不可重复创建。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        qqName: z.string().describe('配置名称，最多64个字符'),
        qqCode: z.string().describe('配置编码，最多32个字符，仅字母、数字、下划线和中划线'),
        qqGroupId: z.number().describe('QQ群编号，取自 open_qqbot_group_list 的 id')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/qqBot/add', args))
  );

  server.registerTool(
    'open_qqbot_edit',
    {
      title: '修改 QQ 机器人群配置',
      description: [
        'POST /open/qqBot/edit - 修改 QQ 机器人群配置。配置编码(qqCode)不允许修改，避免已在使用的 option 失效。',
        '请求: id(配置编号,必填), qqName(配置名称,必填), qqGroupId(QQ群编号,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        id: z.number().describe('配置编号'),
        qqName: z.string().describe('配置名称，最多64个字符'),
        qqGroupId: z.number().describe('QQ群编号')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/qqBot/edit', args))
  );

  server.registerTool(
    'open_qqbot_delete',
    {
      title: '删除 QQ 机器人群配置',
      description: [
        'DELETE /open/qqBot/delete - 高风险：删除 QQ 机器人群配置，删除后使用该编码的 option 将失效。',
        '请求(url): id(配置编号,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { id: z.number().describe('配置编号') }
    },
    async ({ id }) => runOpenTool(client, () => client.delete('/open/qqBot/delete', { id }))
  );
}
