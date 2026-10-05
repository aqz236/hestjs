import type { Context, Env } from 'hono';
import { logger } from 'hono/logger';
import { validator } from 'hono/validator';
import { Controller, Get, Injectable, Module, Post, createApp } from '@hestjs/core';

// ─────────────────────────────────────────────────────────────
// 1. 普通类就是普通类。依赖用 static inject 明写，不靠反射。
// ─────────────────────────────────────────────────────────────

export interface User {
  readonly id: string;
  readonly name: string;
}

@Injectable()
class UserRepository {
  readonly #users = new Map<string, User>([['1', { id: '1', name: 'Ada' }]]);

  list(): User[] {
    return [...this.#users.values()];
  }

  find(id: string): User | undefined {
    return this.#users.get(id);
  }

  add(name: string): User {
    const id = String(this.#users.size + 1);
    const user: User = { id, name };
    this.#users.set(id, user);
    return user;
  }
}

@Injectable()
class UserService {
  static readonly inject = [UserRepository] as const;

  constructor(private readonly repository: UserRepository) {}

  list(): User[] {
    return this.repository.list();
  }

  get(id: string): User | undefined {
    return this.repository.find(id);
  }

  create(name: string): User {
    return this.repository.add(name);
  }
}

/** 接口类依赖用 token：容器不认识类型，只认识键。 */
export const CLOCK = Symbol('clock');

// ─────────────────────────────────────────────────────────────
// 2. 控制器。方法第一个参数永远是 Hono 的 Context。
// ─────────────────────────────────────────────────────────────

@Controller('/users')
class UserController {
  static readonly inject = [UserService, CLOCK] as const;

  constructor(
    private readonly users: UserService,
    private readonly now: () => string,
  ) {}

  @Get('/')
  list(c: Context): Response {
    return c.json({ data: this.users.list(), at: this.now() });
  }

  @Get('/:id')
  detail(c: Context<Env, '/users/:id'>): Response {
    const user = this.users.get(c.req.param('id'));
    return user === undefined ? c.json({ message: 'not found' }, 404) : c.json({ data: user });
  }

  @Post('/')
  create(c: Context): Response {
    const { name } = c.req.valid('json' as never) as { name: string };
    return c.json({ data: this.users.create(name) }, 201);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 模块：只声明，不执行
// ─────────────────────────────────────────────────────────────

@Module({
  providers: [UserRepository, UserService, { provide: CLOCK, useFactory: () => () => new Date().toISOString() }],
  controllers: [UserController],
  onStart: (app) => {
    console.log(`[hestjs] 已启动，Hono 实例上注册了 ${app.hono.routes.length} 条路由`);
  },
})
class AppModule {}

// ─────────────────────────────────────────────────────────────
// 4. 组装：configure 在控制器之前跑，中间件才能包住它们
// ─────────────────────────────────────────────────────────────

const app = createApp(AppModule, {
  configure(hono) {
    hono.use(logger());
    hono.use('*', async (c, next) => {
      c.header('x-powered-by', 'hestjs');
      await next();
    });

    // 中间件写在 configure 里就能包住控制器 —— 它比控制器先挂载。
    // 这里直接用 Hono 自带的 validator，HestJS 不掺和校验这件事。
    hono.post('/users', validator('json', (value, c) => {
      if (typeof (value as { name?: unknown }).name !== 'string') {
        return c.json({ message: 'name 必须是字符串' }, 400);
      }
      return value;
    }));

    // 原生 Hono 路由和控制器共存，没有边界
    hono.get('/health', (c) => c.text('ok'));
  },
});

// app.hono 就是 Hono 实例，想干什么都行
app.hono.notFound((c) => c.json({ message: 'not found', path: c.req.path }, 404));

await app.start();

export { app };

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.hono.fetch,
};
