# 🔐 认证文档

HestJS 支持在 OpenAPI 文档中集成认证机制，提升 API 安全性。

## 配置认证方案

在 Scalar 配置中声明认证类型：

```typescript
app.useScalarWithControllers([
  AppController,
], {
  info: { title: 'HestJS API', version: '1.0.0' },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
});
```

## 装饰器声明

可在控制器或方法上声明需要认证：

```typescript
@ApiSecurity('bearerAuth')
@Get('/profile')
getProfile() { /* ... */ }
```

## 最佳实践

- 所有敏感接口建议加认证声明
- 明确文档中认证方式，便于前后端协作

> 🔐 认证集成让你的 API 更安全、更规范。

---

下一步：Scalar UI 集成。
