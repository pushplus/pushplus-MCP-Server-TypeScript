/**
 * pushplus Open API 客户端
 * 负责 access-key 获取、缓存与 /open/** 请求
 */

export interface OpenApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
  skipAuthRetry?: boolean;
}

export interface AccessKeyInfo {
  accessKey: string;
  expiresIn: number;
  nickName?: string;
}

export class OpenApiClient {
  private accessKey?: string;
  private expireAt = 0;
  private refreshPromise?: Promise<string>;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly secretKey: string
  ) {}

  hasCredentials(): boolean {
    return Boolean(this.token && this.secretKey);
  }

  /**
   * 获取（或刷新）access-key
   */
  async getAccessKey(force = false): Promise<AccessKeyInfo> {
    if (!this.hasCredentials()) {
      throw new Error('缺少开放接口凭证，请配置 PUSHPLUS_TOKEN 与 PUSHPLUS_SECRET_KEY');
    }

    if (!force && this.accessKey && Date.now() < this.expireAt) {
      return {
        accessKey: this.accessKey,
        expiresIn: Math.max(0, Math.floor((this.expireAt - Date.now()) / 1000))
      };
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessKey().finally(() => {
        this.refreshPromise = undefined;
      });
    }

    const key = await this.refreshPromise;
    return {
      accessKey: key,
      expiresIn: Math.max(0, Math.floor((this.expireAt - Date.now()) / 1000)),
      nickName: undefined
    };
  }

  private async refreshAccessKey(): Promise<string> {
    const url = `${this.baseUrl}/common/openApi/getAccessKey`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'pushplus-mcp-server/1.0.8'
      },
      body: JSON.stringify({
        token: this.token,
        secretKey: this.secretKey
      })
    });

    const text = await response.text();
    this.ensureJsonResponse(text, url);

    let result: { code: number; msg: string; data?: AccessKeyInfo };
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`获取 access-key 失败: 无法解析响应`);
    }

    if (result.code !== 200 || !result.data?.accessKey) {
      throw new Error(`获取 access-key 失败: ${result.msg || '未知错误'}（请确认 PUSHPLUS_TOKEN 为用户token而非消息token、已开启开放接口，且出口IP在白名单内）`);
    }

    const expiresIn = result.data.expiresIn || 7200;
    this.accessKey = result.data.accessKey;
    // 提前 60 秒刷新
    this.expireAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;
    return this.accessKey;
  }

  /**
   * 发起 Open API 请求，返回原始 Result JSON 字符串
   */
  async request(path: string, options: OpenApiRequestOptions = {}): Promise<string> {
    if (!this.hasCredentials()) {
      throw new Error('缺少开放接口凭证，请配置 PUSHPLUS_TOKEN 与 PUSHPLUS_SECRET_KEY');
    }

    const method = options.method || 'GET';
    const accessKey = (await this.getAccessKey()).accessKey;
    const url = this.buildUrl(path, options.query);

    const headers: Record<string, string> = {
      'User-Agent': 'pushplus-mcp-server/1.0.8',
      'access-key': accessKey
    };

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal
      });

      const text = await response.text();
      this.ensureJsonResponse(text, url);

      let parsed: { code?: number; msg?: string } | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // keep raw text
      }

      const unauthorized =
        response.status === 401 ||
        parsed?.code === 401 ||
        parsed?.code === 302 ||
        (typeof parsed?.msg === 'string' && /未授权|未登录|unauthorized|access-key|令牌无效/i.test(parsed.msg));

      if (unauthorized && !options.skipAuthRetry) {
        await this.getAccessKey(true);
        return this.request(path, { ...options, skipAuthRetry: true });
      }

      if (!response.ok) {
        throw new Error(`Open API 请求失败: HTTP ${response.status} ${response.statusText} - ${text}`);
      }

      return text;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Open API 请求超时: ${method} ${path}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get(path: string, query?: OpenApiRequestOptions['query'], timeoutMs?: number): Promise<string> {
    return this.request(path, { method: 'GET', query, timeoutMs });
  }

  async post(path: string, body?: unknown, query?: OpenApiRequestOptions['query']): Promise<string> {
    return this.request(path, { method: 'POST', body, query });
  }

  async delete(path: string, query?: OpenApiRequestOptions['query']): Promise<string> {
    return this.request(path, { method: 'DELETE', query });
  }

  async uploadImage(filename: string, contentBase64: string): Promise<string> {
    const binary = Buffer.from(contentBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([binary]), filename);
    return this.request('/open/file/uploadImage', {
      method: 'POST',
      formData,
      timeoutMs: 30000
    });
  }

  private ensureJsonResponse(responseBody: string, url: string): void {
    const trimmed = (responseBody || '').trim();
    if (!trimmed) {
      throw new Error(`Open API 响应为空: ${url}`);
    }
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
      throw new Error(
        `Open API 返回了 HTML 而非 JSON，请确认开放接口地址使用 /api 前缀。请求URL: ${url}；当前 openApiBaseUrl=${this.baseUrl}`
      );
    }
  }

  private buildUrl(path: string, query?: OpenApiRequestOptions['query']): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalized}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}
