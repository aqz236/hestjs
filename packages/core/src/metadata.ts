import { CONTROLLER_META, INJECTABLE_META, MODULE_META, ROUTES_META } from './symbols';
import type { Constructor, Provider, ProviderEntry, RouteMethod, Scope, Token } from './types';

export interface RouteDefinition {
  readonly method: RouteMethod;
  readonly path: string;
  readonly propertyKey: string | symbol;
}

export interface ControllerMetadata {
  readonly path: string;
}

export interface InjectableMetadata {
  readonly scope: Scope;
}

export interface ModuleMetadata {
  /** 本模块依赖的其他模块。它们 export 的东西才对本模块可见。 */
  readonly imports?: readonly Constructor[];
  readonly providers?: readonly ProviderEntry[];
  readonly controllers?: readonly Constructor[];
  /** 本模块愿意借给别的模块的东西。只能导出自己提供的、或已从 imports 拿到的。 */
  readonly exports?: readonly Token[];
}

interface Carriers {
  [MODULE_META]?: ModuleMetadata;
  [CONTROLLER_META]?: ControllerMetadata;
  [INJECTABLE_META]?: InjectableMetadata;
  [ROUTES_META]?: RouteDefinition[];
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

export function defineController(target: Constructor, path: string): void {
  carrier(target)[CONTROLLER_META] = { path };
}

export function readController(target: Constructor): ControllerMetadata | undefined {
  return carrier(target)[CONTROLLER_META];
}

export function defineInjectable(target: Constructor, metadata: InjectableMetadata): void {
  carrier(target)[INJECTABLE_META] = metadata;
}

export function readInjectableScope(target: Constructor): Scope | undefined {
  return carrier(target)[INJECTABLE_META]?.scope;
}

/**
 * 往原型上挂一条路由。
 *
 * 必须是原型自己的数组：如果直接顺着原型链 push，子类会把路由写进父类。
 */
export function addRoute(prototype: object, route: RouteDefinition): void {
  if (!Object.hasOwn(prototype, ROUTES_META)) {
    Object.defineProperty(prototype, ROUTES_META, {
      value: [],
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  carrier(prototype)[ROUTES_META]!.push(route);
}

export function readRoutes(prototype: object): readonly RouteDefinition[] {
  return carrier(prototype)[ROUTES_META] ?? [];
}

/** 模块里可以直接写类名，这里统一成 Provider 对象。 */
export function normalizeProvider(entry: ProviderEntry): Provider {
  if (typeof entry === 'function') {
    return { provide: entry, useClass: entry, scope: readInjectableScope(entry) ?? 'singleton' };
  }
  return entry;
}
