import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenApiClient } from '../../open-client.js';
import { RESULT_WRAP, runOpenTool } from './helpers.js';

export function registerUserTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_user_token',
    {
      title: '获取用户 token',
      description: [
        'GET /open/user/token - 获取当前用户 token。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: 字符串，直接为当前用户 token。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/user/token'))
  );

  server.registerTool(
    'open_user_my_info',
    {
      title: '个人资料详情',
      description: [
        'GET /open/user/myInfo - 获取个人资料。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data 字段: openId(微信openId), unionId(微信unionId), nickName(昵称), headImgUrl(头像),',
        'userSex(0未设置/1男/2女), token(用户令牌), phoneNumber(手机号), email(邮箱),',
        'emailStatus(0未验证/1待验证/2已验证), birthday(生日), points(积分),',
        'verifyStatus(0未实名/1已实名), vipInfo{isVip(0否/1是), lastDay(会员到期日)}。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/user/myInfo'))
  );

  server.registerTool(
    'open_user_limit_time',
    {
      title: '获取解封剩余时间',
      description: [
        'GET /open/user/userLimitTime - 查询发送限制与解封时间。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: sendLimit(1无限制/2短期限制/3永久限制), userLimitTime(解封时间字符串)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/user/userLimitTime'))
  );

  server.registerTool(
    'open_user_send_count',
    {
      title: '查询当日消息接口请求次数',
      description: [
        'GET /open/user/sendCount - 查询当日各渠道消息接口请求次数。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: wechatSendCount(微信公众号), cpSendCount(企业微信应用),',
        'webhookSendCount(webhook), mailSendCount(邮件)。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/user/sendCount'))
  );
}
