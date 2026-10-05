import type { ModuleRef, Token } from './types';

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

/** 类 → 类名；动态模块对象 → 它对应的类名。 */
function moduleName(ref: ModuleRef): string {
  if (typeof ref === 'function') {
    return ref.name === '' ? '<匿名模块>' : ref.name;
  }
  return typeof ref.module === 'function' ? ref.module.name : '<未知模块>';
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

export class AmbiguousImportError extends HestError {
  constructor(module: unknown, token: Token) {
    super(
      `${nameOf(module)} 从多个 import 里都拿到了 ${describeToken(token)}。\n` +
        `两个模块导出同一个 token 时容器不知道该用哪个 —— ` +
        `让它们用不同的 token（例如给动态模块传 provide），或者只 import 其中一个。`,
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
  constructor(chain: readonly ModuleRef[]) {
    super(`模块 import 成环：${chain.map(moduleName).join(' → ')}。拆掉其中一条边。`);
  }
}

export class InvalidModuleError extends HestError {
  constructor(ref: unknown) {
    const factories =
      typeof ref === 'function'
        ? Object.getOwnPropertyNames(ref).filter(
            (key) => typeof (ref as unknown as Record<string, unknown>)[key] === 'function'
              && /^(for|register|with)/i.test(key),
          )
        : [];

    super(
      `${nameOf(ref)} 不是一个模块。\n` +
        `imports 里只能放两种东西：被 @Module() 标记的类，` +
        `或者 forRoot() 之类返回的 DynamicModule。` +
        (factories.length === 0
          ? ''
          : `\n\n${nameOf(ref)} 上有这些工厂方法，是不是忘了调用？\n  ` +
            factories.map((key) => `${nameOf(ref)}.${key}(...)`).join('\n  ')),
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

export class MissingInjectError extends HestError {
  constructor(target: unknown, index: number, hint: string) {
    super(
      `${nameOf(target)} 的第 ${index} 个构造参数没有 @Inject()。\n` +
        `依赖是显式声明的，容器不会去猜类型 —— ${hint}`,
    );
  }
}

