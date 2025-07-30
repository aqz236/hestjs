import { Hono } from "hono";
import { Container } from "../container/container";
import { MetadataScanner } from "../metadata/metadata-scanner";
import { RouterExplorer } from "../router/router-explorer";
import { HestApplicationInstance } from "./hest-application";
import { ApplicationHooks } from "./application-hooks";
import { logger } from "@hestjs/logger";

/**
 * HestJS 应用工厂
 */
export class HestFactory {
  /**
   * 创建应用实例
   */
  static async create(honoApp: Hono, moduleClass: any): Promise<HestApplicationInstance> {
    // 使用用户传入的 Hono 实例
    const app = honoApp;

    // 创建 DI 容器
    const container = Container.getInstance();

    // 初始化模块
    await HestFactory.initializeModule(moduleClass, container);

    // 创建应用实例
    const appInstance = new HestApplicationInstance(app, container);

    // 设置路由
    const routerExplorer = new RouterExplorer(app, container);

    // 收集所有模块的控制器
    const allControllers = HestFactory.collectAllControllers(moduleClass);
    if (allControllers.length > 0) {
      routerExplorer.explore(allControllers);
    }

    // 执行所有注册的应用启动钩子
    await ApplicationHooks.getInstance().executeHooks(container);

    return appInstance;
  }

  /**
   * 初始化模块
   */
  private static async initializeModule(
    moduleClass: any,
    container: Container
  ): Promise<void> {
    const moduleMetadata = MetadataScanner.scanModule(moduleClass);
    if (!moduleMetadata) {
      throw new Error(`Module metadata not found for ${moduleClass.name}`);
    }

    // 注册模块自身
    container.register(moduleClass, moduleClass, 'module');

    // 注册提供者
    if (moduleMetadata.providers) {
      for (const provider of moduleMetadata.providers) {
        if (MetadataScanner.isInjectable(provider)) {
          // 注册类本身作为令牌
          container.register(provider, provider, 'provider');
          // 同时注册类名字符串作为令牌，以支持 @Inject('ClassName') 语法
          container.register(provider.name, provider, 'provider');
        } else {
          console.warn(
            `Provider ${provider.name} is not injectable, skipping registration`
          );
        }
      }
    }

    // 注册控制器
    if (moduleMetadata.controllers) {
      for (const controller of moduleMetadata.controllers) {
        if (MetadataScanner.isController(controller)) {
          container.register(controller, controller, 'controller');
        } else {
          throw new Error(`${controller.name} is not a valid controller`);
        }
      }
    }

    // 处理导入的模块
    if (moduleMetadata.imports) {
      for (const importedModule of moduleMetadata.imports) {
        await HestFactory.initializeModule(importedModule, container);
      }
    }

    logger.info(`✅ Module ${moduleClass.name} initialized`);
  }

  /**
   * 递归收集所有模块的控制器
   */
  private static collectAllControllers(moduleClass: any, visited = new Set<any>()): any[] {
    // 防止循环依赖
    if (visited.has(moduleClass)) {
      return [];
    }
    visited.add(moduleClass);

    const controllers: any[] = [];
    const moduleMetadata = MetadataScanner.scanModule(moduleClass);
    
    if (!moduleMetadata) {
      return controllers;
    }

    // 收集当前模块的控制器
    if (moduleMetadata.controllers) {
      controllers.push(...moduleMetadata.controllers);
    }

    // 递归收集导入模块的控制器
    if (moduleMetadata.imports) {
      for (const importedModule of moduleMetadata.imports) {
        controllers.push(...HestFactory.collectAllControllers(importedModule, visited));
      }
    }

    return controllers;
  }
}
