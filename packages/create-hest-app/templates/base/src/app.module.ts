import { Controller, Get, Injectable, Module } from '@hestjs/core';
import type { RouteContext } from '@hestjs/core';

// provider 和 controller 就是普通类。
// 依赖用 static inject 明写，不靠反射 —— 换任何打包器都不会失效。

@Injectable()
class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('/greet')
class GreetingController {
  static readonly inject = [GreetingService] as const;

  constructor(private readonly greeting: GreetingService) {}

  @Get('/:name')
  say(c: RouteContext<'/greet/:name'>): Response {
    return c.json({ message: this.greeting.greet(c.req.param('name')) });
  }
}

@Module({
  providers: [GreetingService],
  controllers: [GreetingController],
})
export class AppModule {}
