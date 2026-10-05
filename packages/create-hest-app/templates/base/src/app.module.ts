import type { Context, Env } from 'hono';
import { Inject, Module } from '@hestjs/core';

// provider 和 controller 都是普通类。
// 依赖用 @Inject 明写 —— 容器不猜类型，少标一个会在启动时直接报错。

class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

/**
 * 控制器不声明路径：路径属于路由，路由是 Hono 的事。
 * 方法第一个参数永远是 Hono 的 Context。
 */
class GreetingController {
  constructor(@Inject(GreetingService) private readonly greeting: GreetingService) {}

  // 刻意不标注返回类型：标了 `: Response` 会把 c.json() 的类型信息擦掉，
  // 前端 hc<AppType> 就只能拿到 unknown。让 TS 自己推导。
  say(c: Context<Env, '/greet/:name'>) {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({
  providers: [GreetingService, GreetingController],
})
export class AppModule {}

export { GreetingController };
