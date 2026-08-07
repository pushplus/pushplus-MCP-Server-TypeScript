import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenApiClient } from '../../open-client.js';
import { PAGE_REQ, PAGE_RESP, RESULT_WRAP, pageBody, runOpenTool } from './helpers.js';

export function registerFileTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_user_image_upload_token',
    {
      title: '获取图片上传凭证',
      description: [
        'GET /open/userImage/uploadToken - 获取七牛云表单上传凭证（图片服务，30天有效）。',
        '请求参数: 无。',
        `${RESULT_WRAP}`,
        'data: uploadToken(上传凭证), uploadHost(上传域名), uploadUrl(上传地址),',
        'bucket(存储桶), expiresIn(凭证有效秒数)。',
        '拿到凭证后按七牛表单规范向 uploadUrl 提交 token+file（无需 access-key）。'
      ].join(' ')
    },
    async () => runOpenTool(client, () => client.get('/open/userImage/uploadToken'))
  );

  server.registerTool(
    'open_file_upload_image',
    {
      title: '通过开放接口上传图片',
      description: [
        'POST /open/file/uploadImage - 使用 access-key 直接上传图片（multipart file）。',
        '本工具入参为 filename + contentBase64，由 MCP 组装 multipart。',
        '若需官方文档推荐的七牛直传流程，请先调用 open_user_image_upload_token。',
        `${RESULT_WRAP}`,
        '成功时 data 一般为图片 URL 字符串。'
      ].join(' '),
      inputSchema: {
        filename: z.string().describe('文件名，如 image.png'),
        contentBase64: z.string().describe('图片 Base64 内容（不含 data: 前缀）')
      }
    },
    async ({ filename, contentBase64 }) =>
      runOpenTool(client, () => client.uploadImage(filename, contentBase64))
  );

  server.registerTool(
    'open_user_image_list',
    {
      title: '图片列表',
      description: [
        'POST /open/userImage/list - 查询已上传图片列表。',
        `${PAGE_REQ} 默认 pageSize 可为10；最大50。`,
        `${RESULT_WRAP} ${PAGE_RESP}`,
        'list 项: id(图片id), imgUrl(图片地址), thumbnail(缩略图), createTime。',
        '未删除图片默认 30 天后系统自动清理。'
      ].join(' '),
      inputSchema: {
        current: z.number().int().optional().describe('当前所在分页数，默认1'),
        pageSize: z.number().int().optional().describe('每页大小，默认10/20，最大50')
      }
    },
    async ({ current, pageSize }) =>
      runOpenTool(client, () => client.post('/open/userImage/list', pageBody({ current, pageSize })))
  );

  server.registerTool(
    'open_user_image_delete',
    {
      title: '删除图片',
      description: [
        'DELETE /open/userImage/delete - 高风险：主动删除图片。',
        '请求(url): id(图片id,必填)。',
        `${RESULT_WRAP}`
      ].join(' '),
      inputSchema: { id: z.number().describe('图片 id') }
    },
    async ({ id }) =>
      runOpenTool(client, () => client.delete('/open/userImage/delete', { id }))
  );
}
