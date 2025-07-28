# 📄 OpenAPI 集成入门

HestJS 支持自动生成 OpenAPI 3.0 规范文档，极大提升 API 可维护性与可视化体验。

## 启用 API 文档

在主入口文件注册 Scalar 文档：

```typescript
app.useScalarWithControllers(
  [AppController, UsersController],
  {
    info: {
      title: 'HestJS API',
      version: '1.0.0',
      description: 'HestJS 框架 API 文档',
    },
    servers: [
      { url: 'http://localhost:3002', description: '开发环境' },
    ],
  },
  {
    path: '/docs',
    theme: 'elysia',
    title: 'HestJS API Documentation',
    enableMarkdown: true,
    markdownPath: '/api-docs.md',
  }
);
```

## 访问文档

- Scalar UI: `http://localhost:3002/docs`
- OpenAPI JSON: `http://localhost:3002/openapi.json`
- Markdown: `http://localhost:3002/api-docs.md`

## 兼容性说明

- 完全兼容 OpenAPI 3.0 规范
- 支持多种文档格式与主题

> 📄 一行代码，自动生成高质量 API 文档。

---

下一步：了解 API 文档装饰器。
