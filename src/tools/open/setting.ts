import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

const CHANNEL_ENUM =
  '渠道编码；wechat微信公众号,cp企业微信应用,webhook第三方webhook,mail邮件,sms短信,voice语音,extension插件';

export function registerSettingTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_setting_get_user_settings',
    {
      title: '获取默认渠道（已废弃）',
      description: `GET /open/setting/getUserSettings - 已废弃，请改用 listUserDefault/detailUserDefault。${RESULT_WRAP}`
    },
    async () => runOpenTool(client, () => client.get('/open/setting/getUserSettings'))
  );

  server.registerTool(
    'open_setting_change_default_channel',
    {
      title: '修改默认渠道（已废弃）',
      description: `POST /open/setting/changeDefaultChannel - 已废弃，请改用 add/editUserDefault。请求: defaultChannel, defaultWebhook(可选)。${RESULT_WRAP}`,
      inputSchema: {
        defaultChannel: z.string().describe('默认渠道编码'),
        defaultWebhook: z.string().optional().describe('默认 webhook/渠道参数')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/setting/changeDefaultChannel', args))
  );

  server.registerTool(
    'open_setting_list_user_default',
    {
      title: '默认配置列表',
      description: [
        'POST /open/setting/listUserDefault - 按消息token配置的默认推送渠道列表。',
        PAGE_REQ,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        `list 项: id(默认配置编号), channel(${CHANNEL_ENUM}), channelTxt(渠道名称), updateTime, name(令牌名称)。`
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/setting/listUserDefault', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_setting_detail_user_default',
    {
      title: '默认配置详情',
      description: [
        'GET /open/setting/detailUserDefault - 默认配置详情。',
        '请求(url): id(默认配置编号,必填)。',
        `${RESULT_WRAP}`,
        `data: id, channel(${CHANNEL_ENUM}), option(渠道参数), pre(预处理编码), updateTime, name, tokenId(消息令牌id;用户令牌为0)。`
      ].join(' '),
      inputSchema: { id: z.number().describe('默认配置编号') }
    },
    async ({ id }) =>
      runOpenTool(client, () => client.get('/open/setting/detailUserDefault', { id }))
  );

  server.registerTool(
    'open_setting_add_user_default',
    {
      title: '新增默认配置',
      description: [
        'POST /open/setting/addUserDefault - 新增默认推送配置。',
        `请求: channel(${CHANNEL_ENUM},必填), option(渠道参数,必填), pre(预处理编码,必填可空串),`,
        'tokenId(消息令牌id,必填;用户令牌填0)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        channel: z.string().describe(CHANNEL_ENUM),
        option: z.string().describe('渠道参数；webhook/cp 等需填具体编码'),
        pre: z.string().describe('预处理编码；无则传空字符串'),
        tokenId: z.number().describe('消息令牌id；用户令牌为0')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/setting/addUserDefault', args))
  );

  server.registerTool(
    'open_setting_edit_user_default',
    {
      title: '修改默认配置',
      description: [
        'POST /open/setting/editUserDefault - 修改默认推送配置。',
        `请求: id(必填), channel(必填), tokenId(必填;用户令牌0), option/pre(可选)。`,
        `${RESULT_WRAP}`,
        'data: 如「修改成功」。'
      ].join(' '),
      inputSchema: {
        id: z.number().describe('默认配置编号'),
        channel: z.string().describe(CHANNEL_ENUM),
        option: z.string().optional().describe('渠道参数；webhook和cp渠道需填具体编码'),
        pre: z.string().optional().describe('预处理编码'),
        tokenId: z.number().describe('消息令牌id；用户令牌为0')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/setting/editUserDefault', args))
  );

  server.registerTool(
    'open_setting_delete_user_default',
    {
      title: '删除默认配置',
      description: [
        'DELETE /open/setting/deleteUserDefault - 高风险：删除默认配置。',
        '请求(url): id(默认配置编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「默认配置删除成功」。'
      ].join(' '),
      inputSchema: { id: z.number().describe('默认配置编号') }
    },
    async ({ id }) =>
      runOpenTool(client, () => client.delete('/open/setting/deleteUserDefault', { id }))
  );

  server.registerTool(
    'open_setting_change_receive_limit',
    {
      title: '修改接收消息限制',
      description: [
        'GET /open/setting/changeRecevieLimit - 修改接收消息限制。',
        '请求(url): recevieLimit(0接收全部/1不接收消息,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        recevieLimit: z.number().int().describe('接收消息限制；0-接收全部，1-不接收消息')
      }
    },
    async ({ recevieLimit }) =>
      runOpenTool(client, () => client.get('/open/setting/changeRecevieLimit', { recevieLimit }))
  );

  server.registerTool(
    'open_setting_change_is_send',
    {
      title: '开启/关闭发送消息功能',
      description: [
        'GET /open/setting/changeIsSend - 开启或禁用发送消息功能。',
        '请求(url): isSend(0禁用/1启用,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { isSend: z.number().int().describe('发送消息功能；0-禁用，1-启用') }
    },
    async ({ isSend }) =>
      runOpenTool(client, () => client.get('/open/setting/changeIsSend', { isSend }))
  );

  server.registerTool(
    'open_setting_change_open_message_type',
    {
      title: '修改打开消息方式',
      description: [
        'GET /open/setting/changeOpenMessageType - 修改消息打开类型。',
        '请求(url): openMessageType(0:H5，1:小程序,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        openMessageType: z.number().int().describe('消息打开类型；0:H5，1:小程序')
      }
    },
    async ({ openMessageType }) =>
      runOpenTool(client, () => client.get('/open/setting/changeOpenMessageType', { openMessageType }))
  );

  server.registerTool(
    'open_setting_extension',
    {
      title: '修改插件渠道转发',
      description: [
        'GET /open/setting/extension - 微信渠道消息是否同步浏览器扩展/桌面应用。',
        '请求(url): forward(0否/1是,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: {
        forward: z.number().int().describe('是否同步插件/桌面应用接收；0:否，1:是')
      }
    },
    async ({ forward }) =>
      runOpenTool(client, () => client.get('/open/setting/extension', { forward }))
  );
}
