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

export interface TestApp<R extends Hono<any> = Hono<any>> {
  readonly app: App<R>;
  /** 就是链式注册之后的 Hono 实例。 */
  readonly hono: R;
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
 * 与 createApp 的唯一区别是它顺手帮你 start 了。`overrides` 用来把真实依赖换成替身：
 *
 * ```ts
 * const app = await createTestApp(AppModule, {
 *   overrides: [{ provide: Database, useValue: new FakeDatabase() }],
 *   routes: (hono, resolve) => hono.get('/users', (c) => resolve(Users).list(c)),
 * });
 * ```
 *
 * `overrides` 只能替换本来就注册过的 token，写错名字会立刻抛
 * `UnknownOverrideError` —— 否则测试会在「其实没换掉」的情况下假装通过。
 */
export async function createTestApp<E extends Env = Env, R extends Hono<E> = Hono<E>>(
  root: Constructor,
  options: Omit<CreateAppOptions<E, R>, 'hono'> = {},
): Promise<TestApp<R>> {
  const app = createApp<E, R>(root, options);
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
      return await (await request(path, init)).text();
    },

    async status(path: string, init?: RequestInit): Promise<number> {
      return (await request(path, init)).status;
    },

    async postJson<T = unknown>(path: string, body: unknown, init?: RequestInit): Promise<T> {
      const response = await request(path, { ...jsonBody(body), ...init });
      return (await response.json()) as T;
    },

    async close(): Promise<void> {
      await app.stop();
    },
  };
}
