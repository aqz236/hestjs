import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
import type { Container } from "@hestjs/core";

/**
 * 总线基类
 *
 * 提供两件事：
 *
 * 1. **事件流** —— `observable$` / `ofType`，用于订阅流经总线的命令与事件
 * 2. **容器引用** —— 供子类解析 handler / saga 实例
 *
 * 关于容器：这些总线是被 HestJS 的模块容器实例化的，handler 也注册在**同一批
 * 模块容器**里。因此解析 handler 必须使用 HestJS 的 `Container`，
 * 而不是 tsyringe 的全局容器 —— 后者看不到模块作用域，
 * 会让 `imports` / `exports` 的约束失效（见 issue #19）。
 *
 * 未注入容器时退回 tsyringe 全局容器，仅为兼容不经应用引导的用法
 * （例如单元测试里直接 `new CommandBus()`）。
 */
export abstract class ObservableBus<T> {
  protected subject$ = new Subject<T>();

  /** HestJS 容器；由应用引导阶段注入 */
  private _container?: Container;

  /** 注入 HestJS 容器 */
  setContainer(container: Container): void {
    this._container = container;
  }

  /** 当前使用的容器（若已注入） */
  get container(): Container | undefined {
    return this._container;
  }

  /**
   * 解析类型实例
   *
   * 走 HestJS 容器，且用 resolveScoped：handler 注册在各自的**模块子容器**里，
   * 从根容器 resolve 是查不到的。由拥有者容器解析还能保证该 handler 的
   * 构造函数依赖同样受其模块作用域约束。
   *
   * 未注入容器时退回 tsyringe 全局容器，仅为兼容不经应用引导的用法。
   */
  protected resolveType<R>(token: any): R {
    if (this._container) {
      return this._container.resolveScoped<R>(token);
    }

    // 延迟 require，避免在已注入容器时也加载 tsyringe 的全局实例
    const { container: globalContainer } = require("tsyringe");
    return globalContainer.resolve(token) as R;
  }

  get observable$(): Observable<T> {
    return this.subject$.asObservable();
  }

  /**
   * Returns a filtered stream that only emits events of the specified type.
   */
  ofType<R extends T>(...types: (new (...args: any[]) => R)[]): Observable<R> {
    return this.subject$
      .asObservable()
      .pipe(
        filter((event) => types.some((type) => event instanceof type))
      ) as Observable<R>;
  }

  protected publishToSubject(event: T): void {
    this.subject$.next(event);
  }
}
