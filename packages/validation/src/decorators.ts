import type { Context, Handler } from 'hono';
import { sValidator } from '@hono/standard-validator';
import { addRouteMiddleware } from '@hestjs/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  rememberSchema,
  toIssues,
  type JsonSchema,
  type ValidationIssue,
  type ValidationSource,
} from './schema';

export interface ValidateOptions {
  /** 校验失败时的响应。默认 400 加结构化 issues。 */
  readonly onInvalid?: (
    issues: readonly ValidationIssue[],
    context: Context,
  ) => Response | Promise<Response>;
  /**
   * 给文档生成用的 JSON Schema。不传只是没有文档，不影响校验行为。
   *
   * 各家产法不同（zod 用 z.toJSONSchema、valibot 用 @valibot/to-json-schema），
   * 所以这里不猜，你自己算好传进来。
   */
  readonly jsonSchema?: JsonSchema;
}

function defaultInvalid(context: Context, issues: readonly ValidationIssue[]): Response {
  return context.json({ message: '请求参数校验失败', issues }, 400);
}

function middleware(
  source: ValidationSource,
  schema: StandardSchemaV1,
  options: ValidateOptions,
): Handler {
  // 校验本身交给 Hono 官方的 Standard Schema 中间件。
  // 我们只负责两件事：把它挂到装饰器标记的方法上，以及记下 schema 供文档生成读取。
  return sValidator(source, schema, (result, context) => {
    if (result.success) {
      return;
    }
    const issues = toIssues(result.error);
    return options.onInvalid?.(issues, context) ?? defaultInvalid(context, issues);
  }) as unknown as Handler;
}

function decorator(source: ValidationSource) {
  return (schema: StandardSchemaV1, options: ValidateOptions = {}): MethodDecorator =>
    (target, propertyKey) => {
      addRouteMiddleware(target, propertyKey, middleware(source, schema, options));
      rememberSchema(target, propertyKey, { source, schema, jsonSchema: options.jsonSchema });
    };
}

/** 校验 JSON 请求体，通过后可用 `c.req.valid('json')` 取到。 */
export const Body = decorator('json');

/** 校验查询串。数字、布尔会按 schema 转换后再交给你。 */
export const Query = decorator('query');

/** 校验路径参数。 */
export const Param = decorator('param');

/** 校验请求头。 */
export const Header = decorator('header');

/** 校验表单体（application/x-www-form-urlencoded、multipart）。 */
export const Form = decorator('form');

/** 校验 Cookie。 */
export const Cookie = decorator('cookie');
