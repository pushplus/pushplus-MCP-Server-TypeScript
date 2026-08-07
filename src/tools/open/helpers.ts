import type { OpenApiClient } from '../../open-client.js';

/** 统一响应包装说明（开放接口文档） */
export const RESULT_WRAP =
  '统一响应: code(数字,200成功), msg(字符串), data(业务数据)。';

export const PAGE_REQ =
  '分页请求: current(当前页,默认1), pageSize(每页大小,默认20,最大50)。';

export const PAGE_RESP =
  '分页响应 data: pageNum(当前页), pageSize(分页大小), total(总行数), pages(总页数), list(列表)。';

export function textResult(text: string, isError = false) {
  return {
    content: [{ type: 'text' as const, text }],
    ...(isError ? { isError: true } : {})
  };
}

export async function runOpenTool(
  client: OpenApiClient,
  fn: () => Promise<string>
) {
  try {
    const result = await fn();
    return textResult(result);
  } catch (error) {
    return textResult(
      `❌ Open API 调用失败: ${error instanceof Error ? error.message : String(error)}`,
      true
    );
  }
}

export function pageBody(args: {
  current?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}) {
  return {
    current: args.current ?? 1,
    pageSize: args.pageSize ?? 20,
    ...(args.params ? { params: args.params } : {})
  };
}
