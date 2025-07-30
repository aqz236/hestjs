import type { TransportConfig } from "./types";

/**
 * 控制台传输配置
 */
export function createConsoleTransport(
  options: {
    colorize?: boolean;
    translateTime?: boolean | string;
    ignore?: string;
    singleLine?: boolean;
    hideObject?: boolean;
  } = {}
): TransportConfig {
  return {
    type: "console",
    target: "pino-pretty",
    options: {
      colorize: options.colorize ?? true,
      translateTime: options.translateTime ?? "yyyy-mm-dd HH:MM:ss.l",
      ignore: options.ignore ?? "pid,hostname",
      singleLine: options.singleLine ?? false,
      hideObject: options.hideObject ?? false,
      messageFormat: "{end}{msg}",
      ...options,
    },
  };
}

/**
 * 文件传输配置
 */
export function createFileTransport(
  options: {
    destination: string;
    mkdir?: boolean;
    append?: boolean;
    maxSize?: number;
    maxFiles?: number;
  } = { destination: "./logs/app.log" }
): TransportConfig {
  const { destination, ...restOptions } = options;
  return {
    type: "file",
    target: "pino/file",
    options: {
      destination,
      mkdir: true,
      append: true,
      ...restOptions,
    },
  };
}

/**
 * 滚动文件传输配置
 */
export function createRotatingFileTransport(
  options: {
    filename: string;
    frequency?: string;
    maxSize?: string;
    maxFiles?: string | number;
    dateFormat?: string;
  } = { filename: "./logs/app-%DATE%.log" }
): TransportConfig {
  return {
    type: "custom",
    target: "pino-roll",
    options: {
      file: options.filename,
      frequency: options.frequency ?? "daily",
      size: options.maxSize ?? "10M",
      limit: options.maxFiles ?? "7",
      dateFormat: options.dateFormat ?? "YYYY-MM-DD",
      ...options,
    },
  };
}

/**
 * JSON 文件传输配置
 */
export function createJsonFileTransport(
  options: {
    destination: string;
    mkdir?: boolean;
    append?: boolean;
  } = { destination: "./logs/app.json" }
): TransportConfig {
  return {
    type: "file",
    target: "pino/file",
    options: {
      destination: options.destination,
      mkdir: options.mkdir ?? true,
      append: options.append ?? true,
    },
  };
}

/**
 * 多传输配置
 */
export function createMultiTransport(transports: TransportConfig[]): any {
  return {
    targets: transports.map((transport) => ({
      target: transport.target,
      options: transport.options,
      level: transport.options?.level,
    })),
  };
}

/**
 * 开发环境传输
 */
export function createDevelopmentTransport(): TransportConfig {
  return createConsoleTransport({
    colorize: true,
    translateTime: "yy-mm-dd HH:MM:ss.l",
    ignore: "pid,hostname",
    singleLine: false,
  });
}

/**
 * 生产环境传输
 */
export function createProductionTransport(): any {
  return createMultiTransport([
    createJsonFileTransport({
      destination: "./logs/app.json",
    }),
    createFileTransport({
      destination: "./logs/error.log",
    }),
  ]);
}

/**
 * 根据环境获取传输配置
 */
export function getEnvironmentTransport(env?: string): any {
  const environment = env || process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
    case "prod":
      return createProductionTransport();
    case "test":
    case "testing":
      return undefined; // 测试环境通常不需要传输
    case "development":
    case "dev":
    default:
      return createDevelopmentTransport();
  }
}
