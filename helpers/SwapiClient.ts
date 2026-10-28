import type { APIRequestContext } from '@playwright/test';

export interface ApiResult<T> {
  status: number;
  body: T;
  elapsedMs: number;
}

export class SwapiClient {
  constructor(private readonly request: APIRequestContext) {}

  /** `path` va SIN barra inicial (ej: 'people/1') para respetar el /api/ del baseURL. */
  async get<T = unknown>(path: string): Promise<ApiResult<T>> {
    const start = performance.now();
    const response = await this.request.get(path);
    const elapsedMs = Math.round(performance.now() - start);
    return { status: response.status(), body: (await response.json()) as T, elapsedMs };
  }
}