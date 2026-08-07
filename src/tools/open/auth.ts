import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenApiClient } from '../../open-client.js';
import { RESULT_WRAP, textResult } from './helpers.js';

export function registerAuthTools(server: McpServer, client: OpenApiClient): void {
  server.registerTool(
    'open_get_access_key',
    {
      title: '获取开放接口 AccessKey',
      description: [
        'POST /common/openApi/getAccessKey - 获取开放接口调用凭证。',
        '使用环境变量 PUSHPLUS_TOKEN(用户token,不支持消息token) + PUSHPLUS_SECRET_KEY。',
        'AccessKey 有效期约 7200 秒，重复获取会使上次失效；其他 open_* 工具会自动换取并缓存。',
        '调用前需在官网开启开放接口，并配置安全IP（否则可能返回403）。',
        `${RESULT_WRAP}`,
        'data: accessKey(访问令牌,后续请求放 header access-key), expiresIn(过期秒数)。'
      ].join(' ')
    },
    async () => {
      try {
        const info = await client.getAccessKey(true);
        return textResult(JSON.stringify(info, null, 2));
      } catch (error) {
        return textResult(
          `❌ 获取 access-key 失败: ${error instanceof Error ? error.message : String(error)}`,
          true
        );
      }
    }
  );
}
