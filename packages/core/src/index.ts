/**
 * HestJS 的公开 API。
 *
 * 只导出你会 `import` 的东西。内部管线（symbol 表、元数据读写、
 * 模块图编译器）在 `@hestjs/core/internal`，不保证稳定。
 */

// 应用组装
export { createApp } from './app';
export { dynamicModule } from './dynamic-module';
export { token } from './token';
export type {
  App,
  CreateAppOptions,
  DynamicModule,
  Input,
  ModuleMetadata,
  ModuleNode,
  ModuleRef,
  ResolvedGraph,
  Resolve,
} from './types';

// 容器与 provider
export { Container } from './container';
export type {
  ClassProvider,
  Constructor,
  FactoryProvider,
  Provider,
  ProviderEntry,
  Scope,
  Token,
  ValueProvider,
} from './types';

// 装饰器
export { Inject, Injectable, Module, type InjectableOptions } from './decorators';

// 生命周期
export { hasOnStart, hasOnStop } from './lifecycle';
export type { OnStart, OnStop } from './lifecycle';

// 路由元数据契约：core 定义形状，插件写、插件读
export { attachRouteMeta, findRouteMeta, readRouteMeta } from './route-meta';
export type {
  DocumentationRouteMeta,
  RouteMetaEntry,
  ValidationRouteMeta,
} from './route-meta';

// 错误：全部是公开 API，用户要 catch 它们
export {
  AmbiguousImportError,
  AmbiguousProviderError,
  CircularDependencyError,
  DuplicateProviderError,
  HestError,
  InvalidModuleError,
  MissingInjectError,
  ModuleCycleError,
  ProviderNotFoundError,
  UnknownOverrideError,
  UnresolvedExportError,
} from './errors';
