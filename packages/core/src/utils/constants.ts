// 元数据键常量
export const METADATA_KEYS = {
  CONTROLLER: Symbol.for('hest:controller'),
  INJECTABLE: Symbol.for('hest:injectable'),
  MODULE: Symbol.for('hest:module'),
  ROUTE: Symbol.for('hest:route'),
  PARAM: Symbol.for('hest:param'),
  MIDDLEWARE: Symbol.for('hest:middleware'),
  GUARD: Symbol.for('hest:guard'),
} as const;

// HTTP 方法枚举
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

// 参数类型枚举
export enum ParamType {
  BODY = 'body',
  PARAM = 'param',
  QUERY = 'query',
  HEADER = 'header',
  REQUEST = 'request',
  RESPONSE = 'response',
  CONTEXT = 'context',
}

// 注入作用域
export enum Scope {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient',
  REQUEST = 'request',
}
