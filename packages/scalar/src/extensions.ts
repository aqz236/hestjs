import type { HestApplicationInstance } from "@hestjs/core";
import type { ScalarConfig } from "./scalar-config.interface";
import { setupScalar } from "./scalar.middleware";

/**
 * 扩展 HestApplicationInstance 以支持 Scalar
 */
declare module "@hestjs/core" {
  interface HestApplicationInstance {
    /**
     * 配置 Scalar API 文档
     */
    useScalar(config: ScalarConfig): void;
  }
}

/**
 * 为 HestApplicationInstance 添加 useScalar 方法
 */
export function extendWithScalar() {
  const HestApplicationInstancePrototype =
    require("@hestjs/core").HestApplicationInstance.prototype;

  HestApplicationInstancePrototype.useScalar = function (config: ScalarConfig) {
    setupScalar(this.hono(), config);
  };
}

// 自动扩展
extendWithScalar();
