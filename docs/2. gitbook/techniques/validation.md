# ✅ 数据验证系统

HestJS 集成强大的数据验证机制，支持装饰器和管道，保障 API 数据安全与规范。

## DTO 与验证装饰器

定义 DTO 并使用验证装饰器：

```typescript
import { IsString, IsEmail } from '@hestjs/validation';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
```

## 验证管道

自动验证请求体数据：

```typescript
import { ValidationPipe } from '@hestjs/validation';
import { Application } from '@hestjs/core';

const app = new Application(AppModule);
app.useGlobalPipes(new ValidationPipe());
```

## 控制器中应用

```typescript
import { Body, Post, Controller } from '@hestjs/core';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('/api/users')
export class UsersController {
  @Post('/')
  create(@Body() dto: CreateUserDto) {
    // dto 已自动验证
    return dto;
  }
}
```

## 最佳实践

- 所有输入数据均应定义 DTO 并加验证装饰器
- 全局注册验证管道，统一数据校验

> ✅ 数据验证让你的 API 更安全、更可靠。

---

下一步：OpenAPI 集成入门。
