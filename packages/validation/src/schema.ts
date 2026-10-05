import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ValidationRouteMeta } from '@hestjs/core';

export type { StandardSchemaV1 };

/** 从 schema 推出校验后的类型。 */
export type InferInput<TSchema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<TSchema>;
export type InferOutput<TSchema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<TSchema>;

/** 只要求「能吐出 JSON Schema」，不关心是哪个库产的。 */
export type JsonSchema = Record<string, unknown>;

/** 一条校验失败的记录，已经拍平成可序列化的形状。 */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ValidationSource = ValidationRouteMeta['source'];

function flattenPath(path: StandardSchemaV1.Issue['path']): string {
  return (path ?? [])
    .map((segment) =>
      typeof segment === 'object' && segment !== null ? String(segment.key) : String(segment),
    )
    .join('.');
}

export function toIssues(issues: readonly StandardSchemaV1.Issue[]): ValidationIssue[] {
  return issues.map((issue) => ({ path: flattenPath(issue.path), message: issue.message }));
}

/**
 * 跑一次 Standard Schema 校验，结果收敛成判别式联合。
 *
 * 独立于 HTTP：需要在校验之外单独验一个对象时用它。
 */
export async function validateSchema<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
): Promise<
  | { readonly ok: true; readonly value: StandardSchemaV1.InferOutput<TSchema> }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] }
> {
  const result = await schema['~standard'].validate(value);
  if ('issues' in result && result.issues !== undefined) {
    return { ok: false, issues: toIssues(result.issues) };
  }
  return { ok: true, value: (result as { value: StandardSchemaV1.InferOutput<TSchema> }).value };
}
