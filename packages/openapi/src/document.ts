import type { Hono } from 'hono';
import {
  readRouteMeta,
  type DocumentationRouteMeta,
  type RouteMetaEntry,
  type ValidationRouteMeta,
} from '@hestjs/core';

export interface OpenApiInfo {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}

export interface OpenApiServer {
  readonly url: string;
  readonly description?: string;
}

export interface OpenApiConfig {
  readonly info: OpenApiInfo;
  readonly servers?: readonly OpenApiServer[];
}

export interface OpenApiDocument {
  readonly openapi: '3.1.0';
  readonly info: OpenApiInfo;
  readonly servers?: readonly OpenApiServer[];
  readonly paths: Record<string, Record<string, unknown>>;
}

interface SchemaProperties {
  readonly properties?: Record<string, Record<string, unknown>>;
  readonly required?: readonly string[];
}

/** `/users/:id` → `/users/{id}`，并取出参数名。 */
function toOpenApiPath(path: string): { path: string; params: string[] } {
  const params: string[] = [];
  const converted = path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    params.push(name);
    return `{${name}}`;
  });
  return { path: converted, params };
}

function expandParameters(
  entry: ValidationRouteMeta,
  location: 'query' | 'path' | 'header',
): unknown[] {
  const schema = (entry.jsonSchema ?? {}) as SchemaProperties;
  const required = new Set(schema.required ?? []);

  if (schema.properties === undefined) {
    // 拿不到结构就退化成整体参数，至少不撒谎
    return [{ name: entry.source, in: location, schema: entry.jsonSchema ?? {} }];
  }

  return Object.entries(schema.properties).map(([name, property]) => ({
    name,
    in: location,
    required: location === 'path' ? true : required.has(name),
    schema: property,
  }));
}

function buildOperation(
  documentation: DocumentationRouteMeta | undefined,
  validations: readonly ValidationRouteMeta[],
  pathParams: readonly string[],
): Record<string, unknown> {
  const parameters: unknown[] = [];
  const bodyEntry = validations.find((entry) => entry.source === 'json');

  for (const entry of validations) {
    if (entry.source === 'query') parameters.push(...expandParameters(entry, 'query'));
    if (entry.source === 'header') parameters.push(...expandParameters(entry, 'header'));
    if (entry.source === 'param') parameters.push(...expandParameters(entry, 'path'));
  }

  const covered = new Set(
    parameters
      .filter((item): item is { name: string } => typeof item === 'object' && item !== null)
      .map((item) => item.name),
  );
  for (const name of pathParams) {
    if (!covered.has(name)) {
      parameters.push({ name, in: 'path', required: true, schema: { type: 'string' } });
    }
  }

  const responses =
    documentation?.responses === undefined
      ? { '200': { description: 'OK' } }
      : Object.fromEntries(
          Object.entries(documentation.responses).map(([status, response]) => [
            status,
            response.jsonSchema === undefined
              ? { description: response.description }
              : {
                  description: response.description,
                  content: { 'application/json': { schema: response.jsonSchema } },
                },
          ]),
        );

  return {
    ...(documentation?.summary === undefined ? {} : { summary: documentation.summary }),
    ...(documentation?.description === undefined ? {} : { description: documentation.description }),
    ...(documentation?.tags === undefined ? {} : { tags: documentation.tags }),
    ...(documentation?.operationId === undefined ? {} : { operationId: documentation.operationId }),
    ...(documentation?.deprecated === undefined ? {} : { deprecated: documentation.deprecated }),
    ...(parameters.length === 0 ? {} : { parameters }),
    ...(bodyEntry === undefined
      ? {}
      : {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: bodyEntry.jsonSchema ?? {} } },
          },
        }),
    responses,
  };
}

/**
 * 从 Hono 实例生成一份 OpenAPI 3.1 文档。
 *
 * 路由表直接读 `hono.routes`，说明和 schema 从 handler 上挂的元数据读 ——
 * 所以**不用把任何东西写两遍**，也不需要在 createApp 里传模块图。
 *
 * 能自动读到的只有路由本身；其余（summary、响应结构、请求体 schema）
 * 靠 `documented()` 与 `validate({ jsonSchema })` 补。猜不出来就不写。
 */
export function buildOpenApiDocument(hono: Hono<any>, config: OpenApiConfig): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {};

  // 同一条路由会有多条 entries：中间件一条、最终 handler 一条。
  // 元数据可能挂在其中任何一个上，所以要按 (method, path) 聚合。
  const buckets = new Map<string, { method: string; path: string; metas: RouteMetaEntry[] }>();

  for (const route of hono.routes) {
    // 中间件注册出来的通配条目不是真实路由
    if (route.method.toLowerCase() === 'all' || route.path.includes('*')) {
      continue;
    }
    const key = `${route.method} ${route.path}`;
    const bucket = buckets.get(key) ?? { method: route.method, path: route.path, metas: [] };
    bucket.metas.push(...readRouteMeta(route.handler));
    buckets.set(key, bucket);
  }

  for (const bucket of buckets.values()) {
    const { path, params } = toOpenApiPath(bucket.path);
    const documentation = bucket.metas.find(
      (entry): entry is DocumentationRouteMeta => entry.kind === 'documentation',
    );
    const validations = bucket.metas.filter(
      (entry): entry is ValidationRouteMeta => entry.kind === 'validation',
    );

    (paths[path] ??= {})[bucket.method.toLowerCase()] = buildOperation(
      documentation,
      validations,
      params,
    );
  }

  return {
    openapi: '3.1.0',
    info: config.info,
    ...(config.servers === undefined ? {} : { servers: config.servers }),
    paths,
  };
}
