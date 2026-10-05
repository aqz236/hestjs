import type { Token } from './types';

export class HestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export function describeToken(token: Token): string {
  if (typeof token === 'function') {
    return token.name === '' ? '<匿名类>' : token.name;
  }
  return typeof token === 'symbol' ? token.toString() : `'${token}'`;
}

export class ProviderNotFoundError extends HestError {
  constructor(token: Token) {
    super(
      `${describeToken(token)} 没有注册。把它加进所属模块的 providers，` +
        `或者确认它被一个已 imports 的模块导出。`,
    );
  }
}

export class CircularDependencyError extends HestError {
  constructor(token: Token) {
    super(`${describeToken(token)} 的解析出现循环依赖。把共享部分下沉到第三个 provider 来打断环。`);
  }
}

export class InvalidModuleError extends HestError {
  constructor(target: unknown) {
    const name = typeof target === 'function' && target.name !== '' ? target.name : String(target);
    super(`${name} 没有 @Module() 装饰器。imports 里只能放被 @Module() 标记的类。`);
  }
}

export class MissingRouteHandlerError extends HestError {
  constructor(controller: string, propertyKey: string | symbol) {
    super(`${controller}.${String(propertyKey)} 被 @Get/@Post 等标记，但实例上没有这个方法。`);
  }
}

export class DuplicateRouteError extends HestError {
  constructor(method: string, path: string) {
    super(`${method} ${path} 被注册了两次。检查两个控制器是否有同样的前缀与路径。`);
  }
}

export class NoRoutesRegisteredError extends HestError {
  constructor(controllers: readonly string[]) {
    super(
      `检测到 ${controllers.length} 个控制器（${controllers.join(', ')}），但一条路由都没注册。\n` +
        `最常见的原因：tsconfig 里缺 "experimentalDecorators": true，导致 @Get/@Post 被当成\n` +
        `stage-3 标准装饰器处理，签名不同、元数据写到了别处。\n` +
        `注意 Bun 的转译器不解析包名形式的 extends，请用相对路径指向 tsconfig 预设。`,
    );
  }
}
