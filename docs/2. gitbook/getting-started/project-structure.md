# 🏗️ 项目结构说明

HestJS 项目采用模块化设计，结构清晰，便于扩展和维护。以下为推荐的项目结构：

```
src/
├── index.ts                   # 应用入口点
├── app.module.ts              # 根模块
├── app.controller.ts          # 应用控制器
├── app.service.ts             # 应用服务
├── common/                    # 公共组件
│   ├── filters/               # 全局过滤器
│   └── interceptors/          # 全局拦截器
└── modules/                   # 功能模块
    ├── users/                 # 用户模块
    │   ├── dto/               # 数据传输对象
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── users.module.ts
    └── custom-validation/     # 自定义验证模块
        ├── dto/
        ├── custom-validation.controller.ts
        ├── custom-validation.service.ts
        └── custom-validation.module.ts
```

## 主要目录说明

- **src/**：源码主目录
- **index.ts**：应用启动入口
- **app.module.ts**：根模块，组织控制器和服务
- **common/**：存放通用组件，如过滤器、拦截器
- **modules/**：按功能拆分的业务模块
- **dto/**：数据传输对象，定义接口数据结构

## 扩展建议

- 按业务领域拆分模块，提升可维护性
- 公共逻辑抽离至 common 目录
- 所有 API 路由、服务、DTO 均应模块化管理

> 📦 推荐遵循此结构，便于团队协作和项目扩展。

---

下一步：深入了解 HestJS 控制器与路由。
