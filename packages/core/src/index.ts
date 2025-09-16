import "reflect-metadata";

// 导出所有公共 API
export * from "./application";
export * from "./container";
export * from "./decorators";
export * from "./interfaces";
export * from "./metadata";
export * from "./middlewares";
export * from "./utils";

// 显式导出路由相关，避免命名冲突
export { RouteMetadata as RouteMetadataCollector } from "./router/route-metadata";
export { RouterExplorer } from "./router/router-explorer";

// 导出主要的工厂类
export { HestFactory } from "./application/application-factory";

// 导出 Logger
export {
  configureGlobalLogger,
  createLogger,
  getGlobalLogger,
  logger,
  LogLevel,
  setGlobalLogger,
  type Logger,
  type LoggerConfig,
} from "@hestjs/logger";
