import type { Context, Env, MiddlewareHandler } from 'hono';
import { sValidator } from '@hono/standard-validator';
import { attachRouteMeta, type ValidationRouteMeta } from '@hestjs/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { toIssues, type JsonSchema, type ValidationIssue, type ValidationSource } from './schema';

export interface ValidateSpec {
  readonly body?: StandardSchemaV1;
  readonly query?: StandardSchemaV1;
  readonly params?: StandardSchemaV1;
  readonly headers?: StandardSchemaV1;
  /**
   * 给文档生成用的 JSON Schema。校验本身不读它。
   *
   * 各家产法不同（zod 用 `z.toJSONSchema`、valibot 用 `@valibot/to-json-schema`），
   * 所以这里不猜，你自己算好传进来。
   */
  readonly jsonSchema?: Partial<Record<'body' | 'query' | 'params', JsonSchema>>;
  /** 校验失败时的响应。默认 400 加结构化 issues。 */
  readonly onInvalid?: (
    issues: readonly ValidationIssue[],
    context: Context,
  ) => Response | Promise<Response>;
}

const FIELDS = [
  { key: 'body', source: 'json' },
  { key: 'query', source: 'query' },
  { key: 'params', source: 'param' },
  { key: 'headers', source: 'header' },
] as const satisfies readonly { key: keyof ValidateSpec; source: ValidationSource }[];

function invalidResponse(context: Context, issues: readonly ValidationIssue[]): Response {
  return context.json({ message: '请求参数校验失败', issues }, 400);
}

/**
 * 生成一段校验中间件。
 *
 * ```ts
 * hono.post('/users',
 *   validate({ body: CreateUser, jsonSchema: { body: z.toJSONSchema(CreateUser) } }),
 *   (c) => users.create(c),
 * )
 * ```
 *
 * **刻意做成中间件而不是包装 handler。** 包装会让 Hono 的链式类型推导失效，
 * 而链式类型正是 `hc<typeof app.hono>` 能用的前提。中间件既不改 handler，
 * 又能把 schema 挂在自身上——`hono.routes` 会连中间件一起记下来。
 *
 * 校验底层是 Hono 官方的 `@hono/standard-validator`，
 * 所以 `c.req.valid('json')` 还是原生那套。
 */
export function validate<E extends Env = Env>(spec: ValidateSpec = {}): MiddlewareHandler<E> {
  const checks: MiddlewareHandler[] = [];
  const entries: ValidationRouteMeta[] = [];

  for (const { key, source } of FIELDS) {
    const schema = spec[key];
    if (schema === undefined) {
      continue;
    }

    checks.push(
      sValidator(source, schema, (result, context) => {
        if (result.success) {
          return;
        }
        const issues = toIssues(result.error);
        return spec.onInvalid?.(issues, context) ?? invalidResponse(context, issues);
      }) as unknown as MiddlewareHandler,
    );

    const jsonSchema = spec.jsonSchema?.[key as 'body' | 'query' | 'params'];
    entries.push({
      kind: 'validation',
      source,
      ...(jsonSchema === undefined ? {} : { jsonSchema }),
    });
  }

  const middleware = (async (context: Context, next: () => Promise<void>) => {
    for (const check of checks) {
      // 校验中间件成功时会调用 next（这里给个空实现），失败时直接返回 Response
      const outcome = await check(context, async () => undefined);
      if (outcome instanceof Response) {
        return outcome;
      }
    }
    await next();
  }) as MiddlewareHandler<E>;

  for (const entry of entries) {
    attachRouteMeta(middleware, entry);
  }
  return middleware;
}
