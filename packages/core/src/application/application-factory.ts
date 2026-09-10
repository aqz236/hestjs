import { Hono } from "hono";
import { Container } from "../container/container";
import { MetadataScanner } from "../metadata/metadata-scanner";
import { RouterExplorer } from "../router/router-explorer";
import { HestApplicationInstance } from "./hest-application";
import { ApplicationHooks } from "./application-hooks";
import { Scope } from "../utils/constants";
import { logger } from "@hestjs/logger";

/**
 * 模块引导期上下文
 */
interface ModuleBootstrap {
  /** 模块类 -> 该模块自己的容器 */
  containers: Map<any, Container>;
  /** 控制器类 -> 其所属模块的容器 */
  controllerContainers: Map<any, Container>;
  /** provider 类 -> 声明它的模块，用于给出可操作的错误提示 */
  providerOwners: Map<any, any>;
}

/**
 * token 的可读名称，用于错误信息
 */
function describeToken(token: unknown): string {
  if (typeof token === 'function') {
    return `类 ${(token as { name?: string }).name || '(anonymous)'}`;
  }
  if (typeof token === 'symbol') {
    return `symbol ${token.toString()}`;
  }
  return `token "${String(token)}"`;
}

/**
 * HestJS 应用工厂
 *
 * ## 模块作用域
 *
 * 每个模块拥有独立的子容器，模块自己的 provider 只注册进该容器。
 * 子容器之间是兄弟关系（都挂在同一个父容器下），因此：
 *
 * - 模块 A 直接看不到模块 B 的私有 provider；
 * - 只有当 B 在 `exports` 中声明、且 A 在 `imports` 中引入 B 时，
 *   这些 provider 才会被接入 A 的容器；
 * - 单例以实例形式共享（registerInstance），transient 则以类形式重新注册。
 *
 * 这使 `imports` / `exports` 真正具备约束力，而不只是初始化顺序的声明。
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
    const bootstrap: ModuleBootstrap = {
      containers: new Map(),
      controllerContainers: new Map(),
      providerOwners: new Map(),
    };
    await HestFactory.initializeModule(moduleClass, container, bootstrap);

    // 创建应用实例
    const appInstance = new HestApplicationInstance(app, container);

    // 设置路由
    const routerExplorer = new RouterExplorer(app, container);
    routerExplorer.setGlobalFilters(appInstance.getGlobalFilters());
    routerExplorer.setGlobalInterceptors(appInstance.getGlobalInterceptors());

    // 控制器由各自的模块容器解析
    const allControllers = Array.from(bootstrap.controllerContainers.keys());
    if (allControllers.length > 0) {
      routerExplorer.explore(allControllers, bootstrap.controllerContainers);
    }

    // 执行所有注册的应用启动钩子
    await ApplicationHooks.getInstance().executeHooks(container);

    return appInstance;
  }

  /**
   * 初始化模块，返回该模块自己的容器
   */
  private static async initializeModule(
    moduleClass: any,
    parentContainer: Container,
    bootstrap: ModuleBootstrap
  ): Promise<Container> {
    // 同一模块被多个模块 import 时只初始化一次，避免产生重复单例
    const existing = bootstrap.containers.get(moduleClass);
    if (existing) {
      return existing;
    }

    const moduleMetadata = MetadataScanner.scanModule(moduleClass);
    if (!moduleMetadata) {
      throw new Error(`Module metadata not found for ${moduleClass.name}`);
    }

    const moduleContainer = parentContainer.createChild();
    bootstrap.containers.set(moduleClass, moduleContainer);

    // 让 Container 本身可被注入（等价于 NestJS 的 ModuleRef）。
    // 需要枚举容器内容的 provider 会依赖它，例如 @hestjs/cqrs 的 ExplorerService。
    // 注册的是根容器，因为「枚举全部已注册项」是应用级需求。
    moduleContainer.registerInstance(Container, parentContainer);

    // 注册模块自身
    moduleContainer.register(moduleClass, moduleClass, 'module');

    // 注册提供者
    for (const provider of moduleMetadata.providers ?? []) {
      if (!MetadataScanner.isInjectable(provider)) {
        console.warn(
          `Provider ${provider.name} is not injectable, skipping registration`
        );
        continue;
      }

      // 注册类本身作为令牌
      moduleContainer.register(provider, provider, 'provider');
      bootstrap.providerOwners.set(provider, moduleClass);

      // 同时注册类名字符串作为令牌，以支持 @Inject('ClassName') 语法。
      // 注册发生在模块自己的容器内，因此不同模块的同名类不再互相覆盖。
      if (moduleContainer.isRegistered(provider.name)) {
        logger.warn(
          `模块 ${moduleClass.name} 内已存在名为 "${provider.name}" 的 token，` +
            `后者将覆盖前者。请改用类本身或字符串令牌区分。`
        );
      }
      moduleContainer.register(provider.name, provider, 'provider');
    }

    // 注册控制器
    for (const controller of moduleMetadata.controllers ?? []) {
      if (!MetadataScanner.isController(controller)) {
        throw new Error(`${controller.name} is not a valid controller`);
      }
      moduleContainer.register(controller, controller, 'controller');
      bootstrap.controllerContainers.set(controller, moduleContainer);
    }

    // 处理导入的模块
    for (const importedModule of moduleMetadata.imports ?? []) {
      const importedContainer = await HestFactory.initializeModule(
        importedModule,
        parentContainer,
        bootstrap
      );
      HestFactory.linkModuleExports(
        importedModule,
        importedContainer,
        moduleContainer
      );
    }

    // 校验本模块内所有 provider / controller 的构造依赖都可见。
    // 必须有这一步：tsyringe 会直接构造未注册的传递依赖，
    // 仅靠子容器的隔离是拦不住的。
    HestFactory.validateModuleDependencies(
      moduleClass,
      moduleContainer,
      [...(moduleMetadata.providers ?? []), ...(moduleMetadata.controllers ?? [])],
      bootstrap
    );

    logger.info(`✅ Module ${moduleClass.name} initialized`);
    return moduleContainer;
  }

  /**
   * 校验依赖可见性
   *
   * 遍历模块内所有 provider / controller 的构造参数类型，
   * 确认每一个都能在当前模块容器中解析。
   *
   * 为何不依赖容器报错：tsyringe 的解析器在遇到未注册的类时会**直接构造它**，
   * 因此把它注册进子容器并不构成边界。这里显式检查，
   * 让「越权依赖」在启动时就以清晰的错误暴露，而不是静默成功。
   *
   * 局限：`@Inject('字符串令牌')` 的参数在 `design:paramtypes` 中呈现为
   * Object/String 等内置类型，无法还原真实令牌，因此会被跳过。
   */
  private static validateModuleDependencies(
    moduleClass: any,
    moduleContainer: Container,
    candidates: any[],
    bootstrap: ModuleBootstrap
  ): void {
    for (const target of candidates) {
      const params: any[] =
        Reflect.getMetadata('design:paramtypes', target) ?? [];

      for (const [index, param] of params.entries()) {
        if (!HestFactory.isClassDependency(param)) {
          continue;
        }

        if (!moduleContainer.isRegistered(param)) {
          const owner = bootstrap.providerOwners.get(param);
          const hint = owner
            ? `它由模块 ${owner.name} 提供，但未对该模块导出；` +
              `请在 ${owner.name} 的 exports 中声明 ${param.name}，` +
              `并把 ${owner.name} 加入 ${moduleClass.name} 的 imports。`
            : `它没有被任何模块注册；请把它加入某个模块的 providers。`;

          throw new Error(
            `模块 ${moduleClass.name} 中的 ${target.name} 依赖 ${param.name}` +
              `（第 ${index} 个构造参数），但该依赖对 ${moduleClass.name} 不可见。${hint}`
          );
        }
      }
    }
  }

  /**
   * 判断 `design:paramtypes` 中的一项是否为需要校验的类依赖。
   * 内置类型（Object / String / Number / Array …）通常是
   * 原始类型、类型别名或 `@Inject('...')` 的占位，一律跳过。
   */
  private static isClassDependency(param: unknown): boolean {
    if (typeof param !== 'function') {
      return false;
    }

    const builtins = new Set<unknown>([
      Object,
      String,
      Number,
      Boolean,
      Array,
      Function,
      Date,
      RegExp,
      Promise,
      Map,
      Set,
      Symbol,
      Error,
    ]);

    return !builtins.has(param);
  }


  /**
   * 把被导入模块 export 出来的 provider 接入导入方容器
   */
  private static linkModuleExports(
    importedModule: any,
    importedContainer: Container,
    targetContainer: Container
  ): void {
    const exported = MetadataScanner.scanModule(importedModule)?.exports ?? [];
    if (exported.length === 0) {
      return;
    }

    for (const token of exported) {
      const item = importedContainer.getLogicalContainer().get(token);

      if (!item) {
        throw new Error(
          `${importedModule.name} 在 exports 中声明了 ${describeToken(token)}，` +
            `但并未在 providers 中注册它`
        );
      }

      if (item.scope === Scope.TRANSIENT) {
        // transient 每次解析都应是新实例，按类重新注册
        targetContainer.register(token, item.provider, item.type);
      } else {
        // 单例按实例共享，确保多个导入方拿到同一个对象
        targetContainer.registerInstance(token, importedContainer.resolve(token));
      }

      // 同步类名字符串令牌，使 @Inject('ClassName') 在导入方仍然可用
      const name =
        typeof item.provider === 'function'
          ? (item.provider as { name?: string }).name
          : undefined;
      if (name && !targetContainer.isRegistered(name)) {
        targetContainer.registerInstance(
          name,
          targetContainer.resolve(token)
        );
      }
    }

    logger.info(
      `🔗 ${importedModule.name} 导出 ${exported.length} 个 provider 给导入方`
    );
  }
}
