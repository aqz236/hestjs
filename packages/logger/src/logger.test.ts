import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createChildLogger, createLogger, createLoggerWithContext } from './factory';
import { getGlobalLogger, logger, resetGlobalLogger, setGlobalLogger } from './global';
import { HestLogger } from './logger';
import { LogLevel } from './types';

describe('createLogger', () => {
  it('返回具备标准级别方法的 logger', () => {
    const log = createLogger('svc');

    for (const method of ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const) {
      expect(typeof log[method]).toBe('function');
    }
  });

  it('可指定日志级别（经由底层 pino 实例体现）', () => {
    const log = createLogger('svc', { level: LogLevel.ERROR });

    expect((log as HestLogger).pino.level).toBe(LogLevel.ERROR);
  });

  it('name 会写入日志绑定信息', () => {
    const log = createLogger('my-service') as HestLogger;

    expect(log.pino.bindings()).toMatchObject({ name: 'my-service' });
  });

  it('child 派生出的 logger 继承级别并附加绑定', () => {
    const log = createLogger('svc', { level: LogLevel.WARN }) as HestLogger;
    const child = log.child({ requestId: 'r-1' }) as HestLogger;

    expect(child.pino.level).toBe(LogLevel.WARN);
    expect(child.pino.bindings()).toMatchObject({ requestId: 'r-1' });
  });

  it('各级别方法可正常调用而不抛错', () => {
    const log = createLogger('svc', { level: LogLevel.TRACE });

    expect(() => {
      log.trace('t');
      log.debug('d');
      log.info('i');
      log.warn('w');
      log.error('e');
      log.fatal('f');
    }).not.toThrow();
  });

  it('支持 (message, error) 与 (error, message) 两种调用形态', () => {
    const log = createLogger('svc');

    expect(() => {
      log.error('something failed', new Error('cause'));
      log.error(new Error('cause'), 'something failed');
    }).not.toThrow();
  });

  // context 不进入 pino 的 bindings，而是在构造日志对象时合并，
  // 因此这里通过捕获底层 pino 的写入来验证。
  it('createLoggerWithContext 把 context 合并进日志对象', () => {
    const log = createLoggerWithContext('svc', { tenant: 't1' }) as HestLogger;
    const calls: any[][] = [];
    vi.spyOn(log.pino, 'info').mockImplementation(((...args: any[]) => {
      calls.push(args);
    }) as never);

    log.info('hello');

    // 底层调用形态为 pino.info(logObj, message)
    expect(calls[0][0]).toMatchObject({ tenant: 't1' });
    expect(calls[0][1]).toBe('hello');
    vi.restoreAllMocks();
  });

  it('createChildLogger 基于已有 logger 派生', () => {
    const parent = createLogger('svc');
    const child = createChildLogger(parent, { traceId: 'x' }) as HestLogger;

    expect(child.pino.bindings()).toMatchObject({ traceId: 'x' });
  });
});

describe('全局 logger', () => {
  beforeEach(() => {
    resetGlobalLogger();
  });

  it('默认返回一个可用实例', () => {
    expect(getGlobalLogger()).toBeInstanceOf(HestLogger);
  });

  it('setGlobalLogger 替换全局实例', () => {
    const custom = createLogger('custom');
    setGlobalLogger(custom);

    expect(getGlobalLogger()).toBe(custom);
  });

  it('resetGlobalLogger 恢复默认实例', () => {
    const custom = createLogger('custom');
    setGlobalLogger(custom);
    resetGlobalLogger();

    expect(getGlobalLogger()).not.toBe(custom);
  });

  it('logger 代理转发到当前全局实例', () => {
    const custom = createLogger('custom');
    const spy = vi.spyOn(custom, 'info').mockImplementation(() => {});
    setGlobalLogger(custom);

    logger.info('hello');

    // 代理对字符串入参会转发为 (message, undefined)
    expect(spy).toHaveBeenCalledWith('hello', undefined);
    spy.mockRestore();
  });
});
