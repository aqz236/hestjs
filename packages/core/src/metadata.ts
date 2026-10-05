import type { App, Constructor, Provider, ProviderEntry, RouteMethod, Scope, Token } from './types';

export interface RouteDefinition {
  readonly method: RouteMethod;
  readonly path: string;
  readonly propertyKey: string | symbol;
}

export interface ModuleMetadata {
  /** 本模块依赖的其他模块。用于遍历注册，并把它们的 provider 一并纳入容器。 */
  readonly imports?: readonly Constructor[];
  readonly providers?: readonly ProviderEntry[];
  readonly controllers?: readonly Constructor[];
  readonly exports?: readonly Token[];
  readonly onStart?: (app: App) => void | Promise<void>;
  readonly onStop?: (app: App) => void | Promise<void>;
}

export interface InjectableMetadata {
  readonly scope: Scope;
}

/**
 * 所有装饰器只做一件事：把元数据写进下面这些表。
 * 真正的组装发生在 `createApp()`，你随时可以把表读出来自己看。
 */
const moduleRegistry = new WeakMap<Constructor, ModuleMetadata>();
const controllerRegistry = new WeakMap<Constructor, { path: string }>();
const routesByPrototype = new WeakMap<object, RouteDefinition[]>();
const injectableRegistry = new WeakMap<Constructor, InjectableMetadata>();

export function defineModule(target: Constructor, metadata: ModuleMetadata): void {
  moduleRegistry.set(target, metadata);
}

export function readModule(target: Constructor): ModuleMetadata | undefined {
  return moduleRegistry.get(target);
}

export function defineController(target: Constructor, path: string): void {
  controllerRegistry.set(target, { path });
}

export function readController(target: Constructor): { path: string } | undefined {
  return controllerRegistry.get(target);
}

export function defineInjectable(target: Constructor, metadata: InjectableMetadata): void {
  injectableRegistry.set(target, metadata);
}

export function readInjectable(target: Constructor): InjectableMetadata | undefined {
  return injectableRegistry.get(target);
}

export function addRoute(prototype: object, route: RouteDefinition): void {
  const routes = routesByPrototype.get(prototype);
  if (routes === undefined) {
    routesByPrototype.set(prototype, [route]);
    return;
  }
  routes.push(route);
}

export function readRoutes(prototype: object): readonly RouteDefinition[] {
  return routesByPrototype.get(prototype) ?? [];
}

/** 模块里可以直接写类名，这里统一成 Provider 对象。 */
export function normalizeProvider(entry: ProviderEntry): Provider {
  if (typeof entry === 'function') {
    const scope = injectableRegistry.get(entry)?.scope ?? 'singleton';
    return { provide: entry, useClass: entry, scope };
  }
  return entry;
}
