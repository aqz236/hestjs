---
layout: home

hero:
  name: HestJS
  text: 把 Hono 组织起来
  tagline: 不提供自己的请求/响应抽象，不接管你的服务器，也不把 Hono 实例藏起来。
  actions:
    - theme: brand
      text: 快速开始
      link: /getting-started
    - theme: alt
      text: 这是什么
      link: /intro

features:
  - title: Hono 实例是唯一真相
    details: "createApp() 返回的 app.hono 就是 Hono 本身。没有包装、没有代理，hono.route() / c.req.raw / c.var 全部照旧。"
  - title: 零反射依赖注入
    details: 依赖写在 @Inject() 里，一眼可见。不引 reflect-metadata，不开 emitDecoratorMetadata，换任何打包器都不会静默失效。
  - title: 路由就是 Hono 的路由
    details: 框架不替你定义路由。链式注册保住了 hc 的端到端 RPC 类型，也不用把路径写两遍。
  - title: 插件建立在同一套扩展点上
    details: core 只暴露一个 addRouteMiddleware()。校验、文档、CQRS 都挂在它上面，core 不需要认识它们。
  - title: 启动前把图校验干净
    details: 重复 provider、exports 悬空、模块成环、路由撞车——全部在 createApp() 抛错，不会留到运行期。
  - title: 不发布到 npm
    details: 所有包都是 private，通过 workspace:* 直接引源码。没有 build 步骤，没有 dist 需要同步。
---
