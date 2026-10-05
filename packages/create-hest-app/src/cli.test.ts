import { describe, expect, it } from 'bun:test';
import { parseArgs } from './cli';

describe('parseArgs', () => {
  it('只给名字', () => {
    expect(parseArgs(['api'])).toEqual({ kind: 'run', name: 'api', force: false, web: false });
  });

  it('名字 + 选项', () => {
    expect(parseArgs(['api', '--force'])).toEqual({
      kind: 'run',
      name: 'api',
      force: true,
      web: false,
    });
  });

  it('--dir 后面那一段不会被当成名字', () => {
    expect(parseArgs(['api', '--dir', 'apps/nested'])).toEqual({
      kind: 'run',
      name: 'api',
      dir: 'apps/nested',
      force: false,
      web: false,
    });
  });

  it('--dir 在前也一样', () => {
    expect(parseArgs(['--dir', 'apps/nested', 'api'])).toEqual({
      kind: 'run',
      name: 'api',
      dir: 'apps/nested',
      force: false,
      web: false,
    });
  });

  it('缺名字时报错', () => {
    expect(parseArgs([]).kind).toBe('error');
    expect(parseArgs(['--force']).kind).toBe('error');
  });

  it('--dir 缺值时报错', () => {
    expect(parseArgs(['api', '--dir']).kind).toBe('error');
  });

  it('多写一个位置参数时报错，而不是悄悄忽略', () => {
    const result = parseArgs(['api', 'extra']);
    expect(result.kind).toBe('error');
  });

  it('--with-web 会被识别', () => {
    expect(parseArgs(['api', '--with-web'])).toEqual({
      kind: 'run',
      name: 'api',
      force: false,
      web: true,
    });
  });

  it('-h / --help 优先', () => {
    expect(parseArgs(['-h']).kind).toBe('help');
    expect(parseArgs(['--help', 'api']).kind).toBe('help');
  });
});
