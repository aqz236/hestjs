import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  DEVELOPMENT_CONFIG,
  PRODUCTION_CONFIG,
  TEST_CONFIG,
  createConfigFromEnv,
  getEnvironmentConfig,
  mergeConfig,
} from './config';
import { LogLevel } from './types';

describe('mergeConfig', () => {
  it('无参数时返回默认配置的副本', () => {
    const merged = mergeConfig();

    expect(merged.level).toBe(DEFAULT_CONFIG.level);
    expect(merged).not.toBe(DEFAULT_CONFIG);
  });

  it('后面的配置覆盖前面的', () => {
    const merged = mergeConfig({ level: LogLevel.DEBUG }, { level: LogLevel.ERROR });

    expect(merged.level).toBe(LogLevel.ERROR);
  });

  it('是浅合并：嵌套对象会被整体替换而非逐字段合并', () => {
    const merged = mergeConfig({ base: { pid: 1 } as never });

    // 记录当前行为，便于日后决定是否改为深合并
    expect(merged.base).toEqual({ pid: 1 });
    expect(merged.base).not.toHaveProperty('hostname');
  });

  it('未覆盖的字段来自 DEFAULT_CONFIG', () => {
    const merged = mergeConfig({ level: LogLevel.TRACE });

    expect(merged.name).toBe(DEFAULT_CONFIG.name);
    expect(merged.messageKey).toBe(DEFAULT_CONFIG.messageKey);
    expect(merged.errorKey).toBe(DEFAULT_CONFIG.errorKey);
  });
});

describe('getEnvironmentConfig', () => {
  it('development 返回开发配置', () => {
    expect(getEnvironmentConfig('development')).toEqual(DEVELOPMENT_CONFIG);
  });

  it('production 返回生产配置', () => {
    expect(getEnvironmentConfig('production')).toEqual(PRODUCTION_CONFIG);
  });

  it('test 返回测试配置', () => {
    expect(getEnvironmentConfig('test')).toEqual(TEST_CONFIG);
  });

  it('未知环境回退到开发配置', () => {
    expect(getEnvironmentConfig('staging')).toEqual(DEVELOPMENT_CONFIG);
  });

  it('未传入时读取 NODE_ENV', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      expect(getEnvironmentConfig()).toEqual(PRODUCTION_CONFIG);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});

describe('createConfigFromEnv', () => {
  const original = { ...process.env };

  it('LOG_LEVEL 覆盖日志级别', () => {
    process.env.LOG_LEVEL = 'debug';

    expect(createConfigFromEnv().level).toBe(LogLevel.DEBUG);

    process.env = { ...original };
  });

  it('LOG_NAME 覆盖服务名', () => {
    process.env.LOG_NAME = 'my-service';

    expect(createConfigFromEnv().name).toBe('my-service');

    process.env = { ...original };
  });

  it('未设置环境变量时不覆盖任何字段', () => {
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_NAME;

    expect(createConfigFromEnv()).toEqual({});

    process.env = { ...original };
  });
});
