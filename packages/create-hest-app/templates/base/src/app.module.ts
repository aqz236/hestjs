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

  say(c: Context<Env, '/greet/:name'>): Response {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({
  providers: [GreetingService, GreetingController],
})
export class AppModule {}

export { GreetingController };
