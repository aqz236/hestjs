import "reflect-metadata";
import {
  DependencyContainer,
  InjectionToken,
  container as tsyringeContainer,
} from "tsyringe";
import type { InjectableMetadata } from "../interfaces/metadata";
import { METADATA_KEYS, Scope } from "../utils/constants";

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
  }
}

/**
 * HestJS DI 容器封装
 */
export class Container {
  private static instance: Container;
  private container: DependencyContainer;

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
  register<T>(token: InjectionToken<T>, provider: any): void {
    const metadata: InjectableMetadata =
      Reflect.getMetadata(METADATA_KEYS.INJECTABLE, provider) || {};

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
}
