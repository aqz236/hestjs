import { ApplicationHooks, Container } from "@hestjs/core";
import { createLogger } from "@hestjs/logger";
import { CommandBus } from "./command-bus";
import { QueryBus } from "./query-bus";
import { EventBus } from "./event-bus";
import { ExplorerService } from "./services/explorer.service";
import {
  COMMAND_HANDLER_METADATA,
  EVENT_HANDLER_METADATA,
  QUERY_HANDLER_METADATA,
} from "./constants";

const logger = createLogger("CqrsAutoInit");

/**
 * CQRS 自动初始化扩展
 * 
 * 通过 core 包的钩子系统自动注册 CQRS 相关的处理器
 * 这样避免了 core 包与 CQRS 包的直接耦合
 */
export function initializeCqrsAutoDiscovery() {
  // 注册应用启动钩子
  ApplicationHooks.getInstance().registerHook(async (container: Container) => {
    try {
      logger.info("🔄 Auto-discovering CQRS handlers...");
      
      // 尝试从容器中获取已存在的CQRS服务实例，如果没有则创建新的
      let commandBus: CommandBus;
      let queryBus: QueryBus;
      let eventBus: EventBus;
      
      try {
        commandBus = container.resolve(CommandBus);
        queryBus = container.resolve(QueryBus);
        eventBus = container.resolve(EventBus);
        logger.info("🔗 Using existing CQRS service instances from container");
      } catch {
        // 如果容器中没有，则创建新的实例
        commandBus = new CommandBus();
        queryBus = new QueryBus();
        eventBus = new EventBus();
        logger.info("🆕 Created new CQRS service instances");
        
        // 将新实例注册到容器中
        container.registerInstance(CommandBus, commandBus);
        container.registerInstance(QueryBus, queryBus);
        container.registerInstance(EventBus, eventBus);
      }
      
      // 从逻辑容器中发现处理器
      const providerItems = container.getItemsByType('provider');
      const handlers = {
        commands: [] as any[],
        queries: [] as any[],
        events: [] as any[],
        sagas: [] as any[]
      };
      
      for (const item of providerItems) {
        const handlerClass = item.provider;
        
        // 检查命令处理器
        if (Reflect.hasMetadata(COMMAND_HANDLER_METADATA, handlerClass)) {
          handlers.commands.push(handlerClass);
          // logger.debug(`Found command handler: ${handlerClass.name}`);
        }
        
        // 检查查询处理器
        if (Reflect.hasMetadata(QUERY_HANDLER_METADATA, handlerClass)) {
          handlers.queries.push(handlerClass);
          // logger.debug(`Found query handler: ${handlerClass.name}`);
        }
        
        // 检查事件处理器
        if (Reflect.hasMetadata(EVENT_HANDLER_METADATA, handlerClass)) {
          handlers.events.push(handlerClass);
          // logger.debug(`Found event handler: ${handlerClass.name}`);
        }
      }
      
      // 手动注册处理器到总线（避免容器解析问题）
      registerHandlersManually(commandBus, queryBus, eventBus, handlers, container);
      
      logger.info(`✅ CQRS handlers auto-discovery completed: ${handlers.commands.length} commands, ${handlers.queries.length} queries, ${handlers.events.length} events`);
      
    } catch (error) {
      logger.error("❌ Failed to auto-discover CQRS handlers:", error);
    }
  });
}

/**
 * 手动注册处理器到总线，避免容器解析问题
 */
function registerHandlersManually(
  commandBus: CommandBus,
  queryBus: QueryBus,
  eventBus: EventBus,
  handlers: any,
  container: Container
): void {
  // 注册命令处理器
  for (const HandlerClass of handlers.commands) {
    try {
      const commandType = Reflect.getMetadata(COMMAND_HANDLER_METADATA, HandlerClass);
      if (commandType) {
        // 手动解析构造函数依赖并创建实例
        const handlerInstance = createHandlerInstance(HandlerClass, container);
        const commandName = commandType.name;
        
        // 直接设置到 commandBus 的内部映射
        (commandBus as any).handlers.set(commandName, (command: any) => 
          (handlerInstance as any).execute(command)
        );
        
        // logger.info(`Manually registered command handler for "${commandName}"`);
      }
    } catch (error) {
      logger.error(`Failed to register command handler ${HandlerClass.name}:`, error);
    }
  }
  
  // 注册查询处理器
  for (const HandlerClass of handlers.queries) {
    try {
      const queryType = Reflect.getMetadata(QUERY_HANDLER_METADATA, HandlerClass);
      if (queryType) {
        // 手动解析构造函数依赖并创建实例
        const handlerInstance = createHandlerInstance(HandlerClass, container);
        const queryName = queryType.name;
        
        // 直接设置到 queryBus 的内部映射
        (queryBus as any).handlers.set(queryName, (query: any) => 
          (handlerInstance as any).execute(query)
        );
        
        // logger.info(`Manually registered query handler for "${queryName}"`);
      }
    } catch (error) {
      logger.warn(`Failed to register query handler ${HandlerClass.name}:`, error);
    }
  }
  
  // 注册事件处理器
  for (const HandlerClass of handlers.events) {
    try {
      const eventTypes = Reflect.getMetadata(EVENT_HANDLER_METADATA, HandlerClass);
      if (eventTypes) {
        // 手动解析构造函数依赖并创建实例
        const handlerInstance = createHandlerInstance(HandlerClass, container);
        
        // 处理可能有多个事件类型的情况
        const eventTypeArray = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
        
        for (const eventType of eventTypeArray) {
          const eventName = eventType.name;
          
          // 直接设置到 eventBus 的内部映射  
          if (!(eventBus as any).handlers) {
            (eventBus as any).handlers = new Map();
          }
          
          if (!(eventBus as any).handlers.has(eventName)) {
            (eventBus as any).handlers.set(eventName, []);
          }
          
          (eventBus as any).handlers.get(eventName).push((event: any) => 
            (handlerInstance as any).handle(event)
          );
          
          logger.info(`Manually registered event handler for "${eventName}"`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to register event handler ${HandlerClass.name}:`, error);
    }
  }
}

/**
 * 手动创建处理器实例并解析依赖
 */
function createHandlerInstance(HandlerClass: any, container: Container): any {
  // 获取构造函数参数类型
  const paramTypes = Reflect.getMetadata('design:paramtypes', HandlerClass) || [];
  
  // 解析每个依赖
  const dependencies = paramTypes.map((paramType: any) => {
    try {
      // 尝试从容器中解析依赖
      return container.resolve(paramType);
    } catch (error) {
      logger.warn(`Failed to resolve dependency ${paramType?.name || 'unknown'} for ${HandlerClass.name}, using null`);
      return null;
    }
  });
  
  // 创建实例
  return new HandlerClass(...dependencies);
}

// 自动初始化
initializeCqrsAutoDiscovery();
