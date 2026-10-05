#!/usr/bin/env bun
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, USAGE } from './cli';
import { generate, InvalidNameError, TargetExistsError } from './generate';

/** <repo>/packages/create-hest-app/src/index.ts → <repo> */
function repoRoot(): string {
  return path.resolve(import.meta.dir, '../../..');
}

async function honoVersion(root: string): Promise<string> {
  const core = (await Bun.file(path.join(root, 'packages/core/package.json')).json()) as {
    peerDependencies?: Record<string, string>;
  };
  return core.peerDependencies?.hono ?? '^4.13.13';
}

async function main(): Promise<number> {
  const parsed = parseArgs(Bun.argv.slice(2));

  if (parsed.kind === 'help') {
    console.log(USAGE);
    return 0;
  }
  if (parsed.kind === 'error') {
    console.error(`${parsed.message}\n`);
    console.error(USAGE);
    return 1;
  }

  const root = repoRoot();
  const targetDir =
    parsed.dir === undefined
      ? path.join(root, 'apps', parsed.name)
      : path.resolve(root, parsed.dir);

  if (parsed.force) {
    await rm(targetDir, { recursive: true, force: true });
  }

  try {
    const written = await generate({
      name: parsed.name,
      targetDir,
      templateDir: path.join(import.meta.dir, '../templates/base'),
      tsconfigBase: path.relative(targetDir, path.join(root, 'packages/typescript-config/base.json')),
      honoVersion: await honoVersion(root),
    });

    console.log(`已生成 ${path.relative(root, targetDir)}：`);
    for (const file of written) {
      console.log(`  ${file}`);
    }
    console.log('\n下一步：');
    console.log('  bun install');
    console.log(`  bun run --filter @hestjs/${parsed.name} dev`);
    return 0;
  } catch (error) {
    if (error instanceof InvalidNameError || error instanceof TargetExistsError) {
      console.error(error.message);
      return 1;
    }
    throw error;
  }
}

process.exit(await main());
