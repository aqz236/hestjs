import type { ResolvedGraph } from '@hestjs/core';
import { readController } from '@hestjs/core';
import { readRoutes } from '@hestjs/core';
import { readSchemas, type JsonSchema, type ValidationEntry } from '@hestjs/validation';
import { readDocumentation, type RouteDocumentation } from './describe';

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

/** `/users/:id` → `/users/{id}`，并取出参数名。 */
function toOpenApiPath(path: string): { path: string; params: string[] } {
  const params: string[] = [];
  const converted = path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
    params.push(name);
    return `{${name}}`;
  });
  return { path: converted, params };
}

interface SchemaProperties {
  readonly properties?: Record<string, JsonSchema>;
  readonly required?: readonly string[];
}

function expandParameters(entry: ValidationEntry, location: 'query' | 'path' | 'header'): unknown[] {
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
  documentation: RouteDocumentation | undefined,
  entries: readonly ValidationEntry[],
  pathParams: readonly string[],
): Record<string, unknown> {
  const parameters: unknown[] = [];
  const requestBody: Record<string, unknown> | undefined = (() => {
    const body = entries.find((entry) => entry.source === 'json');
    const form = entries.find((entry) => entry.source === 'form');
    const entry = body ?? form;
    if (entry === undefined) return undefined;
    return {
      required: true,
      content: {
        [body === undefined ? 'application/x-www-form-urlencoded' : 'application/json']: {
          schema: entry.jsonSchema ?? {},
        },
      },
    };
  })();

  for (const entry of entries) {
    if (entry.source === 'query') parameters.push(...expandParameters(entry, 'query'));
    if (entry.source === 'header') parameters.push(...expandParameters(entry, 'header'));
    if (entry.source === 'param') parameters.push(...expandParameters(entry, 'path'));
  }

  // 路径里出现但 schema 没覆盖的参数，补一条最朴素的声明
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
    ...(requestBody === undefined ? {} : { requestBody }),
    responses,
  };
}

/**
 * 把模块图编译成一份 OpenAPI 3.1 文档。
 *
 * 能自动读到的只有两样：路由表和被校验装饰器登记过的 schema。
 * 其余（summary、响应结构）靠 `@Describe` 补，猜不出来就不写。
 */
export function buildOpenApiDocument(
  graph: ResolvedGraph,
  config: OpenApiConfig,
): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const binding of graph.controllers) {
    const base = readController(binding.controller)?.path ?? '';
    for (const route of readRoutes(binding.controller.prototype)) {
      const { path, params } = toOpenApiPath(`${base}${route.path === '/' ? '' : route.path}`);
      const entries = readSchemas(binding.controller.prototype, route.propertyKey);
      const documentation = readDocumentation(binding.controller.prototype, route.propertyKey);

      const operations = (paths[path] ??= {});
      operations[route.method.toLowerCase()] = buildOperation(documentation, entries, params);
    }
  }

  return {
    openapi: '3.1.0',
    info: config.info,
    ...(config.servers === undefined ? {} : { servers: config.servers }),
    paths,
  };
}
