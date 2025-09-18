import { debug } from './debug';

export interface HttpClientOptions {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}
export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  constructor(options: HttpClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultHeaders = options.headers || {};
    this.timeout = options.timeout || 30000;
  }
  private buildURL(path: string, params?: Record<string, string | number | boolean>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let fullUrl: string;
    if (this.baseURL) {
      const cleanBase = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      fullUrl = cleanBase + normalizedPath;
    } else {
      fullUrl = normalizedPath;
    }
    const url = new URL(fullUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }
  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeout = this.timeout, ...fetchOptions } = options;
    const url = this.buildURL(path, params);
    const mergedOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...(fetchOptions.headers as Record<string, string> || {}),
      },
    };

    // Log API request
    const method = mergedOptions.method || 'GET';
    debug.logApiRequest(method, url, mergedOptions.headers, mergedOptions.body);

    const startTime = Date.now();
    try {
      const response = await this.fetchWithTimeout(url, mergedOptions, timeout);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        debug.logApiResponse(response.status, url, responseTime, errorBody);

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          debug.log('error', `API Error: ${errorMessage}`, errorJson);
        } catch {
          if (errorBody) {
            errorMessage = errorBody;
          }
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      debug.logApiResponse(response.status, url, responseTime, responseData);
      return responseData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      debug.log('error', `Request failed after ${responseTime}ms: ${(error as Error).message}`);

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }
  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }
  async post<T = any>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async put<T = any>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  async delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
  async patch<T = any>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
export function createHttpClient(config: HttpClientOptions = {}): HttpClient {
  return new HttpClient(config);
}
