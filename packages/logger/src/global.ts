import { createLogger } from './factory';
import type { Logger, LoggerConfig } from './types';

/**
 * 全局 Logger 实例
 */
let globalLogger: Logger | null = null;

/**
 * 获取全局 Logger 实例
 */
export function getGlobalLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger('Global');
  }
  return globalLogger;
}

/**
 * 设置全局 Logger 实例
 */
export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * 重置全局 Logger
 */
export function resetGlobalLogger(): void {
  globalLogger = null;
}

/**
 * 配置全局 Logger
 */
export function configureGlobalLogger(
  name?: string,
  config?: Partial<LoggerConfig>
): Logger {
  globalLogger = createLogger(name || 'Global', config);
  return globalLogger;
}

/**
 * 便利方法 - 直接从全局 Logger 记录日志
 */
export const logger = {
  fatal: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().fatal(obj as any, message, ...args);
  },
  error: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().error(obj as any, message, ...args);
  },
  warn: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().warn(obj as any, message, ...args);
  },
  info: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().info(obj as any, message, ...args);
  },
  debug: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().debug(obj as any, message, ...args);
  },
  trace: (obj?: object | string, message?: string, ...args: any[]) => {
    getGlobalLogger().trace(obj as any, message, ...args);
  },
  child: (bindings: Record<string, any>) => {
    return getGlobalLogger().child(bindings);
  },
  setContext: (context: Record<string, any>) => {
    return getGlobalLogger().setContext(context);
  },
  flush: () => {
    getGlobalLogger().flush();
  },
  isLevelEnabled: (level: string) => {
    return getGlobalLogger().isLevelEnabled(level);
  },
};
