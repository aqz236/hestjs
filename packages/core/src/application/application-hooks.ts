/**
 * 应用启动钩子系统
 * 
 * 这是一个通用的钩子系统，允许外部包注册自己的初始化逻辑
 * 而不会让 core 包与特定的外部包产生耦合
 */

export type ApplicationHook = (container: any) => Promise<void> | void;

/**
 * 应用钩子管理器
 */
export class ApplicationHooks {
  private static instance: ApplicationHooks;
  private hooks: ApplicationHook[] = [];

  private constructor() {}

  static getInstance(): ApplicationHooks {
    if (!ApplicationHooks.instance) {
      ApplicationHooks.instance = new ApplicationHooks();
    }
    return ApplicationHooks.instance;
  }

  /**
   * 注册应用启动钩子
   */
  registerHook(hook: ApplicationHook): void {
    this.hooks.push(hook);
  }

  /**
   * 执行所有注册的钩子
   */
  async executeHooks(container: any): Promise<void> {
    for (const hook of this.hooks) {
      try {
        await hook(container);
      } catch (error) {
        console.warn('Failed to execute application hook:', error);
      }
    }
  }

  /**
   * 清空所有钩子
   */
  clearHooks(): void {
    this.hooks = [];
  }
}
