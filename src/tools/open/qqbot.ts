import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

const BOT_APP_ID_HINT = 'botAppId 取自 open_qqbot_my_bots 返回的 bots[].botAppId。';

const BOT_INFO_FIELDS =
  'botId, username, avatar, botAppId, shareUrl(可用于拉机器人进群), botType(1官方机器人/2自有机器人)';

const CONFIG_REQ = [
  'sendType(1发给自己/2发到QQ群,可选,默认2),',
  'qqGroupId(QQ群编号,sendType=2时必填,取自 groupList 的 id；该群需允许机器人主动消息),',
  'botAppId(机器人appId,sendType=1时必填且需已绑定；sendType=2时可不填,以群所在机器人为准)。'
].join(' ');

const configSchema = {
  sendType: z.number().int().optional().describe('发送类型：1发给自己，2发到QQ群；默认2'),
  qqGroupId: z.number().optional().describe('QQ群编号，sendType=2时必填，取自 open_qqbot_group_list 的 id'),
  botAppId: z.string().optional().describe('发送使用的机器人appId，sendType=1时必填')
};

const customBotSchema = {
  botAppId: z.string().describe('QQ开放平台机器人AppID，最多32个字符'),
  appSecret: z.string().describe('QQ开放平台机器人AppSecret，最多64个字符')
};

const optionalBotAppId = (desc: string) => ({
  botAppId: z.string().optional().describe(desc)
});

