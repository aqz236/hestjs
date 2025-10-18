import "reflect-metadata";

// 导出所有公共 API
export * from "./classes";
export * from "./decorators";
export * from "./exceptions";
export * from "./helpers";
export * from "./interfaces";
export * from "./services";
export * from "./utils";

// 导出核心总线
export { CommandBus } from "./command-bus";
export { EventBus } from "./event-bus";
export { QueryBus } from "./query-bus";

// 导出模块
export { CqrsModule } from "./cqrs.module";

// 导出常量
export * from "./constants";
