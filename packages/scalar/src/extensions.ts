import { type HestApplicationInstance, type Container, type LogicalContainerItem, createLogger } from "@hestjs/core";
import type { ControllerConstructor } from "@hestjs/core";
import type { ScalarConfig } from "./scalar-config.interface";
import { setupScalar, setupScalarWithControllers } from "./scalar.middleware";
import type { OpenAPIGeneratorConfig } from './openapi-generator';

const logger = createLogger("Scalar");

/**
 * 扩展 HestApplicationInstance 以支持 Scalar
 */
declare module "@hestjs/core" {
  interface HestApplicationInstance {
    /**
     * 配置 Scalar API 文档
     */
    useScalar(config: ScalarConfig): void;
    
    /**
     * 从控制器自动生成 OpenAPI 并配置 Scalar(手动传入控制器)
     */
    useScalarWithControllers(
      controllers: ControllerConstructor[],
      generatorConfig: OpenAPIGeneratorConfig,
      scalarConfig?: Omit<ScalarConfig, 'spec'>
    ): void;

    /**
     * 自动发现控制器并生成 OpenAPI 文档
     */
    useScalarAutoDiscover(
      generatorConfig: OpenAPIGeneratorConfig,
      scalarConfig?: Omit<ScalarConfig, 'spec'>
    ): void;

    /**
     * 自动发现控制器的辅助方法
     */
    autoDiscoverControllers(): ControllerConstructor[];
  }
}

/**
 * 为 HestApplicationInstance 添加 Scalar 方法
 */
export function extendWithScalar() {
  const HestApplicationInstancePrototype =
    require("@hestjs/core").HestApplicationInstance.prototype;

  HestApplicationInstancePrototype.useScalar = function (config: ScalarConfig) {
    setupScalar(this.hono(), config);
  };
  
  HestApplicationInstancePrototype.useScalarWithControllers = function (
    controllers: ControllerConstructor[],
    generatorConfig: OpenAPIGeneratorConfig,
    scalarConfig: Omit<ScalarConfig, 'spec'> = {}
  ) {
    // 如果没有传入控制器，尝试从容器中获取
    if (controllers.length === 0) {
      const autoDiscoveredControllers = this.autoDiscoverControllers();
      if (autoDiscoveredControllers.length > 0) {
        controllers = autoDiscoveredControllers;
      } else {
        console.warn('No controllers found. Please pass controllers explicitly or ensure controllers are properly registered.');
        return;
      }
    }
    
    setupScalarWithControllers(this.hono(), controllers, generatorConfig, scalarConfig);
  };

  HestApplicationInstancePrototype.useScalarAutoDiscover = function (
    generatorConfig: OpenAPIGeneratorConfig,
    scalarConfig: Omit<ScalarConfig, 'spec'> = {}
  ) {
    const controllers = this.autoDiscoverControllers();
    if (controllers.length === 0) {
      console.warn('No controllers found for auto-discovery. Please ensure controllers are properly registered.');
      return;
    }
    
    setupScalarWithControllers(this.hono(), controllers, generatorConfig, scalarConfig);
  };

  // 添加自动发现控制器的辅助方法
  // 从逻辑容器中获取所有控制器
  HestApplicationInstancePrototype.autoDiscoverControllers = function (): ControllerConstructor[] {
    try {
      const container: Container = this.getContainer();
      const controllerItems: LogicalContainerItem[] = container.getAllControllers();
      
      // 提取控制器类
      const controllers: ControllerConstructor[] = controllerItems.map(
        (item: LogicalContainerItem) => item.provider as ControllerConstructor
      );
      logger.info(`🔍 Auto-discovered ${controllers.length} controllers:${controllers.map((ctrl: ControllerConstructor) => ctrl.name).join(', ')}`);

      return controllers;
    } catch (error) {
      logger.error('Failed to auto-discover controllers:', error);
      return [];
    }
  };
}

// 自动扩展
extendWithScalar();
