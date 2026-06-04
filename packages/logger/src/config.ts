import { LoggerConfig, LoggerEnvironment, LogLevel } from "./types";

/**
 * 默认日志配置
 */
export const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  timestamp: true,
  name: "HestJS",
  messageKey: "msg",
  errorKey: "err",
  base: {
    pid: process.pid,
    hostname: require("os").hostname(),
  },
};

/**
 * 开发环境配置
 */
export const DEVELOPMENT_CONFIG: Partial<LoggerConfig> = {
  level: LogLevel.DEBUG,
  // 不在这里设置 transport，让 factory 使用 transports.ts 中的配置
};

/**
 * 生产环境配置
 */
export const PRODUCTION_CONFIG: Partial<LoggerConfig> = {
  level: LogLevel.INFO,
  redact: ["password", "token", "authorization", "cookie"],
};

/**
 * 测试环境配置
 */
export const TEST_CONFIG: Partial<LoggerConfig> = {
  level: LogLevel.WARN,
};

/**
 * 根据环境获取配置
 */
export function getEnvironmentConfig(env?: string): Partial<LoggerConfig> {
  const environment = env || process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
    case "prod":
      return PRODUCTION_CONFIG;
    case "test":
    case "testing":
      return TEST_CONFIG;
    case "development":
    case "dev":
    default:
      return DEVELOPMENT_CONFIG;
  }
}

/**
 * 从环境变量创建配置
 */
export function createConfigFromEnv(): Partial<LoggerConfig> {
  const env: LoggerEnvironment = process.env;
  const config: Partial<LoggerConfig> = {};

  if (env.LOG_LEVEL) {
    config.level = env.LOG_LEVEL as LogLevel;
  }

  if (env.LOG_NAME) {
    config.name = env.LOG_NAME;
  }

  return config;
}

/**
 * 合并配置
 */
export function mergeConfig(...configs: Partial<LoggerConfig>[]): LoggerConfig {
  return configs.reduce((merged, config) => ({ ...merged, ...config }), {
    ...DEFAULT_CONFIG,
  }) as LoggerConfig;
}
