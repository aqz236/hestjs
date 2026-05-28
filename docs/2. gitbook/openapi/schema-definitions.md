# 📦 Schema 定义

HestJS 支持灵活的 Schema 定义，自动生成 OpenAPI 数据结构。

## DTO 与 Schema

推荐使用 DTO 类结合验证装饰器自动生成 Schema：

```typescript
import { IsString, IsEmail } from '@hestjs/validation';

export class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
```

## 手动定义 Schema

如需自定义复杂结构，可直接在装饰器中声明：

```typescript
@ApiBody({
  'application/json': {
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
  },
})
```

## 最佳实践

- 优先使用 DTO 自动生成 Schema
- 复杂结构可手动声明，确保文档准确

> 📦 Schema 定义让你的 API 数据结构清晰、可视化。

---

下一步：认证文档。
