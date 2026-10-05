import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** 与仓库治理规则一致：小写字母数字开头，允许 . _ - */
export const NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export class InvalidNameError extends Error {
  constructor(name: string) {
    super(
      `"${name}" 不是合法的目录名。\n` +
        `要求：小写字母或数字开头，只含小写字母、数字、. _ -`,
    );
    this.name = 'InvalidNameError';
  }
}

export class TargetExistsError extends Error {
  constructor(target: string) {
    super(`${target} 已经存在。换个名字，或者先把它删掉。`);
    this.name = 'TargetExistsError';
  }
}

export class TemplateMissingError extends Error {
  constructor(templateDir: string) {
    super(`找不到模板目录：${templateDir}`);
    this.name = 'TemplateMissingError';
  }
}

export interface GenerateOptions {
  /** 应用名，同时决定目录名。 */
  readonly name: string;
  /** 生成到哪。应当是 <repo>/apps/<name>。 */
  readonly targetDir: string;
  /** 模板目录。 */
  readonly templateDir: string;
  /** 从 targetDir 指向共享 tsconfig 的相对路径。 */
  readonly tsconfigBase: string;
  /** 写进模板的 hono 版本。 */
  readonly honoVersion: string;
}

async function walk(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(dir, entry.name), relative)));
    } else {
      files.push(relative);
    }
  }
  return files;
}

function render(source: string, options: GenerateOptions): string {
  return source
    .replaceAll('__NAME__', options.name)
    .replaceAll('__TSCONFIG_BASE__', options.tsconfigBase)
    .replaceAll('__HONO__', options.honoVersion);
}

/**
 * 把模板展开成一个可运行的应用。
 *
 * 刻意保持极简：模板里就是真实文件，不是字符串拼接，
 * 生成的目录里也只有 3 个源文件 + package.json + tsconfig。
 */
export async function generate(options: GenerateOptions): Promise<string[]> {
  if (!NAME_PATTERN.test(options.name)) {
    throw new InvalidNameError(options.name);
  }
  if (!existsSync(options.templateDir)) {
    throw new TemplateMissingError(options.templateDir);
  }
  if (existsSync(options.targetDir)) {
    throw new TargetExistsError(options.targetDir);
  }

  const templateFiles = await walk(options.templateDir);
  if (templateFiles.length === 0) {
    throw new TemplateMissingError(options.templateDir);
  }

  const written: string[] = [];
  for (const relative of templateFiles) {
    const source = await readFile(path.join(options.templateDir, relative), 'utf8');
    const output = relative.replace(/\.tmpl$/, '');
    const destination = path.join(options.targetDir, output);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, render(source, options));
    written.push(output);
  }

  return written.sort();
}
