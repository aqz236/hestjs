import { ApplicationHooks, Container } from "@hestjs/core";
import { createLogger } from "@hestjs/logger";
import { CommandBus } from "./command-bus";
import { QueryBus } from "./query-bus";
import { EventBus } from "./event-bus";
import {
  COMMAND_HANDLER_METADATA,
  EVENT_HANDLER_METADATA,
  QUERY_HANDLER_METADATA,
  SAGA_METADATA,
} from "./constants";

const logger = createLogger("CqrsAutoInit");

/**
 * 取已有实例；不存在则新建并注册进根容器
 *
 * 必须用 findContainerFor 向下查找：这些总线通常由 CqrsModule 作为 provider
 * 注册在**模块子容器**里，而钩子拿到的是根容器。
 * 早先只做 `container.tryResolve(token)`（仅看根容器及其祖先），
 * 于是每次都查不到、另建一套新实例，导致：
 *
 *   控制器注入的是模块容器里的总线（空），auto-discovery 注册 handler 的是
 *   根容器上那套新实例 —— 两套互不相干，控制器执行时永远报 *HandlerNotFound
 */
function resolveOrCreate<T>(container: Container, token: new () => T): T {
  const owner = container.findContainerFor(token);
  if (owner) {
    return owner.resolve<T>(token);
  }

  const created = new token();
  container.registerInstance(token, created);
  return created;
}

/**
 * 按装饰器元数据从逻辑容器中归类出各处理器
 */
function collectHandlers(container: Container) {
  const handlers = {
    commands: [] as any[],
    queries: [] as any[],
    events: [] as any[],
    sagas: [] as any[],
  };

  for (const item of container.getItemsByType('provider')) {
    const candidate = item.provider as any;

    if (Reflect.hasMetadata(COMMAND_HANDLER_METADATA, candidate)) {
      handlers.commands.push(candidate);
    }
    if (Reflect.hasMetadata(QUERY_HANDLER_METADATA, candidate)) {
      handlers.queries.push(candidate);
    }
    if (Reflect.hasMetadata(EVENT_HANDLER_METADATA, candidate)) {
      handlers.events.push(candidate);
    }
    if (Reflect.hasMetadata(SAGA_METADATA, candidate)) {
      handlers.sagas.push(candidate);
    }
  }

  return handlers;
}

/**
 * CQRS 自动初始化扩展
 *
 * 通过 core 的钩子系统在应用引导阶段拿到 HestJS 的 `Container`，
 * 然后：
 *
 * 1. 取出（或创建）三条总线，并把容器注入它们 —— 总线据此解析 handler，
 *    从而受模块 `imports` / `exports` 约束
 * 2. 从逻辑容器中发现处理器，交给总线**公开的** `register()` 完成注册
 *
 * 早先的实现绕过了第 1、2 步：它手工读 `design:paramtypes` 自行 new 出实例，
 * 再直接写总线的私有 map。这带来两个问题：
 *
 * - handler 的构造函数依赖由本文件自行解析，不受模块作用域约束（issue #19）
 * - 事件处理器写的是 `eventBus.handlers`，而 EventBus 的实际字段是
 *   `eventHandlers`，导致事件处理器**从未注册成功**，且不报错
 */
export function initializeCqrsAutoDiscovery() {
  ApplicationHooks.getInstance().registerHook(async (container: Container) => {
    try {
      logger.info("🔄 Auto-discovering CQRS handlers...");

      const commandBus = resolveOrCreate(container, CommandBus);
      const queryBus = resolveOrCreate(container, QueryBus);
      const eventBus = resolveOrCreate(container, EventBus);

      // 把 HestJS 容器注入总线，使其解析 handler 时受模块作用域约束
      commandBus.setContainer(container);
      queryBus.setContainer(container);
      eventBus.setContainer(container);

      const handlers = collectHandlers(container);

      commandBus.register(handlers.commands);
      queryBus.register(handlers.queries);
      eventBus.register(handlers.events);
      eventBus.registerSagas(handlers.sagas);

      logger.info(
        `✅ CQRS handlers auto-discovery completed: ` +
          `${handlers.commands.length} commands, ${handlers.queries.length} queries, ` +
          `${handlers.events.length} events, ${handlers.sagas.length} sagas`
      );
    } catch (error) {
      logger.error("❌ Failed to auto-discover CQRS handlers:", error);
    }
  });
}

// 自动初始化
initializeCqrsAutoDiscovery();
