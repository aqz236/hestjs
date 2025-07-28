import type { HestApplicationInstance } from "@hestjs/core";
import type { ScalarConfig } from "./scalar-config.interface";
import { setupScalar, setupScalarWithControllers } from "./scalar.middleware";
import type { OpenAPIGeneratorConfig } from './openapi-generator';

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
     * 从控制器自动生成 OpenAPI 并配置 Scalar
     */
    useScalarWithControllers(
      controllers: any[],
      generatorConfig: OpenAPIGeneratorConfig,
      scalarConfig?: Omit<ScalarConfig, 'spec'>
    ): void;
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
    controllers: any[],
    generatorConfig: OpenAPIGeneratorConfig,
    scalarConfig: Omit<ScalarConfig, 'spec'> = {}
  ) {
    // 如果没有传入控制器，尝试从容器中获取
    if (controllers.length === 0) {
      try {
        // 这里可以尝试从容器中获取所有控制器
        // 暂时使用一个简单的实现
        console.warn('Auto-discovery of controllers not yet implemented. Please pass controllers explicitly.');
      } catch (error) {
        console.warn('Failed to auto-discover controllers:', error);
      }
    }
    
    setupScalarWithControllers(this.hono(), controllers, generatorConfig, scalarConfig);
  };
}

// 自动扩展
extendWithScalar();
