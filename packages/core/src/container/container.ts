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
 * HestJS DI 容器封装
 */
export class Container {
  private static instance: Container;
  private container: DependencyContainer;
  private logicalContainer: Map<InjectionToken<any>, LogicalContainerItem> = new Map();

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
   */
  resolve<T>(token: InjectionToken<T>): T {
    return this.container.resolve(token);
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
   */
  createChild(): Container {
    const child = new Container();
    child.container = this.container.createChildContainer();
    return child;
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
   * 获取指定类型的所有项
   */
  getItemsByType(type: 'controller' | 'provider' | 'module'): LogicalContainerItem[] {
    return Array.from(this.logicalContainer.values()).filter(item => item.type === type);
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
