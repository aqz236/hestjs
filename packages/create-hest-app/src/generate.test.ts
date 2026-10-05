import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'bun:test';
import {
  generate,
  InvalidNameError,
  mergeManifest,
  NAME_PATTERN,
  overlay,
  TargetExistsError,
} from './generate';

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

// ─────────────────────────────────────────────────────────────
// --with-web 的覆盖层
// ─────────────────────────────────────────────────────────────

const WEB_TEMPLATE_DIR = path.join(import.meta.dir, '../templates/web');

describe('overlay', () => {
  const shared = (name: string, targetDir: string) => ({
    name,
    targetDir,
    templateDir: WEB_TEMPLATE_DIR,
    tsconfigBase: '../../packages/typescript-config/base.json',
    honoVersion: '^4.13.13',
  });

  it('叠在基础模板之上，同名文件覆盖', async () => {
    const targetDir = await makeTarget('web-app');
    await generate(options('web-app', targetDir));
    const written = await overlay(shared('web-app', targetDir));

    expect(written).toContain('vite.config.ts');
    expect(written).toContain('tsconfig.web.json');
    expect(written).toContain('src/web/index.html');
    expect(written).toContain('src/web/main.ts');
    expect(written).toContain('scripts/dev.ts');
  });

  it('清单文件不会被复制进目标目录', async () => {
    const targetDir = await makeTarget('web-app');
    await generate(options('web-app', targetDir));
    const written = await overlay(shared('web-app', targetDir));

    expect(written).not.toContain('overlay.json');
    expect(existsSync(path.join(targetDir, 'overlay.json'))).toBe(false);
  });

  it('服务端 tsconfig 排除 src/web（否则 DOM lib 会打架）', async () => {
    const targetDir = await makeTarget('web-app');
    await generate(options('web-app', targetDir));
    await overlay(shared('web-app', targetDir));

    const tsconfig = JSON.parse(
      (await readFile(path.join(targetDir, 'tsconfig.json'), 'utf8'))
        .replace(/\/\/.*$/gm, '')
        .replace(/,(?=\s*[}\]])/g, ''),
    ) as { exclude: string[] };
    expect(tsconfig.exclude).toContain('src/web');
  });

  it('前端 tsconfig 继承同一份预设（需要 experimentalDecorators）', async () => {
    const targetDir = await makeTarget('web-app');
    await generate(options('web-app', targetDir));
    await overlay(shared('web-app', targetDir));

    const web = await readFile(path.join(targetDir, 'tsconfig.web.json'), 'utf8');
    expect(web).toContain('../../packages/typescript-config/base.json');
    expect(web).toContain('DOM');
  });
});

describe('mergeManifest', () => {
  it('合并 scripts 与 devDependencies', async () => {
    const targetDir = await makeTarget('web-app');
    await generate(options('web-app', targetDir));
    await overlay({
      name: 'web-app',
      targetDir,
      templateDir: WEB_TEMPLATE_DIR,
      tsconfigBase: '../../packages/typescript-config/base.json',
      honoVersion: '^4.13.13',
    });
    await mergeManifest(
      path.join(targetDir, 'package.json'),
      path.join(WEB_TEMPLATE_DIR, 'overlay.json'),
    );

    const pkg = JSON.parse(await readFile(path.join(targetDir, 'package.json'), 'utf8')) as {
      name: string;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    // 基础模板的东西还在
    expect(pkg.name).toBe('@hestjs/web-app');
    expect(pkg.dependencies['@hestjs/core']).toBe('workspace:*');
    expect(pkg.scripts.test).toBe('bun test');

    // 覆盖层加的东西也在
    expect(pkg.devDependencies.vite).toMatch(/^\^?\d/);
    expect(pkg.scripts.build).toBe('vite build');
    expect(pkg.scripts['check-types']).toContain('tsconfig.web.json');
  });
});
