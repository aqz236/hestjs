# 🚀 高级功能

HestJS OpenAPI 集成支持多种高级特性，满足复杂 API 文档需求。

## 多控制器文档

可同时为多个控制器生成文档：

```typescript
app.useScalarWithControllers([
  AppController,
  UsersController,
  OtherController,
]);
```

## 自定义扩展

支持 OpenAPI 扩展字段：

```typescript
app.useScalarWithControllers([
  AppController,
], {
  info: { title: 'HestJS API', version: '1.0.0' },
  'x-logo': { url: '/logo.png' },
});
```

## Markdown 导出

一键导出 Markdown 格式文档，便于 LLM/知识库集成。

## 最佳实践

- 利用扩展字段提升文档品牌化
- 多控制器统一管理，便于大型项目

> 🚀 高级功能让你的 API 文档更强大、更灵活。

---

下一步：CQRS 架构介绍。
