# 🏷️ API 文档装饰器

HestJS 提供丰富的装饰器用于自动生成 OpenAPI 文档，极大提升开发效率。

## 常用装饰器

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@ApiTags(...)` | 控制器/方法标签 | `@ApiTags('Users')` |
| `@ApiOperation(...)` | API 操作描述 | `@ApiOperation({ summary: '获取用户' })` |
| `@ApiResponse(status, spec)` | 响应格式 | `@ApiResponse('200', { description: '成功' })` |
| `@ApiParam(name, spec)` | 路径参数 | `@ApiParam('id', { type: 'string' })` |
| `@ApiQuery(name, spec)` | 查询参数 | `@ApiQuery('page', { type: 'number' })` |
| `@ApiBody(schema, options)` | 请求体 | `@ApiBody({ schema: userSchema })` |

## 示例代码

```typescript
@Controller('/api/users')
@ApiTags('Users')
export class UsersController {
  @Get('/')
  @ApiOperation({ summary: '获取所有用户' })
  @ApiResponse('200', { description: '成功', content: { 'application/json': { schema: { type: 'array' } } } })
  getAll() { /* ... */ }

  @Get('/:id')
  @ApiParam('id', { description: '用户ID', schema: { type: 'string' } })
  @ApiResponse('200', { description: '用户详情' })
  getById(@Param('id') id: string) { /* ... */ }
}
```

## 最佳实践

- 所有 API 路由建议加上文档装饰器
- 响应、参数、请求体均应详细描述

> 🏷️ 装饰器让你的 API 文档自动生成，开发更高效。

---

下一步：了解 Schema 定义。
