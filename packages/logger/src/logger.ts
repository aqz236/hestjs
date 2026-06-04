import type { Logger as PinoLogger } from 'pino';
import type { Logger, LogContext } from './types';

/**
 * HestJS Logger 实现
 */
export class HestLogger implements Logger {
  private _pino: PinoLogger;
  private _context: LogContext = {};

  constructor(pinoLogger: PinoLogger) {
    this._pino = pinoLogger;
  }

  /**
   * 获取原始 Pino Logger 实例
   */
  get pino(): PinoLogger {
    return this._pino;
  }

  /**
   * 设置日志上下文
   */
  setContext(context: LogContext): Logger {
    this._context = { ...this._context, ...context };
    return this;
  }

  /**
   * 获取子 Logger
   */
  child(bindings: Record<string, any>): Logger {
    const childPino = this._pino.child({ ...this._context, ...bindings });
    const childLogger = new HestLogger(childPino);
    childLogger._context = { ...this._context };
    return childLogger;
  }

  /**
   * 构建日志对象
   */
  private buildLogObject(obj?: object | string, message?: string, ...args: any[]): [object, string | undefined] {
    const context = Object.keys(this._context).length > 0 ? this._context : undefined;
    let logObj: any = { ...context };
    let logMessage: string | undefined;
    
    if (typeof obj === 'string') {
      // logger.info('message') 或 logger.info('message', data, ...)
      logMessage = obj;
      
      // 检查后续参数中是否有普通对象数据（不处理Error对象）
      if (message !== undefined || args.length > 0) {
        const allArgs = [message, ...args].filter(arg => arg !== undefined);
        
        for (const arg of allArgs) {
          if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
            // 如果是普通对象，合并到日志对象中
            Object.assign(logObj, arg);
          }
        }
      }
    } else if (obj && typeof obj === 'object' && !(obj instanceof Error)) {
      // logger.info({ key: 'value' }, 'message') - 数据在前，消息在后
      Object.assign(logObj, obj);
      logMessage = message;
      
      // 处理额外参数中的普通对象
      for (const arg of args) {
        if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
          Object.assign(logObj, arg);
        }
      }
    } else {
      // logger.info() - 没有参数，或者 obj 是其他类型（包括Error）
      logMessage = message;
      
      // 处理额外参数中的普通对象
      for (const arg of args) {
        if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
          Object.assign(logObj, arg);
        }
      }
    }
    
    return [logObj, logMessage];
  }

  /**
   * Fatal 级别日志
   */
  fatal(message: string, error: Error, ...args: any[]): void;
  fatal(error: Error, message?: string, ...args: any[]): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
  fatal(obj?: any, message?: any, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message, ...args);
    this._pino.fatal(logObj, msg);
  }

  /**
   * Error 级别日志
   */
  error(message: string, error: Error, ...args: any[]): void;
  error(error: Error, message?: string, ...args: any[]): void;
  error(obj: object, message?: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  error(obj?: any, message?: any, ...args: any[]): void {
    if (typeof obj === 'string' && message instanceof Error) {
      // logger.error('message', error) - 消息在前，错误在后
      // 直接让pino处理：传递Error对象作为合并对象，消息作为第二个参数
      this._pino.error(message, obj);
    } else if (obj instanceof Error) {
      // logger.error(error, 'message') - 错误在前，消息在后
      // 直接让pino处理：传递Error对象作为合并对象，消息作为第二个参数
      this._pino.error(obj, message);
    } else {
      // 其他情况使用原来的方法
      const [logObj, msg] = this.buildLogObject(obj, message, ...args);
      this._pino.error(logObj, msg);
    }
  }

  /**
   * Warn 级别日志
   */
  warn(message: string, error: Error, ...args: any[]): void;
  warn(error: Error, message?: string, ...args: any[]): void;
  warn(obj: object, message?: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  warn(obj?: any, message?: any, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message, ...args);
    this._pino.warn(logObj, msg);
  }

  /**
   * Info 级别日志
   */
  info(message: string, error: Error, ...args: any[]): void;
  info(error: Error, message?: string, ...args: any[]): void;
  info(obj: object, message?: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  info(obj?: any, message?: any, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message, ...args);
    this._pino.info(logObj, msg);
  }

  /**
   * Debug 级别日志
   */
  debug(message: string, error: Error, ...args: any[]): void;
  debug(error: Error, message?: string, ...args: any[]): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  debug(obj?: any, message?: any, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message, ...args);
    this._pino.debug(logObj, msg);
  }

  /**
   * Trace 级别日志
   */
  trace(message: string, error: Error, ...args: any[]): void;
  trace(error: Error, message?: string, ...args: any[]): void;
  trace(obj: object, message?: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;
  trace(obj?: any, message?: any, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message, ...args);
    this._pino.trace(logObj, msg);
  }

  /**
   * 刷新日志
   */
  flush(): void {
    if (typeof this._pino.flush === 'function') {
      this._pino.flush();
    }
  }

  /**
   * 检查是否启用了指定级别
   */
  isLevelEnabled(level: string): boolean {
    return this._pino.isLevelEnabled(level);
  }
}
