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

function nameOf(target: unknown): string {
  if (typeof target === 'function' && target.name !== '') {
    return target.name;
  }
  return String(target);
}

export class ProviderNotFoundError extends HestError {
  constructor(token: Token) {
    super(
      `${describeToken(token)} 在这层容器里不可见。\n` +
        `两种可能：它没写进任何模块的 providers；或者它在别的模块里但那个模块没有 export，` +
        `或者你没有 import 那个模块。`,
    );
  }
}

export class CircularDependencyError extends HestError {
  constructor(token: Token) {
    super(`${describeToken(token)} 的解析出现环。把共享部分下沉到第三个 provider 来打断。`);
  }
}

export class DuplicateProviderError extends HestError {
  constructor(module: unknown, token: Token) {
    super(
      `${nameOf(module)} 里 ${describeToken(token)} 被提供了两次。\n` +
        `provider 的顺序不该决定谁生效，请只留一处。`,
    );
  }
}

export class AmbiguousProviderError extends HestError {
  constructor(module: unknown, token: Token) {
    super(
      `${nameOf(module)} 既从 imports 里拿到 ${describeToken(token)}，又自己提供了它。\n` +
        `请二选一：要么改掉 import，要么改掉本地 provider 的名字。`,
    );
  }
}

export class UnresolvedExportError extends HestError {
  constructor(module: unknown, token: Token) {
    super(
      `${nameOf(module)} export 了 ${describeToken(token)}，但它既没有提供、也没有从 imports 里拿到它。\n` +
        `export 只能用于本模块或已导入模块可见的东西。`,
    );
  }
}

export class ModuleCycleError extends HestError {
  constructor(chain: readonly unknown[]) {
    super(`模块 import 成环：${chain.map(nameOf).join(' → ')}。拆掉其中一条边。`);
  }
}

export class InvalidModuleError extends HestError {
  constructor(target: unknown) {
    super(`${nameOf(target)} 没有 @Module() 装饰器。imports 里只能放被 @Module() 标记的类。`);
  }
}

export class MissingRouteHandlerError extends HestError {
  constructor(controller: string, propertyKey: string | symbol) {
    super(`${controller}.${String(propertyKey)} 被路由装饰器标记，但实例上没有这个方法。`);
  }
}

export class DuplicateRouteError extends HestError {
  constructor(method: string, path: string) {
    super(`${method} ${path} 被注册了两次。检查两个控制器是否有同样的前缀与相对路径。`);
  }
}

export class NoRoutesRegisteredError extends HestError {
  constructor(controllers: readonly string[]) {
    super(
      `检测到 ${controllers.length} 个控制器（${controllers.join(', ')}），但一条路由都没注册。\n` +
        `最常见的原因：tsconfig 缺 "experimentalDecorators": true，导致 @Get/@Post 被当成\n` +
        `stage-3 标准装饰器处理，签名不同、元数据写到别处去了。\n` +
        `注意 Bun 的转译器不解析包名形式的 extends，请用相对路径指向 tsconfig 预设。`,
    );
  }
}

export class UnknownOverrideError extends HestError {
  constructor(token: Token) {
    super(
      `测试替身 ${describeToken(token)} 没有对应的真实 provider。\n` +
        `overrides 只能替换「本来就注册过」的 token，不能凭空新增 —— \n` +
        `否则测试会通过，线上却少一个依赖。`,
    );
  }
}
