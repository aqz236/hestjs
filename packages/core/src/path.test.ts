import { describe, expect, it } from 'bun:test';
import { joinPath, normalizePath } from './path';

describe('normalizePath', () => {
  it('统一成前导斜杠、无尾斜杠', () => {
    expect(normalizePath('users')).toBe('/users');
    expect(normalizePath('/users/')).toBe('/users');
    expect(normalizePath('//users//1//')).toBe('/users/1');
  });

  it('空串与根都归一为 ""', () => {
    expect(normalizePath('')).toBe('');
    expect(normalizePath('/')).toBe('');
  });
});

describe('joinPath', () => {
  it('拼接前缀与相对路径', () => {
    expect(joinPath('/users', '/:id')).toBe('/users/:id');
    expect(joinPath('/api/v1', '/users', '/')).toBe('/api/v1/users');
  });

  it('全空时给根路径', () => {
    expect(joinPath('', '')).toBe('/');
  });
});
