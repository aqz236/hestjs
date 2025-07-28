# CQRS Demo

这是一个演示如何在HestJS中使用CQRS模式的示例应用。

## 功能特性

- 创建用户 (Command)
- 查询用户 (Query)
- 用户创建事件处理 (Event)

## 运行示例

1. 安装依赖：

```bash
npm install
```

2. 构建项目：

```bash
npm run build
```

3. 启动应用：

```bash
npm start
```

## API 端点

### 创建用户

```
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 获取用户

```
GET /users/:id
```

## 架构说明

### Commands (命令)

- `CreateUserCommand` - 创建用户命令
- `CreateUserHandler` - 创建用户命令处理器

### Queries (查询)

- `GetUserQuery` - 获取用户查询
- `GetUserHandler` - 获取用户查询处理器

### Events (事件)

- `UserCreatedEvent` - 用户创建事件
- `UserCreatedHandler` - 用户创建事件处理器

### Controllers (控制器)

- `UserController` - 用户控制器，处理HTTP请求

这个示例展示了如何：

1. 使用Command处理业务操作
2. 使用Query处理数据查询
3. 使用Event处理副作用操作
4. 将CQRS与HestJS框架集成
