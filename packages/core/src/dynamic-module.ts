import type { Constructor, DynamicModule, ModuleMetadata } from './types';

/**
 * 构造一个动态模块。
 *
 * ```ts
 * class DatabaseModule {
 *   static forRoot(options: { url: string }): DynamicModule {
 *     return dynamicModule(DatabaseModule, {
 *       providers: [
 *         { provide: DB_URL, useValue: options.url },
 *         DatabasePool,
 *       ],
 *       exports: [DatabasePool],
 *     });
 *   }
 * }
 *
 * @Module({ imports: [DatabaseModule.forRoot({ url: 'postgres://...' })] })
 * class AppModule {}
 * ```
 *
 * 每次调用返回一个新对象，所以同一个类的多个配置可以并存，
 * 各自有独立的容器与单例。
 *
 * 工厂类**不需要** `@Module()` 装饰器 —— 装饰器是给静态模块用的。
 * 如果只写了类名而没调 `forRoot()`，`InvalidModuleError` 会提醒你。
 */
export function dynamicModule(
  module: Constructor,
  metadata: ModuleMetadata = {},
): DynamicModule {
  return { module, ...metadata };
}
