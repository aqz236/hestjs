import pino from 'pino';
import { HestLogger } from './logger';
import { mergeConfig, getEnvironmentConfig, createConfigFromEnv } from './config';
import { getDefaultSerializers } from './serializers';
import { getDefaultFormatters } from './formatters';
import { getEnvironmentTransport } from './transports';
import type { Logger, LoggerConfig } from './types';

/**
 * 创建 Logger 实例
 */
export function createLogger(
  name?: string,
  config?: Partial<LoggerConfig>
): Logger {
  // 合并配置：默认配置 -> 环境配置 -> 环境变量配置 -> 用户配置
  const envConfig = getEnvironmentConfig();
  const envVarConfig = createConfigFromEnv();
  const userConfig = config || {};
  
  // 如果提供了名称，添加到配置中
  if (name) {
    userConfig.name = name;
  }

  const finalConfig = mergeConfig(
    envConfig,
    envVarConfig,
    userConfig
  );

  // 设置默认序列化器和格式化器
  if (!finalConfig.serializers) {
    finalConfig.serializers = getDefaultSerializers();
  }

  if (!finalConfig.formatters) {
    finalConfig.formatters = getDefaultFormatters();
  }

  // 设置传输
  if (!finalConfig.transport) {
    const transport = getEnvironmentTransport();
    if (transport) {
      finalConfig.transport = transport;
    }
  }

  // 创建 Pino Logger
  const pinoLogger = pino(finalConfig as pino.LoggerOptions);

  // 如果有 name，创建一个 child logger 来包含 name
  const loggerWithName = name ? pinoLogger.child({ name }) : pinoLogger;

  // 返回 HestLogger 实例
  return new HestLogger(loggerWithName);
}

/**
 * 创建带有上下文的 Logger
 */
export function createLoggerWithContext(
  name: string,
  context: Record<string, any>,
  config?: Partial<LoggerConfig>
): Logger {
  const logger = createLogger(name, config);
  return logger.setContext(context);
}

/**
 * 创建子 Logger
 */
export function createChildLogger(
  parent: Logger,
  bindings: Record<string, any>
): Logger {
  return parent.child(bindings);
}
