import { Scalar } from "@scalar/hono-api-reference";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import type { Context, Hono, MiddlewareHandler } from "hono";
import type {
  ScalarConfig,
  ScalarMiddlewareConfig,
} from "./scalar-config.interface";
import { OpenAPIGenerator, type OpenAPIGeneratorConfig } from './openapi-generator';

/**
 * HestJS 默认主题样式
 */
const HEST_THEME_CSS = `
  .scalar-app {
    --scalar-color-1: #0066cc;
    --scalar-color-2: #004499;
    --scalar-color-3: #0052cc;
    --scalar-color-accent: #ff6b35;
    --scalar-background-1: #ffffff;
    --scalar-background-2: #f8fafc;
    --scalar-background-3: #e2e8f0;
    --scalar-border-color: #e2e8f0;
  }
  
  .dark .scalar-app {
    --scalar-background-1: #0f172a;
    --scalar-background-2: #1e293b;
    --scalar-background-3: #334155;
    --scalar-border-color: #475569;
  }
  
  .scalar-app .scalar-api-reference__header {
    background: linear-gradient(135deg, var(--scalar-color-1), var(--scalar-color-2));
  }
`;

/**
 * 创建 Scalar 中间件
 */
export function createScalarMiddleware(
  config: ScalarMiddlewareConfig
): MiddlewareHandler {
  const {
    spec,
    url,
    content,
    theme = "hest",
    title = "API Documentation",
    cdn,
    proxyUrl,
    servers,
    customCss,
  } = config;

  // 构建 Scalar 配置
  const scalarConfig: any = {
    theme: theme === "hest" ? "none" : theme,
    customCss:
      theme === "hest" ? `${HEST_THEME_CSS}\n${customCss || ""}` : customCss,
  };

  // 设置规范来源
  if (url) {
    scalarConfig.url = url;
  } else if (content) {
    scalarConfig.content = content;
  } else if (spec) {
    if (typeof spec === "string") {
      scalarConfig.url = spec;
    } else if (typeof spec === "function") {
      // 动态配置，需要在中间件中处理
      return async (c, next) => {
        const resolvedSpec = await spec(c);
        const dynamicConfig = {
          ...scalarConfig,
          ...(typeof resolvedSpec === "string"
            ? { url: resolvedSpec }
            : { content: resolvedSpec }),
        };

        return Scalar(dynamicConfig)(c, next);
      };
    } else {
      scalarConfig.content = spec;
    }
  }

  // 设置其他选项
  if (title) scalarConfig.pageTitle = title;
  if (cdn) scalarConfig.cdn = cdn;
  if (proxyUrl) scalarConfig.proxyUrl = proxyUrl;
  if (servers) scalarConfig.servers = servers;

  return Scalar(scalarConfig);
}

/**
 * 创建 Markdown 中间件（供 LLM 使用）
 */
export function createMarkdownMiddleware(
  spec: string | object
): MiddlewareHandler {
  return async (c: Context) => {
    try {
      let specContent: string;

      if (typeof spec === "string") {
        // 如果是 URL，需要获取内容
        if (spec.startsWith("http")) {
          const response = await fetch(spec);
          specContent = await response.text();
        } else {
          // 假设是相对路径，从当前应用获取
          const baseUrl = new URL(c.req.url).origin;
          const response = await fetch(`${baseUrl}${spec}`);
          specContent = await response.text();
        }
      } else {
        specContent = JSON.stringify(spec);
      }

      const markdown = await createMarkdownFromOpenApi(specContent);
      return c.text(markdown, 200, {
        "Content-Type": "text/plain; charset=utf-8",
      });
    } catch (error) {
      console.error("Failed to generate markdown:", error);
      return c.text("Failed to generate API documentation markdown", 500);
    }
  };
}

/**
 * 在 Hono 应用上设置 Scalar
 */
export function setupScalar(app: Hono, config: ScalarConfig): void {
  const {
    path = "/docs",
    enableMarkdown = false,
    markdownPath = "/llms.txt",
    spec,
    ...middlewareConfig
  } = config;

  // 设置主文档路径
  const scalarMiddleware = createScalarMiddleware({
    ...middlewareConfig,
    spec,
  });

  app.get(path, scalarMiddleware);

  // 如果启用了 Markdown 导出
  if (enableMarkdown && spec) {
    const markdownMiddleware = createMarkdownMiddleware(spec);
    app.get(markdownPath, markdownMiddleware);
  }
}

/**
 * 从控制器生成 OpenAPI 并设置 Scalar
 */
export function setupScalarWithControllers(
  app: Hono,
  controllers: any[],
  generatorConfig: OpenAPIGeneratorConfig,
  scalarConfig: Omit<ScalarConfig, 'spec'> = {}
): void {
  const generator = new OpenAPIGenerator(generatorConfig);

  // 从控制器生成路径
  for (const controller of controllers) {
    // 获取控制器的基础路径（从 @Controller 装饰器）
    const HEST_CONTROLLER_KEY = Symbol.for('hest:controller');
    const controllerMetadata = Reflect.getMetadata(HEST_CONTROLLER_KEY, controller);
    const controllerPath = controllerMetadata?.path || '';
    console.log(`Controller ${controller.name} path:`, controllerPath);
    generator.addController(controller, controllerPath);
  }

  // 生成 OpenAPI 文档
  const openApiDoc = generator.generateDocument();

  // 调试：打印生成的文档
  console.log('Generated OpenAPI Document:', JSON.stringify(openApiDoc, null, 2));

  // 首先设置 OpenAPI JSON 端点
  const openApiPath = '/openapi.json';
  app.get(openApiPath, (c) => {
    return c.json(openApiDoc);
  });

  // 然后设置 Scalar，指向 OpenAPI JSON 端点
  const {
    path = '/docs',
    enableMarkdown = false,
    markdownPath = '/llms.txt',
    ...middlewareConfig
  } = scalarConfig;

  // 设置 Scalar 中间件，使用 URL 而不是直接传递对象
  const scalarMiddleware = createScalarMiddleware({
    ...middlewareConfig,
    url: openApiPath, // 使用 URL 而不是 content
  });

  app.get(path, scalarMiddleware);

  // 如果启用了 Markdown 导出
  if (enableMarkdown) {
    const markdownMiddleware = createMarkdownMiddleware(openApiDoc);
    app.get(markdownPath, markdownMiddleware);
  }
}