export function registerQqBotTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_qqbot_get_bind_link',
    {
      title: 'QQ 机器人绑定链接',
      description: [
        'GET /open/qqBot/getBindLink - 获取 QQ 机器人绑定链接与绑定码。',
        '请求(url): refresh(是否强制刷新,可选,默认false；true 会使旧绑定码失效并重新生成),',
        `botAppId(可选,不填为分配的官方机器人；绑定自有机器人时必填)。${BOT_APP_ID_HINT}`,
        `${RESULT_WRAP}`,
        'data: url(带参分享链接,可生成二维码；已绑定该机器人时可能为空), bindCode(绑定码,已是好友时需私聊发给机器人,认领QQ群也用此码),',
        'expireSeconds(有效期秒数,默认300), botAppId, botName(机器人名称), botAvatar(机器人头像), botType(1官方/2自有)。'
      ].join(' '),
      inputSchema: {
        refresh: z.boolean().optional().describe('是否强制刷新绑定码，默认false'),
        ...optionalBotAppId('要绑定的机器人appId，不填为官方机器人')
      }
    },
    async ({ refresh, botAppId }) =>
      runOpenTool(client, () => client.get('/open/qqBot/getBindLink', { refresh, botAppId }))
  );

  server.registerTool(
    'open_qqbot_bot_info',
    {
      title: 'QQ 机器人绑定状态',
      description: [
        'GET /open/qqBot/botInfo - 查询 QQ 机器人绑定状态。',
        `请求(url): botAppId(可选,不填为默认机器人)。${BOT_APP_ID_HINT}`,
        `${RESULT_WRAP}`,
        'data: isBind(0未绑定/1已绑定), receiveStatus(1可接收/0用户已关闭单聊接收), createTime(绑定时间),',
        `botInfo(机器人详情: ${BOT_INFO_FIELDS})。`
      ].join(' '),
      inputSchema: optionalBotAppId('机器人appId，不填为默认机器人')
    },
    async ({ botAppId }) => runOpenTool(client, () => client.get('/open/qqBot/botInfo', { botAppId }))
  );

  server.registerTool(
    'open_qqbot_unbind',
    {
      title: '解绑 QQ 机器人',
      description: [
        'GET /open/qqBot/unbind - 高风险：解绑 QQ 机器人。',
        '请求(url): botAppId(可选,不填解绑官方机器人)。解绑默认机器人后会自动把其他已绑定机器人设为默认。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: optionalBotAppId('要解绑的机器人appId，不填解绑官方机器人')
    },
    async ({ botAppId }) => runOpenTool(client, () => client.get('/open/qqBot/unbind', { botAppId }))
  );

  server.registerTool(
    'open_qqbot_group_list',
    {
      title: 'QQ 机器人已加入群列表',
      description: [
        'GET /open/qqBot/groupList - 获取机器人已加入的 QQ 群列表。',
        '请求(url): botAppId(可选,填写时只返回该机器人所在的群,不填返回全部)。',
        `${RESULT_WRAP}`,
        'data: 数组，项含 id(QQ群编号,新增群配置时作为 qqGroupId), groupOpenId, groupRemark,',
        'status(1在群/0已退群/2群消息接收关闭), groupName(接口未授权时为空), groupFingerMemo(群简介),',
        'groupClassText(群分类), groupTags(群标签), groupMemberNum(群成员数), createTime。'
      ].join(' '),
      inputSchema: optionalBotAppId('机器人appId，不填返回全部机器人的群')
    },
    async ({ botAppId }) => runOpenTool(client, () => client.get('/open/qqBot/groupList', { botAppId }))
  );

  server.registerTool(
    'open_qqbot_list',
    {
      title: 'QQ 机器人配置列表',
      description: [
        'POST /open/qqBot/list - 获取 QQ 机器人配置列表（发到QQ群或用指定机器人发给自己）。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(配置编号), qqName(配置名称), qqCode(配置编码,发送消息时作为 option 传入),',
        'sendType(1发给自己/2发到QQ群), qqGroupId(QQ群编号,sendType=2时返回), groupRemark, groupOpenId, groupName,',
        'botAppId(发送使用的机器人appId), botName, botAvatar, updateTime。'
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
      title: '新增 QQ 机器人配置',
      description: [
        'POST /open/qqBot/add - 新增 QQ 机器人配置：发到指定QQ群(sendType=2)，或用指定机器人发给自己(sendType=1)。',
        '只用默认机器人发给自己时无需配置。',
        '请求: qqName(配置名称,必填,最多64字符), qqCode(配置编码,必填,最多32字符,仅字母/数字/下划线/中划线,创建后不可修改),',
        CONFIG_REQ,
        '限制: 同一QQ群、同一机器人的“发给自己”均不可重复创建。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        qqName: z.string().describe('配置名称，最多64个字符'),
        qqCode: z.string().describe('配置编码，最多32个字符，仅字母、数字、下划线和中划线'),
        ...configSchema
      }
    },
    async ({ sendType, ...rest }) =>
      runOpenTool(client, () => client.post('/open/qqBot/add', { ...rest, sendType: sendType ?? 2 }))
  );

  server.registerTool(
    'open_qqbot_edit',
    {
      title: '修改 QQ 机器人配置',
      description: [
        'POST /open/qqBot/edit - 修改 QQ 机器人配置。配置编码(qqCode)不允许修改，但需传原值。',
        '请求: id(配置编号,必填), qqName(配置名称,必填), qqCode(原配置编码,必填),',
        CONFIG_REQ,
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        id: z.number().describe('配置编号'),
        qqName: z.string().describe('配置名称，最多64个字符'),
        qqCode: z.string().describe('原配置编码，不会被修改'),
        ...configSchema
      }
    },
    async ({ sendType, ...rest }) =>
      runOpenTool(client, () => client.post('/open/qqBot/edit', { ...rest, sendType: sendType ?? 2 }))
  );

  server.registerTool(
    'open_qqbot_delete',
    {
      title: '删除 QQ 机器人配置',
      description: [
        'DELETE /open/qqBot/delete - 高风险：删除 QQ 机器人配置，删除后使用该编码的 option 将失效。',
        '请求(url): id(配置编号,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { id: z.number().describe('配置编号') }
    },
    async ({ id }) => runOpenTool(client, () => client.delete('/open/qqBot/delete', { id }))
  );

  server.registerTool(
    'open_qqbot_my_bots',
    {
      title: '我的 QQ 机器人列表',
      description: [
        'GET /open/qqBot/myBots - 我的 QQ 机器人列表：官方机器人与自有机器人及其绑定状态，附带接入自有机器人需要的信息。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: bots(数组,官方在前自有在后；项含 botAppId, botId, username, avatar, shareUrl, botType(1官方/2自有),',
        'isBind(0/1), receiveStatus(1可接收/0已关闭单聊接收), isDefault(1默认机器人), bindTime),',
        'customBotCount(已添加自有机器人数), customBotLimit(可添加上限,普通1个/会员5个),',
        'webhookUrl(需在QQ开放平台配置的回调地址), serverIps(需加入QQ开放平台IP白名单的IP), events(需订阅的事件)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/qqBot/myBots'))
  );

  server.registerTool(
    'open_qqbot_custom_bot_preview',
    {
      title: '校验自有 QQ 机器人凭证',
      description: [
        'POST /open/qqBot/customBot/preview - 用 AppID 与 AppSecret 校验自有机器人并返回头像昵称，仅校验不保存。',
        '需先在QQ开放平台把 open_qqbot_my_bots 返回的 serverIps 加入IP白名单。',
        '请求: botAppId(必填), appSecret(必填,敏感凭证,不要在回复中回显)。',
        `${RESULT_WRAP}`,
        `data: ${BOT_INFO_FIELDS}。`
      ].join(' '),
      inputSchema: customBotSchema
    },
    async (args) => runOpenTool(client, () => client.post('/open/qqBot/customBot/preview', args))
  );

  server.registerTool(
    'open_qqbot_custom_bot_add',
    {
      title: '添加自有 QQ 机器人',
      description: [
        'POST /open/qqBot/customBot/add - 添加自有 QQ 机器人，凭证校验通过才保存。',
        '限制: 普通用户最多1个，会员最多5个；官方机器人和已被其他账号添加的机器人不可添加。',
        '添加后需用 open_qqbot_get_bind_link(传 botAppId) 完成绑定。',
        '请求: botAppId(必填), appSecret(必填,敏感凭证,不要在回复中回显)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: customBotSchema
    },
    async (args) => runOpenTool(client, () => client.post('/open/qqBot/customBot/add', args))
  );

  server.registerTool(
    'open_qqbot_custom_bot_edit',
    {
      title: '修改自有 QQ 机器人 AppSecret',
      description: [
        'POST /open/qqBot/customBot/edit - 修改自有 QQ 机器人的 AppSecret（在QQ开放平台重置后同步），新凭证校验通过才保存。',
        '请求: botAppId(已添加的机器人AppID,必填), appSecret(新AppSecret,必填,不要在回复中回显)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: customBotSchema
    },
    async (args) => runOpenTool(client, () => client.post('/open/qqBot/customBot/edit', args))
  );

  server.registerTool(
    'open_qqbot_custom_bot_refresh',
    {
      title: '刷新自有 QQ 机器人信息',
      description: [
        'GET /open/qqBot/customBot/refresh - 从QQ开放平台重新拉取自有机器人的头像昵称。',
        '请求(url): botAppId(自有机器人AppID,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { botAppId: z.string().describe('自有机器人AppID') }
    },
    async ({ botAppId }) => runOpenTool(client, () => client.get('/open/qqBot/customBot/refresh', { botAppId }))
  );

  server.registerTool(
    'open_qqbot_custom_bot_delete',
    {
      title: '删除自有 QQ 机器人',
      description: [
        'DELETE /open/qqBot/customBot/delete - 高风险：删除自有 QQ 机器人，',
        '同时解除其绑定并删除其QQ群和使用该机器人的配置，相关 option 将失效。',
        '请求(url): botAppId(自有机器人AppID,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { botAppId: z.string().describe('自有机器人AppID') }
    },
    async ({ botAppId }) => runOpenTool(client, () => client.delete('/open/qqBot/customBot/delete', { botAppId }))
  );

  server.registerTool(
    'open_qqbot_set_default',
    {
      title: '设置默认 QQ 机器人',
      description: [
        'GET /open/qqBot/setDefault - 设置默认 QQ 机器人；发送消息 channel=qq 且不填 option 时由默认机器人发给自己。',
        `请求(url): botAppId(必填,须已绑定)。${BOT_APP_ID_HINT}`,
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { botAppId: z.string().describe('已绑定的机器人appId') }
    },
    async ({ botAppId }) => runOpenTool(client, () => client.get('/open/qqBot/setDefault', { botAppId }))
  );
}
