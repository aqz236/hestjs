import { describe, expect, it } from 'vitest';
import {
  bindingsFormatter,
  createFormatter,
  errorFormatter,
  getDefaultFormatters,
  levelFormatter,
  logFormatter,
  timestampFormatter,
} from './formatters';
import {
  createSerializer,
  errorSerializer,
  getDefaultSerializers,
  querySerializer,
  requestSerializer,
  responseSerializer,
  userSerializer,
} from './serializers';

describe('formatters', () => {
  it('levelFormatter 只输出数值级别（当前实现的刻意简化）', () => {
    const result = levelFormatter('info', 30);

    expect(result).toEqual({ level: 30 });
  });

  it('timestampFormatter 输出 ISO 时间戳', () => {
    const result = timestampFormatter();

    expect(typeof result.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('bindingsFormatter 当前刻意返回空对象（保持日志简洁）', () => {
    const result = bindingsFormatter({ pid: 1, hostname: 'host' });

    expect(result).toEqual({});
  });

  it('logFormatter 把 msg 重命名为 message 并置前', () => {
    const result = logFormatter({ msg: 'hello', level: 30, time: 123, extra: 1 });

    expect(result).toMatchObject({ message: 'hello', level: 30, extra: 1 });
    expect(result).not.toHaveProperty('msg');
  });

  it('errorFormatter 输出错误的名称与消息', () => {
    const err = new Error('boom');
    err.name = 'CustomError';

    const result = errorFormatter({ err });

    expect(result.err).toMatchObject({ name: 'CustomError', message: 'boom' });
  });

  it('getDefaultFormatters 汇总全部格式化器', () => {
    const formatters = getDefaultFormatters();

    expect(Object.keys(formatters).length).toBeGreaterThan(0);
  });

  it('createFormatter 包装自定义函数', () => {
    const custom = createFormatter((obj: Record<string, any>) => ({
      ...obj,
      injected: true,
    }));

    expect(typeof custom).toBe('function');
  });
});

describe('serializers', () => {
  it('errorSerializer 输出 name / message / stack', () => {
    const result = errorSerializer(new TypeError('bad type'));

    expect(result).toMatchObject({ name: 'TypeError', message: 'bad type' });
    expect(typeof result.stack).toBe('string');
  });

  it('errorSerializer 带上 status / statusCode（若存在）', () => {
    const err = Object.assign(new Error('nope'), { status: 404, statusCode: 404 });
    const result = errorSerializer(err);

    expect(result).toMatchObject({ status: 404, statusCode: 404 });
  });

  it('requestSerializer 只保留白名单请求头', () => {
    const result = requestSerializer({
      method: 'GET',
      url: '/users',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'vitest',
        authorization: 'Bearer secret-token',
        cookie: 'session=abc',
      },
    });

    expect(result).toMatchObject({ method: 'GET', url: '/users' });
    expect(result.headers['content-type']).toBe('application/json');
    // 敏感头不应被记录
    expect(result.headers).not.toHaveProperty('authorization');
    expect(result.headers).not.toHaveProperty('cookie');
  });

  it('requestSerializer 对空值原样返回', () => {
    expect(requestSerializer(null)).toBeNull();
    expect(requestSerializer(undefined)).toBeUndefined();
  });

  it('responseSerializer 输出状态码', () => {
    const result = responseSerializer({ statusCode: 200, headers: {} });

    expect(result).toMatchObject({ statusCode: 200 });
  });

  it('userSerializer 不泄露密码类字段', () => {
    const result = userSerializer({
      id: 1,
      name: 'Alice',
      email: 'a@b.com',
      password: 'secret',
      passwordHash: 'hash',
    });

    expect(result).toMatchObject({ id: 1, name: 'Alice' });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('userSerializer 覆盖常见敏感命名变体', () => {
    const result = userSerializer({
      id: 1,
      accessToken: 'a',
      refresh_token: 'b',
      apiKey: 'c',
      api_key: 'd',
      sessionId: 'e',
      privateKey: 'f',
      credentials: 'g',
      passwordHash: 'h',
    });

    expect(result).toEqual({ id: 1 });
  });

  it('querySerializer 输出查询参数', () => {
    const result = querySerializer({ page: '1', size: '20' });

    expect(result).toBeDefined();
  });

  it('getDefaultSerializers 汇总全部序列化器', () => {
    expect(Object.keys(getDefaultSerializers()).length).toBeGreaterThan(0);
  });

  it('createSerializer 包装自定义函数', () => {
    expect(typeof createSerializer((v: unknown) => v)).toBe('function');
  });
});
