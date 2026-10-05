import { INJECT_META, INJECTABLE_META, MODULE_META } from './symbols';
import type {
  Constructor,
  InjectableMetadata,
  ModuleMetadata,
  Provider,
  ProviderEntry,
  Scope,
  Token,
} from './types';

interface Carriers {
  [MODULE_META]?: ModuleMetadata;
  [INJECTABLE_META]?: InjectableMetadata;
  [INJECT_META]?: Map<number, Token>;
}

function carrier(target: object): Carriers {
  return target as Carriers;
}

export function defineModule(target: Constructor, metadata: ModuleMetadata): void {
  carrier(target)[MODULE_META] = metadata;
}

export function readModule(target: Constructor): ModuleMetadata | undefined {
  return carrier(target)[MODULE_META];
}

export function defineInjectable(target: Constructor, metadata: InjectableMetadata): void {
  carrier(target)[INJECTABLE_META] = metadata;
}

export function readInjectableScope(target: Constructor): Scope | undefined {
  return carrier(target)[INJECTABLE_META]?.scope;
}

/** 记录第 index 个构造参数的 token。 */
export function defineInjectParam(target: Constructor, index: number, token: Token): void {
  const carrierTarget = carrier(target);
  const map = (carrierTarget[INJECT_META] ??= new Map<number, Token>());
  map.set(index, token);
}

export function readInjectParams(target: Constructor): ReadonlyMap<number, Token> {
  return carrier(target)[INJECT_META] ?? new Map<number, Token>();
}

/** 模块里可以直接写类名，这里统一成 Provider 对象。 */
export function normalizeProvider(entry: ProviderEntry): Provider {
  if (typeof entry === 'function') {
    return { provide: entry, useClass: entry };
  }
  return entry;
}
