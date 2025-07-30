/**
 * 日志级别格式化器 - 简洁版本，只保留数字级别
 */
export const levelFormatter = (_label: string, number: number) => {
  return {
    level: number,
  };

  //   return {
  //   level: number,
  //   levelLabel: label.toUpperCase(),
  // };
};

/**
 * 时间戳格式化器
 */
export const timestampFormatter = () => {
  return {
    timestamp: new Date().toISOString(),
  };
};

/**
 * 绑定数据格式化器 - 默认返回空对象，保持简洁
 */
export const bindingsFormatter = (_bindings: Record<string, any>) => {
  // 默认不添加任何额外信息，保持日志简洁
  return {};

  // const { pid, hostname, ...rest } = bindings;
  // return {
  //   service: 'HestJS',
  //   version: process.env.npm_package_version || '0.1.0',
  //   environment: process.env.NODE_ENV || 'development',
  //   pid,
  //   hostname,
  //   ...rest,
  // };
};

/**
 * 日志对象格式化器 - 标准化日志结构
 */
export const logFormatter = (object: Record<string, any>) => {
  const { level, time, msg, ...rest } = object;

  // 重组日志结构，确保关键字段在前
  return {
    "@timestamp": time,
    level,
    message: msg,
    ...rest,
  };
};

/**
 * 错误格式化器 - 专门处理错误对象
 */
export const errorFormatter = (object: Record<string, any>) => {
  if (object.err || object.error) {
    const error = object.err || object.error;
    return {
      ...object,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.status && { status: error.status }),
        ...(error.statusCode && { statusCode: error.statusCode }),
      },
    };
  }
  return object;
};

/**
 * 获取默认格式化器
 */
export function getDefaultFormatters() {
  return {
    level: levelFormatter,
    bindings: bindingsFormatter,
    log: (object: Record<string, any>) => {
      // 组合多个格式化器
      const formatted = logFormatter(object);
      return errorFormatter(formatted);
    },
  };
}

/**
 * 创建自定义格式化器
 */
export function createFormatter<T = Record<string, any>>(
  fn: (object: T) => T
): (object: T) => T {
  return (object: T) => {
    try {
      return fn(object);
    } catch (error) {
      // 如果格式化失败，返回原始对象并添加错误信息
      return {
        ...object,
        formatError:
          error instanceof Error ? error.message : "Unknown formatting error",
      } as T;
    }
  };
}
