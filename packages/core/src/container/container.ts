import "reflect-metadata";
import {
  DependencyContainer,
  InjectionToken,
  container as tsyringeContainer,
} from "tsyringe";
import type { InjectableMetadata, ControllerMetadata, ModuleMetadata } from "../interfaces/metadata";
import type { ControllerConstructor } from "../interfaces/router";
import { METADATA_KEYS, Scope } from "../utils/constants";

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
  }
}

/**
 * 逻辑容器项类型
 */
export interface LogicalContainerItem<T = any> {
  token: InjectionToken<T>;
  provider: T;
  type: 'controller' | 'provider' | 'module';
  metadata?: ControllerMetadata | InjectableMetadata | ModuleMetadata;
  scope?: Scope;
}

/**
 * 控制器容器项特化类型
 */
export interface ControllerContainerItem extends LogicalContainerItem<ControllerConstructor> {
  type: 'controller';
  metadata?: ControllerMetadata;
}

/**
 * 把 token 格式化成可读名称，用于错误信息
 */
function formatToken(token: unknown): string {
  if (typeof token === 'function') {
    return (token as { name?: string }).name || 'anonymous class';
  }
  if (typeof token === 'symbol') {
    return token.toString();
  }
  return String(token);
}

/**
 * HestJS DI 容器封装
 */
export class Container {
  private static instance: Container;
  private container: DependencyContainer;
  private logicalContainer: Map<InjectionToken<any>, LogicalContainerItem> = new Map();
  /** 由本容器派生的模块子容器 */
  private readonly children: Container[] = [];
  /** 父容器（根容器为 undefined） */
  private parent?: Container;

  constructor() {
    this.container = tsyringeContainer.createChildContainer();
  }

  /**
   * 获取容器单例
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 注册服务
   */
  register<T>(token: InjectionToken<T>, provider: any, type: 'controller' | 'provider' | 'module' = 'provider'): void {
    const metadata: InjectableMetadata =
      Reflect.getMetadata(METADATA_KEYS.INJECTABLE, provider) || {};

    // 保存到逻辑容器
    const logicalItem: LogicalContainerItem = {
      token,
      provider,
      type,
      metadata: this.extractMetadata(provider, type),
      scope: metadata.scope as Scope
    };
    this.logicalContainer.set(token, logicalItem);

    switch (metadata.scope) {
      case Scope.SINGLETON:
        this.container.registerSingleton(token, provider);
        break;
      case Scope.TRANSIENT:
        this.container.register(token, { useClass: provider });
        break;
      default:
        this.container.registerSingleton(token, provider);
    }
  }

  /**
   * 注册实例
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.container.registerInstance(token, instance);
  }

  /**
   * 解析服务
   *
   * 只接受**已注册**的 token。tsyringe 的原始行为是：未注册的类会被直接构造，
   * 因此 `Container` 实际上没有白名单语义——这与模块系统想要的可见性控制相冲突。
   * 这里显式拒绝，让「解析到了本不该可见的东西」变成可发现的错误。
   */
  resolve<T>(token: InjectionToken<T>): T {
    if (!this.isRegistered(token)) {
      throw new Error(
        `Cannot resolve unregistered token "${formatToken(token)}". ` +
          `请确认它已通过 @Module({ providers: [...] }) 注册，` +
          `或已被某个被 imports 的模块导出。`
      );
    }
    return this.container.resolve(token);
  }

  /**
   * 尝试解析服务，不存在时返回 undefined（不抛错）
   */
  tryResolve<T>(token: InjectionToken<T>): T | undefined {
    return this.isRegistered(token) ? this.container.resolve(token) : undefined;
  }

  /**
   * 找到注册了指定 token 的容器（含自身与所有后代）
   *
   * 模块系统下 provider 注册在各自的模块子容器里，而父容器的 isRegistered
   * 看不到子容器的注册。需要「由拥有者解析」时使用本方法。
   */
  findContainerFor<T>(token: InjectionToken<T>): Container | undefined {
    if (this.isRegistered(token)) {
      return this;
    }

    for (const child of this.children) {
      const found = child.findContainerFor(token);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  /**
   * 由拥有该 token 的容器解析
   *
   * 与 resolve 的区别：resolve 严格要求 token 注册在**当前**容器（或其祖先）；
   * 本方法会向下查找拥有者，适用于从应用根容器解析模块内 provider 的场景
   * （例如 cqrs 从模块容器解析 handler）。
   *
   * 注意：解析由拥有者容器执行，因此该 provider 的依赖仍受其模块作用域约束。
   */
  resolveScoped<T>(token: InjectionToken<T>): T {
    const owner = this.findContainerFor(token);

    if (!owner) {
      throw new Error(
        `Cannot resolve unregistered token "${formatToken(token)}". ` +
          `请确认它已通过 @Module({ providers: [...] }) 注册，` +
          `或已被某个被 imports 的模块导出。`
      );
    }

    return owner.resolve(token);
  }

  /**
   * 检查是否已注册
   */
  isRegistered<T>(token: InjectionToken<T>): boolean {
    return this.container.isRegistered(token);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.container.clearInstances();
  }

  /**
   * 创建子容器
   *
   * 模块系统用它为每个模块建立独立的解析作用域：子容器只能看到自己与
   * 祖先容器中注册的内容，因而天然形成可见性边界。
   */
  createChild(): Container {
    const child = new Container();
    child.container = this.container.createChildContainer();
    child.parent = this;
    this.children.push(child);
    return child;
  }

  /**
   * 直接子容器
   */
  getChildren(): readonly Container[] {
    return this.children;
  }

  /**
   * 获取底层容器实例
   */
  getContainer(): DependencyContainer {
    return this.container;
  }

  /**
   * 获取逻辑容器中的所有项
   */
  getLogicalContainer(): Map<InjectionToken<any>, LogicalContainerItem> {
    return this.logicalContainer;
  }

  /**
   * 获取指定类型的所有项（含子容器）
   *
   * 模块各自把 provider 注册在自己的子容器里，因此应用级查询需要向下聚合。
   * 同 token 以更靠近根的注册为准，避免子容器里的重导出重复计数。
   */
  getItemsByType(type: 'controller' | 'provider' | 'module'): LogicalContainerItem[] {
    const seen = new Map<InjectionToken<any>, LogicalContainerItem>();

    const collect = (container: Container): void => {
      for (const item of container.getLogicalContainer().values()) {
        if (item.type === type && !seen.has(item.token)) {
          seen.set(item.token, item);
        }
      }
      for (const child of container.children) {
        collect(child);
      }
    };

    collect(this);
    return Array.from(seen.values());
  }

  /**
   * 获取所有控制器
   */
  getAllControllers(): ControllerContainerItem[] {
    return this.getItemsByType('controller') as ControllerContainerItem[];
  }

  /**
   * 提取元数据信息
   */
  private extractMetadata(provider: any, type: 'controller' | 'provider' | 'module'): any {
    switch (type) {
      case 'controller':
        return Reflect.getMetadata(METADATA_KEYS.CONTROLLER, provider);
      case 'module':
        return Reflect.getMetadata(METADATA_KEYS.MODULE, provider);
      case 'provider':
        return Reflect.getMetadata(METADATA_KEYS.INJECTABLE, provider);
      default:
        return null;
    }
  }
}
