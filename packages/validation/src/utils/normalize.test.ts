import { describe, expect, it } from 'vitest';
import {
  normalize,
  normalizeDigits,
  normalizeEmail,
  normalizeEmptyToUndefined,
  normalizeWhitespace,
} from './normalize';

describe('normalizeWhitespace', () => {
  it('压缩连续空白并去首尾', () => {
    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
    expect(normalizeWhitespace('a\n\t b')).toBe('a b');
  });

  it('非字符串原样返回', () => {
    expect(normalizeWhitespace(undefined as any)).toBeUndefined();
  });
});

describe('normalizeEmail', () => {
  it('去空白并转小写', () => {
    expect(normalizeEmail('  AQZ@Example.COM ')).toBe('aqz@example.com');
  });
});

describe('normalizeEmptyToUndefined', () => {
  it('空串与纯空白收敛为 undefined', () => {
    expect(normalizeEmptyToUndefined('')).toBeUndefined();
    expect(normalizeEmptyToUndefined('   ')).toBeUndefined();
    expect(normalizeEmptyToUndefined(null)).toBeUndefined();
    expect(normalizeEmptyToUndefined(undefined)).toBeUndefined();
  });

  it('有内容时去掉首尾空白', () => {
    expect(normalizeEmptyToUndefined('  v ')).toBe('v');
  });
});

describe('normalizeDigits', () => {
  it('只保留数字', () => {
    expect(normalizeDigits('+86 138-0000-0000')).toBe('8613800000000');
  });
});

describe('normalize', () => {
  it('递归处理对象与数组', () => {
    expect(normalize({ name: ' a  b ', tags: [' x ', ' y '] })).toEqual({
      name: 'a b',
      tags: ['x', 'y'],
    });
  });

  it('保留非字符串原值', () => {
    expect(normalize({ n: 1, b: true, nil: null })).toEqual({ n: 1, b: true, nil: null });
  });
});
