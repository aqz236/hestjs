import type { Env, Hono } from 'hono';
import type { App, Constructor, Container, CreateAppOptions } from '@hestjs/core';
import { createApp } from '@hestjs/core';

/** POST 一个 JSON body 时的 init。 */
export function jsonBody(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export interface TestApp<E extends Env = Env> {
  readonly app: App<E>;
  /** 就是 Hono 实例。想绕过便利方法直接 `hono.request()` 也行。 */
  readonly hono: Hono<E>;
  readonly container: Container;

  request(path: string, init?: RequestInit): Promise<Response>;
  json<T = unknown>(path: string, init?: RequestInit): Promise<T>;
  text(path: string, init?: RequestInit): Promise<string>;
  status(path: string, init?: RequestInit): Promise<number>;
  /** POST 一个 JSON body，解析 JSON 响应。 */
  postJson<T = unknown>(path: string, body: unknown, init?: RequestInit): Promise<T>;

  /** 执行 OnStop。测完记得调，尤其是持有连接的 provider。 */
  close(): Promise<void>;
}

/**
 * 测试用的 createApp：已经 start() 过，并带一批请求便利方法。
 *
 * 与 createApp 的唯一区别是 `overrides` —— 用来把真实依赖换成测试替身：
 *
 * ```ts
 * const app = await createTestApp(AppModule, {
 *   overrides: [{ provide: Database, useValue: new FakeDatabase() }],
 * });
 * ```
 *
 * `overrides` 只能替换本来就注册过的 token，写错名字会立刻抛
 * `UnknownOverrideError` —— 否则测试会在「其实没换掉」的情况下假装通过。
 */
export async function createTestApp<E extends Env = Env>(
  root: Constructor,
  options: Omit<CreateAppOptions<E>, 'hono'> = {},
): Promise<TestApp<E>> {
  const app = createApp<E>(root, options);
  await app.start();

  const request = (path: string, init?: RequestInit): Promise<Response> =>
    Promise.resolve(app.hono.request(path, init));

  return {
    app,
    hono: app.hono,
    container: app.container,

    request,

    async json<T = unknown>(path: string, init?: RequestInit): Promise<T> {
      const response = await request(path, init);
      return (await response.json()) as T;
    },

    async text(path: string, init?: RequestInit): Promise<string> {
      const response = await request(path, init);
      return await response.text();
    },

    async status(path: string, init?: RequestInit): Promise<number> {
      const response = await request(path, init);
      return response.status;
    },

    async postJson<T = unknown>(
      path: string,
      body: unknown,
      init?: RequestInit,
    ): Promise<T> {
      const response = await request(path, { ...jsonBody(body), ...init });
      return (await response.json()) as T;
    },

    async close(): Promise<void> {
      await app.stop();
    },
  };
}
