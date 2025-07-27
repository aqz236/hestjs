# @hestjs/validation

HestJS 验证模块，基于 TypeBox 提供强类型验证功能。

## 特性

- 🔥 基于 TypeBox 的类型安全验证
- 🎯 装饰器语法，简洁易用
- 🚀 自动类型推断和转换
- 🛡️ 内置常用验证规则
- 📦 轻量级，零额外依赖
- ⚡ 高性能验证引擎

## 安装

```bash
npm install @hestjs/validation
# 或者
yarn add @hestjs/validation
# 或者
pnpm add @hestjs/validation
```

## 快速开始

### 基础用法

```typescript
import { IsString, IsNumber, IsEmail, IsOptional } from '@hestjs/validation';

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @IsOptional()
  age?: number;
}

// 在控制器中使用
import { Body, Controller, Post } from '@hestjs/core';

@Controller('/users')
export class UserController {
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // createUserDto 已经被自动验证
    return { message: 'User created', user: createUserDto };
  }
}
```

### 自定义验证

```typescript
import { IsCustom, ValidationUtils } from '@hestjs/validation';

class ProductDto {
  @IsString()
  name: string;

  @IsCustom((value) => value > 0, '价格必须大于0')
  price: number;
}
```

### 验证工具类

```typescript
import { ValidationUtils } from '@hestjs/validation';

// 验证对象
try {
  const validatedUser = await ValidationUtils.validateObject(CreateUserDto, userData);
  console.log('验证成功:', validatedUser);
} catch (error) {
  console.log('验证失败:', error.message);
}

// 检查是否有效
const isValid = await ValidationUtils.isValid(CreateUserDto, userData);

// 获取验证错误
const errors = await ValidationUtils.getValidationErrors(CreateUserDto, userData);

// 批量验证
const { valid, errors: batchErrors } = await ValidationUtils.validateBatch(
  CreateUserDto, 
  [userData1, userData2, userData3]
);

// 部分验证
const partialUser = await ValidationUtils.validatePartial(CreateUserDto, {
  name: 'John' // 只验证提供的字段
});
```

## 可用装饰器

### 基础类型验证

- `@IsString()` - 字符串验证
- `@IsNumber()` - 数字验证
- `@IsBoolean()` - 布尔值验证
- `@IsArray()` - 数组验证
- `@IsObject()` - 对象验证

### 字符串验证

- `@IsEmail()` - 邮箱格式验证
- `@IsUrl()` - URL 格式验证
- `@IsUuid()` - UUID 格式验证
- `@MinLength(min)` - 最小长度
- `@MaxLength(max)` - 最大长度
- `@Matches(pattern)` - 正则表达式匹配

### 数字验证

- `@Min(min)` - 最小值
- `@Max(max)` - 最大值
- `@IsPositive()` - 正数
- `@IsNegative()` - 负数
- `@IsInt()` - 整数

### 日期验证

- `@IsDate()` - 日期验证
- `@IsDateString()` - 日期字符串验证

### 其他

- `@IsOptional()` - 可选字段
- `@IsEnum(enumObject)` - 枚举验证
- `@IsCustom(validator, message)` - 自定义验证

## 高级用法

### 嵌套对象验证

```typescript
class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^\d{5}$/)
  zipCode: string;
}

class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

### 数组验证

```typescript
class CreateUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}
```

### 条件验证

```typescript
class ConditionalDto {
  @IsString()
  type: 'email' | 'phone';

  @IsOptional()
  @IsEmail()
  @ValidateIf(o => o.type === 'email')
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  @ValidateIf(o => o.type === 'phone')
  phone?: string;
}
```

## 配置选项

### 全局配置

```typescript
import { ValidationModule } from '@hestjs/validation';

@Module({
  imports: [
    ValidationModule.forRoot({
      whitelist: true, // 移除未装饰的属性
      forbidNonWhitelisted: true, // 禁止非白名单属性
      transform: true, // 自动类型转换
      disableErrorMessages: false, // 禁用错误消息
      dismissDefaultMessages: false, // 忽略默认消息
      validationError: { target: false }, // 错误对象配置
    }),
  ],
})
export class AppModule {}
```

### 管道配置

```typescript
import { ValidationPipe } from '@hestjs/validation';

// 在控制器方法中使用
@Post()
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
}))
async createUser(@Body() createUserDto: CreateUserDto) {
  return createUserDto;
}
```

## 错误处理

验证错误会抛出 `ValidationException`，包含详细的错误信息：

```typescript
try {
  await ValidationUtils.validateObject(CreateUserDto, invalidData);
} catch (error) {
  if (error instanceof ValidationException) {
    console.log('验证错误:', error.getMessages());
    console.log('错误详情:', error.getErrors());
  }
}
```

## TypeScript 支持

完全支持 TypeScript，提供类型安全的验证：

```typescript
// 自动类型推断
const user: CreateUserDto = await ValidationUtils.validateObject(CreateUserDto, data);

// 生成 TypeBox Schema
const schema = ValidationUtils.generateSchema(CreateUserDto);
```

## 与 HestJS 集成

### 自动验证

```typescript
import { Body, Controller, Post } from '@hestjs/core';
import { UseValidation } from '@hestjs/validation';

@Controller('/api')
@UseValidation() // 启用自动验证
export class ApiController {
  @Post('/users')
  async createUser(@Body() userData: CreateUserDto) {
    // userData 已自动验证
    return userData;
  }
}
```

### 自定义验证拦截器

```typescript
import { UseInterceptors } from '@hestjs/core';
import { ValidationInterceptor } from '@hestjs/validation';

@Controller('/api')
@UseInterceptors(ValidationInterceptor)
export class ApiController {
  // ...
}
```

## 性能

- 基于 TypeBox 的高性能验证引擎
- 支持 JIT 编译的验证函数
- 最小化运行时开销
- 支持缓存验证结果

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v0.1.2
- 新增 ValidationUtils 工具类
- 支持批量验证和部分验证
- 优化错误消息格式
- 提升验证性能

### v0.1.1
- 修复 TypeBox 兼容性问题
- 优化装饰器实现

### v0.1.0
- 初始版本发布
- 基础验证装饰器
- TypeBox 集成
