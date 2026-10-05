import type { Env, Hono } from 'hono';
import { Hono as HonoApp } from 'hono';
import { buildOpenApiDocument, type OpenApiConfig } from './document';

export interface OpenApiRoutesConfig extends OpenApiConfig {
  /** 要生成文档的 Hono 实例，通常是 `app.hono`。 */
  readonly hono: Hono<any>;
  /** 文档 JSON 的路径。默认 /openapi.json */
  readonly jsonPath?: string;
  /** Scalar UI 的路径。默认 /docs */
  readonly docsPath?: string;
  /** 关掉 UI，只出 JSON。 */
  readonly ui?: boolean;
}

function scalarHtml(jsonPath: string, title: string): string {
  return `<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <script id="api-reference" data-url="${jsonPath}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

/**
 * 生成一个 Hono 子应用，暴露文档 JSON 与 Scalar UI。
 *
 * ```ts
 * const app = createApp(AppModule, { routes });
 * app.hono.route('/', openApiRoutes({ hono: app.hono, info: { ... } }));
 * ```
 *
 * 挂载是显式的，不藏在 createApp 里。
 */
export function openApiRoutes<E extends Env>(config: OpenApiRoutesConfig): Hono<E> {
  const app = new HonoApp() as Hono<E>;
  const jsonPath = config.jsonPath ?? '/openapi.json';
  const docsPath = config.docsPath ?? '/docs';
  const document = buildOpenApiDocument(config.hono, config);

  app.get(jsonPath, (c) => c.json(document));

  if (config.ui ?? true) {
    app.get(docsPath, (c) => c.html(scalarHtml(jsonPath, config.info.title)));
  }

  return app;
}
