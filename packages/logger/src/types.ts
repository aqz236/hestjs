import type { Logger as PinoLogger } from 'pino';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /** 日志级别 */
  level?: LogLevel | string;
  /** 日志名称 */
  name?: string;
  /** 是否启用时间戳 */
  timestamp?: boolean;
  /** 序列化器配置 */
  serializers?: Record<string, (value: any) => any>;
  /** 自定义格式化器 */
  formatters?: {
    level?: (label: string, number: number) => object;
    bindings?: (bindings: Record<string, any>) => Record<string, any>;
    log?: (object: Record<string, any>) => Record<string, any>;
  };
  /** 传输配置 */
  transport?: any;
  /** 重新定义配置 */
  redact?: string[] | { paths: string[]; censor?: string };
  /** 基础配置 */
  base?: Record<string, any> | null;
  /** 钩子函数 */
  hooks?: {
    logMethod?: (inputArgs: any[], method: any, level: number) => void;
  };
  /** 自定义错误序列化器 */
  customLevels?: Record<string, number>;
  /** 使用仅级别标签 */
  useOnlyCustomLevels?: boolean;
  /** 混合函数 */
  mixin?: () => Record<string, any>;
  /** 消息键 */
  messageKey?: string;
  /** 错误键 */
  errorKey?: string;
  /** 换行符 */
  nestedKey?: string;
}

/**
 * 日志上下文接口
 */
export interface LogContext {
  /** 请求ID */
  requestId?: string;
  /** 用户ID */
  userId?: string;
  /** 跟踪ID */
  traceId?: string;
  /** 额外的上下文数据 */
  [key: string]: any;
}

/**
 * HestJS Logger 接口
 */
export interface Logger {
  /** 原始 Pino Logger 实例 */
  readonly pino: PinoLogger;
  
  /** 设置上下文 */
  setContext(context: LogContext): Logger;
  
  /** 获取子 Logger */
  child(bindings: Record<string, any>): Logger;
  
  /** Fatal 级别日志 */
  fatal(message: string, error: Error, ...args: any[]): void;
  fatal(error: Error, message?: string, ...args: any[]): void;
  fatal(obj: object, message?: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
  
  /** Error 级别日志 */
  error(message: string, error: Error, ...args: any[]): void;
  error(error: Error, message?: string, ...args: any[]): void;
  error(obj: object, message?: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  
  /** Warn 级别日志 */
  warn(message: string, error: Error, ...args: any[]): void;
  warn(error: Error, message?: string, ...args: any[]): void;
  warn(obj: object, message?: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  
  /** Info 级别日志 */
  info(message: string, error: Error, ...args: any[]): void;
  info(error: Error, message?: string, ...args: any[]): void;
  info(obj: object, message?: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  
  /** Debug 级别日志 */
  debug(message: string, error: Error, ...args: any[]): void;
  debug(error: Error, message?: string, ...args: any[]): void;
  debug(obj: object, message?: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  
  /** Trace 级别日志 */
  trace(message: string, error: Error, ...args: any[]): void;
  trace(error: Error, message?: string, ...args: any[]): void;
  trace(obj: object, message?: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;
  
  /** 刷新日志 */
  flush(): void;
  
  /** 检查是否启用了指定级别 */
  isLevelEnabled(level: LogLevel | string): boolean;
}

/**
 * 传输类型
 */
export type TransportType = 'console' | 'file' | 'stream' | 'custom';

/**
 * 传输配置
 */
export interface TransportConfig {
  type: TransportType;
  target?: string;
  options?: Record<string, any>;
}

/**
 * 环境变量
 */
export interface LoggerEnvironment {
  NODE_ENV?: string;
  LOG_LEVEL?: string;
  LOG_NAME?: string;
}
