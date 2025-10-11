import * as stdSerializers from 'pino-std-serializers';

/**
 * 错误序列化器 - 扩展标准错误序列化器
 */
export const errorSerializer = (err: Error) => {
  const serialized = stdSerializers.err(err);
  return {
    ...serialized,
    // 添加额外的错误信息
    name: err.name,
    message: err.message,
    stack: err.stack,
    // 如果是 HTTP 错误，添加状态码
    ...((err as any).status && { status: (err as any).status }),
    ...((err as any).statusCode && { statusCode: (err as any).statusCode }),
  };
};

/**
 * 请求序列化器
 */
export const requestSerializer = (req: any) => {
  if (!req) return req;

  return {
    id: req.id,
    method: req.method,
    url: req.url,
    path: req.path,
    parameters: req.parameters,
    query: req.query,
    headers: {
      // 只记录重要的头部信息，避免敏感信息泄露
      "content-type": req.headers?.["content-type"],
      "user-agent": req.headers?.["user-agent"],
      accept: req.headers?.["accept"],
      "accept-encoding": req.headers?.["accept-encoding"],
      "accept-language": req.headers?.["accept-language"],
    },
    remoteAddress: req.socket?.remoteAddress,
    remotePort: req.socket?.remotePort,
  };
};

/**
 * 响应序列化器
 */
export const responseSerializer = (res: any) => {
  if (!res) return res;

  return {
    statusCode: res.statusCode,
    headers: {
      "content-type": res.getHeader?.("content-type"),
      "content-length": res.getHeader?.("content-length"),
    },
  };
};

/**
 * 用户序列化器 - 避免敏感信息泄露
 */
export const userSerializer = (user: any) => {
  if (!user) return user;

  const { password, token, secret, ...safeUser } = user;
  return safeUser;
};

/**
 * 数据库查询序列化器
 */
export const querySerializer = (query: any) => {
  if (!query) return query;

  return {
    sql: query.sql,
    duration: query.duration,
    rowCount: query.rowCount,
    // 不记录参数值，避免敏感数据泄露
    hasParameters:
      Array.isArray(query.parameters) && query.parameters.length > 0,
  };
};

/**
 * 获取默认序列化器
 */
export function getDefaultSerializers() {
  return {
    // 只使用 pino 标准的请求和响应序列化器
    req: stdSerializers.req,
    res: stdSerializers.res,
    // 使用我们自定义的错误序列化器
    err: errorSerializer,
    // 自定义序列化器
    user: userSerializer,
    query: querySerializer,
  };
}

/**
 * 创建自定义序列化器
 */
export function createSerializer<T = any>(
  fn: (value: T) => any
): (value: T) => any {
  return (value: T) => {
    try {
      return fn(value);
    } catch (error) {
      // 如果序列化失败，返回安全的字符串表示
      return `[Serialization Error: ${error instanceof Error ? error.message : "Unknown"}]`;
    }
  };
}
