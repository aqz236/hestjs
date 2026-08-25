import { describe, expect, it } from 'vitest';
import { deleteByPath, getByPath, hasByPath, parsePath, setByPath } from './object-path';

describe('parsePath', () => {
  it('拆分点号路径', () => {
    expect(parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('支持下标与引号键', () => {
    expect(parsePath('user.roles[0].name')).toEqual(['user', 'roles', 0, 'name']);
    expect(parsePath("headers['x-trace-id']")).toEqual(['headers', 'x-trace-id']);
  });

  it('忽略多余的点号与空串', () => {
    expect(parsePath('a..b')).toEqual(['a', 'b']);
    expect(parsePath('')).toEqual([]);
  });

  it('未闭合的方括号原样保留', () => {
    expect(parsePath('a[b')).toEqual(['a', '[b']);
  });
});

describe('getByPath', () => {
  const source = { user: { name: 'aqz', roles: ['admin', 'dev'] } };

  it('读取嵌套值与数组元素', () => {
    expect(getByPath(source, 'user.name')).toBe('aqz');
    expect(getByPath(source, 'user.roles[1]')).toBe('dev');
  });

  it('路径不存在时返回 undefined', () => {
    expect(getByPath(source, 'user.missing.deep')).toBeUndefined();
    expect(getByPath(null, 'user.name')).toBeUndefined();
    expect(getByPath(source, 'user.name.first')).toBeUndefined();
  });
});

describe('hasByPath', () => {
  it('区分存在与不存在', () => {
    expect(hasByPath({ a: { b: 1 } }, 'a.b')).toBe(true);
    expect(hasByPath({ a: { b: 1 } }, 'a.c')).toBe(false);
    expect(hasByPath({ a: undefined }, 'a')).toBe(false);
    expect(hasByPath({}, '')).toBe(false);
  });
});

describe('setByPath', () => {
  it('写入已存在的层级', () => {
    const target = { a: { b: 1 } };
    setByPath(target, 'a.b', 2);
    expect(target.a.b).toBe(2);
  });

  it('自动补齐中间层级', () => {
    const target: any = {};
    setByPath(target, 'a.b[0].c', 'v');
    expect(target).toEqual({ a: { b: [{ c: 'v' }] } });
  });

  it('target 为空时返回新建的根', () => {
    const created = setByPath(undefined, 'a.b', 1) as any;
    expect(created).toEqual({ a: { b: 1 } });
  });
});

describe('deleteByPath', () => {
  it('删除对象键', () => {
    const target = { a: { b: 1 } };
    expect(deleteByPath(target, 'a.b')).toBe(true);
    expect(target).toEqual({ a: {} });
  });

  it('删除数组元素并压缩下标', () => {
    const target = { list: ['a', 'b', 'c'] };
    expect(deleteByPath(target, 'list[1]')).toBe(true);
    expect(target.list).toEqual(['a', 'c']);
  });

  it('路径不存在时返回 false', () => {
    expect(deleteByPath({ a: 1 }, 'b.c')).toBe(false);
    expect(deleteByPath(null, 'a')).toBe(false);
  });
});
