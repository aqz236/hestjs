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
  fatal: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.fatal(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.fatal(obj, message, ...args);
    } else {
      globalLogger.fatal(obj as any, message, ...args);
    }
  }) as Logger['fatal'],
  
  error: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.error(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.error(obj, message, ...args);
    } else {
      globalLogger.error(obj as any, message, ...args);
    }
  }) as Logger['error'],
  
  warn: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.warn(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.warn(obj, message, ...args);
    } else {
      globalLogger.warn(obj as any, message, ...args);
    }
  }) as Logger['warn'],
  
  info: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.info(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.info(obj, message, ...args);
    } else {
      globalLogger.info(obj as any, message, ...args);
    }
  }) as Logger['info'],
  
  debug: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.debug(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.debug(obj, message, ...args);
    } else {
      globalLogger.debug(obj as any, message, ...args);
    }
  }) as Logger['debug'],
  
  trace: ((obj?: object | string | Error, message?: string, ...args: any[]) => {
    const globalLogger = getGlobalLogger();
    if (obj instanceof Error) {
      globalLogger.trace(obj, message, ...args);
    } else if (typeof obj === 'string') {
      globalLogger.trace(obj, message, ...args);
    } else {
      globalLogger.trace(obj as any, message, ...args);
    }
  }) as Logger['trace'],
  
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
