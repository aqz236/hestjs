import { Scalar } from "@scalar/hono-api-reference";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import type { Context, Hono, MiddlewareHandler } from "hono";
import type { ControllerConstructor } from "@hestjs/core";
import type {
  ScalarConfig,
  ScalarMiddlewareConfig,
} from "./scalar-config.interface";
import { OpenAPIGenerator, type OpenAPIGeneratorConfig } from './openapi-generator';
import { elysiajsTheme } from '@scalar/themes';

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
    theme = "hestjs",
    title = "API Documentation",
    cdn,
    proxyUrl,
    servers,
    customCss,
  } = config;

  // 构建 Scalar 配置
  const scalarConfig: any = {};

  // 选择主题CSS
  let themeCSS = '';
  if (theme === 'elysia') {
    themeCSS = elysiajsTheme;
  }
  
  // 设置自定义CSS（主题CSS + 用户自定义CSS）
  if (themeCSS || customCss) {
    scalarConfig.customCss = `${themeCSS}
${customCss || ''}`;
  }

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
  controllers: ControllerConstructor[],
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
    // console.log(`Controller ${controller.name} path:`, controllerPath);
    generator.addController(controller, controllerPath);
  }

  // 生成 OpenAPI 文档
  const openApiDoc = generator.generateDocument();

  // 调试：打印生成的文档

  // 首先设置 OpenAPI JSON 端点
  const openApiPath = '/openapi.json';
  
  app.get(openApiPath, (c) => {
    
    // 尝试直接返回字符串
    const jsonString = JSON.stringify(openApiDoc);
    
    return c.text(jsonString, 200, {
      'Content-Type': 'application/json'
    });
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
