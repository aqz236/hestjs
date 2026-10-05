import type { StandardSchemaV1 } from '@standard-schema/spec';

export type { StandardSchemaV1 };

/** 从 schema 推出校验后的类型。 */
export type InferInput<TSchema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<TSchema>;

/** 别名，按「输入」的直觉读。 */
export type InferOutput<TSchema extends StandardSchemaV1> = StandardSchemaV1.InferOutput<TSchema>;

/** 一条校验失败的记录，已经拍平成可序列化的形状。 */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** 只要求「能吐出 JSON Schema」，不关心是哪个库产的。 */
export type JsonSchema = Record<string, unknown>;

export type ValidationSource = 'json' | 'query' | 'param' | 'header' | 'form' | 'cookie';

/**
 * Hono 的 Input 形状糖。
 *
 * ```ts
 * create(c: RouteContext<'/users', ValidatedBody<CreateUserInput>>) {
 *   const input = c.req.valid('json');  // CreateUserInput
 * }
 * ```
 */
export type ValidatedBody<T> = { out: { json: T } };
export type ValidatedQuery<T> = { out: { query: T } };
export type ValidatedParam<T> = { out: { param: T } };
export type ValidatedHeader<T> = { out: { header: T } };

export interface ValidationEntry {
  readonly source: ValidationSource;
  readonly schema: StandardSchemaV1;
  readonly jsonSchema?: JsonSchema;
}

export type ValidationResult<TSchema extends StandardSchemaV1> =
  | { readonly ok: true; readonly value: StandardSchemaV1.InferOutput<TSchema> }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

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

/** 跑一次 Standard Schema 校验，把结果收敛成判别式联合。 */
export async function validateSchema<TSchema extends StandardSchemaV1>(
  schema: TSchema,
  value: unknown,
): Promise<ValidationResult<TSchema>> {
  const result = await schema['~standard'].validate(value);
  if ('issues' in result && result.issues !== undefined) {
    return { ok: false, issues: toIssues(result.issues) };
  }
  return { ok: true, value: (result as { value: StandardSchemaV1.InferOutput<TSchema> }).value };
}

/**
 * 把某个 schema 的 JSON Schema 附在原型上，供文档生成使用。
 *
 * core 与 validation 都不关心它，openapi 之类的包来读。
 */
export const SCHEMAS_META = Symbol.for('hestjs:validation:schemas');

interface SchemaCarrier {
  [SCHEMAS_META]?: Map<string | symbol, ValidationEntry[]>;
}

export function rememberSchema(
  prototype: object,
  propertyKey: string | symbol,
  entry: ValidationEntry,
): void {
  const carrier = prototype as SchemaCarrier;
  if (!Object.hasOwn(prototype, SCHEMAS_META)) {
    Object.defineProperty(prototype, SCHEMAS_META, {
      value: new Map<string | symbol, ValidationEntry[]>(),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  const map = carrier[SCHEMAS_META]!;
  map.set(propertyKey, [...(map.get(propertyKey) ?? []), entry]);
}

export function readSchemas(prototype: object, propertyKey: string | symbol): readonly ValidationEntry[] {
  return (prototype as SchemaCarrier)[SCHEMAS_META]?.get(propertyKey) ?? [];
}
