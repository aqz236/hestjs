# 🎨 Scalar UI 集成

HestJS 集成 Scalar，提供现代化的 API 文档界面，支持多主题和 Markdown 导出。

## 启用 Scalar UI

在主入口注册 Scalar 配置：

```typescript
app.useScalarWithControllers([
  AppController,
], {}, {
  path: '/docs',
  theme: 'elysia',
  title: 'HestJS API Documentation',
  enableMarkdown: true,
  markdownPath: '/api-docs.md',
});
```

## 访问方式

- UI: `http://localhost:3002/docs`
- Markdown: `http://localhost:3002/api-docs.md`

## 主题切换

支持多种主题，可在配置中指定：

```typescript
theme: 'elysia' // 或 'default', 'dark', 'light' 等
```

## 最佳实践

- 推荐开启 Markdown 导出，便于 LLM/文档集成
- 页面标题与主题可自定义，提升品牌体验

> 🎨 Scalar UI 让你的 API 文档更美观、更易用。

---

下一步：了解高级功能。
