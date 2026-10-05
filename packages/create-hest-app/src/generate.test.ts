import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import { generate, InvalidNameError, NAME_PATTERN, TargetExistsError } from './generate';

const TEMPLATE_DIR = path.join(import.meta.dir, '../templates/base');
const created: string[] = [];

async function makeTarget(name: string): Promise<string> {
  const dir = path.join(await mkdtemp(path.join(tmpdir(), 'hest-')), name);
  created.push(path.dirname(dir));
  return dir;
}

afterEach(async () => {
  for (const dir of created.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

const options = (name: string, targetDir: string) => ({
  name,
  targetDir,
  templateDir: TEMPLATE_DIR,
  tsconfigBase: '../../packages/typescript-config/base.json',
  honoVersion: '^4.13.13',
});

describe('NAME_PATTERN', () => {
  it('接受仓库治理规则允许的目录名', () => {
    for (const name of ['api', 'my-app', 'web.app', 'a1_b']) {
      expect(NAME_PATTERN.test(name)).toBe(true);
    }
  });

  it('拒绝大写、空格、前导符号', () => {
    for (const name of ['MyApp', 'my app', '-api', '_api', '']) {
      expect(NAME_PATTERN.test(name)).toBe(false);
    }
  });
});

describe('generate', () => {
  it('展开出一个可以直接跑的应用', async () => {
    const targetDir = await makeTarget('demo-app');
    const written = await generate(options('demo-app', targetDir));

    expect(written).toContain('src/main.ts');
    expect(written).toContain('src/app.module.ts');
    expect(written).toContain('package.json');
    expect(written).toContain('tsconfig.json');
  });

  it('把名字、tsconfig 路径、hono 版本都填进去', async () => {
    const targetDir = await makeTarget('demo-app');
    await generate(options('demo-app', targetDir));

    const pkg = JSON.parse(await readFile(path.join(targetDir, 'package.json'), 'utf8')) as {
      name: string;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('@hestjs/demo-app');
    expect(pkg.dependencies['@hestjs/core']).toBe('workspace:*');
    expect(pkg.dependencies.hono).toBe('^4.13.13');

    const tsconfig = await readFile(path.join(targetDir, 'tsconfig.json'), 'utf8');
    // extends 必须是相对路径：Bun 的转译器不解析包名形式的 extends，
    // 写包名会读不到 experimentalDecorators，结果一条路由都注册不上。
    expect(tsconfig).toContain('../../packages/typescript-config/base.json');
    expect(tsconfig).not.toContain('@hestjs/typescript-config');
  });

  it('模板里的 __NAME__ 不会被漏掉', async () => {
    const targetDir = await makeTarget('demo-app');
    await generate(options('demo-app', targetDir));

    const main = await readFile(path.join(targetDir, 'src/app.module.ts'), 'utf8');
    expect(main).not.toContain('__NAME__');
    expect(main).not.toContain('__TSCONFIG_BASE__');
    expect(main).not.toContain('__HONO__');
  });

  it('目录已存在时报错，不覆盖', async () => {
    const targetDir = await makeTarget('taken');
    await generate(options('taken', targetDir));
    await expect(generate(options('taken', targetDir))).rejects.toThrow(TargetExistsError);
    expect(existsSync(path.join(targetDir, 'package.json'))).toBe(true);
  });

  it('非法名字直接拒绝', async () => {
    const targetDir = await makeTarget('whatever');
    await expect(generate(options('Bad Name', targetDir))).rejects.toThrow(InvalidNameError);
  });
});
