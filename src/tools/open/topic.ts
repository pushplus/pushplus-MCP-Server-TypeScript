import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

const TOPIC_TYPE = '群组类型；0普通群组；1积分群组；2公开群组';
const APPROVE = '是否审核通过；0未审核，1审核不通过，2审核通过';

export function registerTopicTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_topic_list',
    {
      title: '群组列表',
      description: [
        'POST /open/topic/list - 获取群组列表。',
        `${PAGE_REQ} params.topicType(必填语义:0我创建的/1我加入的,默认0)。`,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        `list 项: icon, topicId, topicCode, topicName, nickName(所属公众号), createTime, topicUserCount,`,
        `topicType(${TOPIC_TYPE}), isApproved(${APPROVE}), firstIsApproved(${APPROVE}),`,
        'approveReason(审批拒绝理由), isOpen(积分群组是否上架；0否/1是)。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认20，最大50'),
        topicType: z.number().int().optional().describe('群组筛选类型；0-我创建的，1-我加入的；默认0')
      }
    },
    async ({ current, pageSize, topicType }) =>
      runOpenTool(client, () =>
        client.post('/open/topic/list', pageBody({ current, pageSize, params: { topicType: topicType ?? 0 } }))
      )
  );

  server.registerTool(
    'open_topic_detail',
    {
      title: '我创建的群组详情',
      description: [
        'GET /open/topic/detail - 获取我创建的群组详情。',
        '请求(url): topicId(群组编号,必填)。',
        `${RESULT_WRAP}`,
        'data: topicId, topicCode, topicName, qrCodeImgUrl(永久二维码), contact, introduction,',
        'receiptMessage(加入后回复), nickName, createTime, topicUserCount, icon, appId,',
        `topicType(${TOPIC_TYPE}), price(积分群组订阅积分/月), topicDescribe, userNickName,`,
        `isApproved/firstIsApproved(${APPROVE}), approveReason, isOpen(0否/1是)。`
      ].join(' '),
      inputSchema: { topicId: z.number().describe('群组编号') }
    },
    async ({ topicId }) =>
      runOpenTool(client, () => client.get('/open/topic/detail', { topicId }))
  );

  server.registerTool(
    'open_topic_join_detail',
    {
      title: '我加入的群组详情',
      description: [
        'GET /open/topic/joinTopicDetail - 获取我加入的群详情。',
        '请求(url): topicId(群组编号,必填)。',
        `${RESULT_WRAP}`,
        'data: topicId, topicCode, topicName, contact, introduction, nickName, createTime(加入时间),',
        `icon, topicUserCount, topicType(${TOPIC_TYPE}), price, topicDescribe, userNickName。`
      ].join(' '),
      inputSchema: { topicId: z.number().describe('群组编号') }
    },
    async ({ topicId }) =>
      runOpenTool(client, () => client.get('/open/topic/joinTopicDetail', { topicId }))
  );

  server.registerTool(
    'open_topic_add',
    {
      title: '新增群组',
      description: [
        'POST /open/topic/add - 新增群组。',
        '请求: topicCode(编码,必填), topicName(名称,必填), contact(联系方式,必填), introduction(简介,必填),',
        'receiptMessage(加入后回复,可选), appId(绑定公众号Id,可选,默认pushplus公众号), icon(可选),',
        `topicType(可选,默认0;${TOPIC_TYPE}), price(可选,默认0), topicDescribe(一句话介绍,可选)。`,
        `${RESULT_WRAP}`,
        'data: 新建群组编号(数字)。'
      ].join(' '),
      inputSchema: {
        topicCode: z.string().describe('群组编码，必填'),
        topicName: z.string().describe('群组名称，必填'),
        contact: z.string().describe('联系方式，必填'),
        introduction: z.string().describe('群组简介，必填'),
        receiptMessage: z.string().optional().describe('加入后回复内容'),
        appId: z.string().optional().describe('微信公众号Id；填写绑定后的公众号Id，默认使用pushplus公众号'),
        icon: z.string().optional().describe('群组图标'),
        topicType: z.number().int().optional().describe('0普通群组；1积分群组；2公开群组；默认0'),
        price: z.number().optional().describe('积分群组订阅积分；按月；默认0'),
        topicDescribe: z.string().optional().describe('一句话介绍')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/topic/add', args))
  );

  server.registerTool(
    'open_topic_qr_code',
    {
      title: '获取群组二维码',
      description: [
        'GET /open/topic/qrCode - 获取群组二维码。',
        '请求(url): topicId(必填), second(有效期秒,默认604800即7天,最长30天), scanCount(可扫码次数1-999,-1无限,默认-1)。',
        `${RESULT_WRAP}`,
        'data: qrCodeImgUrl(二维码图片路径), forever(0临时二维码/1永久二维码)。'
      ].join(' '),
      inputSchema: {
        topicId: z.number().describe('群组编号'),
        second: z.number().int().optional().describe('二维码有效期（秒）；默认604800(7天)，最长30天'),
        scanCount: z.number().int().optional().describe('可扫码次数；1-999，-1代表无限次；默认-1')
      }
    },
    async ({ topicId, second, scanCount }) =>
      runOpenTool(client, () => client.get('/open/topic/qrCode', { topicId, second, scanCount }))
  );

  server.registerTool(
    'open_topic_exit',
    {
      title: '退出群组',
      description: [
        'GET /open/topic/exitTopic - 高风险：退出/退订群组。',
        '请求(url): topicId(群组编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「退订成功」。'
      ].join(' '),
      inputSchema: { topicId: z.number().describe('群组编号') }
    },
    async ({ topicId }) =>
      runOpenTool(client, () => client.get('/open/topic/exitTopic', { topicId }))
  );

  server.registerTool(
    'open_topic_delete',
    {
      title: '删除群组',
      description: [
        'GET /open/topic/delete - 高风险：删除群组。',
        '请求(url): topicId(群组编号,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「群组删除成功」。'
      ].join(' '),
      inputSchema: { topicId: z.number().describe('群组编号') }
    },
    async ({ topicId }) =>
      runOpenTool(client, () => client.get('/open/topic/delete', { topicId }))
  );

  server.registerTool(
    'open_topic_edit',
    {
      title: '修改群组',
      description: [
        'POST /open/topic/editTopic - 修改群组信息。',
        '请求: topicId(群组编号,必填), topicCode(编码,必填), topicName(名称,必填),',
        'contact/introduction/receiptMessage/icon/price/topicDescribe(可选)。',
        `${RESULT_WRAP}`,
        'data: 如「修改成功」。'
      ].join(' '),
      inputSchema: {
        topicId: z.number().describe('群组编号'),
        topicCode: z.string().describe('群组编码'),
        topicName: z.string().describe('群组名称'),
        contact: z.string().optional().describe('联系方式'),
        introduction: z.string().optional().describe('群组简介'),
        receiptMessage: z.string().optional().describe('加入后回复内容'),
        icon: z.string().optional().describe('群组图标'),
        price: z.number().optional().describe('积分群组订阅积分；按月'),
        topicDescribe: z.string().optional().describe('一句话介绍')
      }
    },
    async (args) => runOpenTool(client, () => client.post('/open/topic/editTopic', args))
  );

  server.registerTool(
    'open_topic_is_open',
    {
      title: '上下架积分群组',
      description: [
        'POST /open/topic/isOpen - 积分群组上下架。',
        '请求: topicId(群组编号,必填), isOpen(1上架/0下架,必填)。',
        `${RESULT_WRAP}`,
        'data: 如「操作成功」。'
      ].join(' '),
      inputSchema: {
        topicId: z.number().describe('群组编号'),
        isOpen: z.number().int().describe('是否上架；1是，0否')
      }
    },
    async ({ topicId, isOpen }) =>
      runOpenTool(client, () => client.post('/open/topic/isOpen', { topicId, isOpen }))
  );
}
