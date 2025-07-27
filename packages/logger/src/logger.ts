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
  private buildLogObject(obj?: object | string, message?: string): [object, string | undefined] {
    const context = Object.keys(this._context).length > 0 ? this._context : undefined;
    
    if (typeof obj === 'string') {
      // logger.info('message') 或 logger.info('message', { data })
      if (message && typeof message === 'object') {
        // logger.info('message', { data }) - 消息在前，数据在后
        return [{ ...context, ...(message as Record<string, any>) }, obj];
      } else {
        // logger.info('message') - 只有消息
        return [context || {}, obj];
      }
    } else if (obj && typeof obj === 'object') {
      // logger.info({ key: 'value' }, 'message') - 数据在前，消息在后
      return [{ ...context, ...obj }, message];
    } else {
      // logger.info() - 没有参数
      return [context || {}, message];
    }
  }

  /**
   * Fatal 级别日志
   */
  fatal(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.fatal(logObj, msg, ...args);
    } else {
      this._pino.fatal(logObj, msg);
    }
  }

  /**
   * Error 级别日志
   */
  error(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.error(logObj, msg, ...args);
    } else {
      this._pino.error(logObj, msg);
    }
  }

  /**
   * Warn 级别日志
   */
  warn(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.warn(logObj, msg, ...args);
    } else {
      this._pino.warn(logObj, msg);
    }
  }

  /**
   * Info 级别日志
   */
  info(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.info(logObj, msg, ...args);
    } else {
      this._pino.info(logObj, msg);
    }
  }

  /**
   * Debug 级别日志
   */
  debug(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.debug(logObj, msg, ...args);
    } else {
      this._pino.debug(logObj, msg);
    }
  }

  /**
   * Trace 级别日志
   */
  trace(obj?: object | string, message?: string, ...args: any[]): void {
    const [logObj, msg] = this.buildLogObject(obj, message);
    if (args.length > 0) {
      this._pino.trace(logObj, msg, ...args);
    } else {
      this._pino.trace(logObj, msg);
    }
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
