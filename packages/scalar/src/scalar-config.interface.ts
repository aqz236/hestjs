import type { Context } from 'hono';

/**
 * Scalar 配置选项
 */
export interface ScalarConfig {
  /**
   * 是否启用 Scalar
   * @default true
   */
  enabled?: boolean;

  /**
   * 文档服务路径
   * @default '/docs'
   */
  path?: string;

  /**
   * OpenAPI 规范（URL 或对象）
   */
  spec?: string | object | ((c: Context) => string | object | Promise<string | object>);

  /**
   * 页面标题
   * @default 'API Documentation'
   */
  title?: string;

  /**
   * UI 主题
   * @default 'elysia'
   */
  theme?: 'elysia' | 'default' | 'alternate' | 'moon' | 'purple' | 'solarized' | 'none';

  /**
   * 自定义 CDN 地址
   */
  cdn?: string;

  /**
   * 代理 URL（用于开发环境解决 CORS 问题）
   */
  proxyUrl?: string;

  /**
   * 服务器配置
   */
  servers?: Array<{
    url: string;
    description?: string;
  }>;

  /**
   * 自定义 CSS
   */
  customCss?: string;

  /**
   * 是否启用 Markdown 导出（供 LLM 使用）
   * @default false
   */
  enableMarkdown?: boolean;

  /**
   * Markdown 导出路径
   * @default '/llms.txt'
   */
  markdownPath?: string;
}

/**
 * Scalar 中间件配置
 */
export interface ScalarMiddlewareConfig extends Omit<ScalarConfig, 'path'> {
  /**
   * OpenAPI 规范 URL
   */
  url?: string;

  /**
   * OpenAPI 规范内容
   */
  content?: object;
}
