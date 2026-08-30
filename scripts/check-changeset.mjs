#!/usr/bin/env node
/**
 * 检查「改动了 packages/* 的行为却没写 changeset」的情况。
 *
 * 只在 PR 上跑：合并到 main 之后再报错没有意义，因为那时已经晚了。
 *
 *   node scripts/check-changeset.mjs
 *
 * 退出码 0 表示通过；1 表示缺 changeset。
 */
import { execSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';

const BASE = process.env.CHANGESET_BASE_REF || 'origin/main';

function sh(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

let changed;
try {
  changed = sh(`git diff --name-only ${BASE}...HEAD`)
    .split('\n')
    .filter(Boolean);
} catch {
  console.log(`::notice::无法与 ${BASE} 比较，跳过 changeset 检查`);
  process.exit(0);
}

const touchesPackages = changed.some(
  (file) => file.startsWith('packages/') && /\.(ts|mts|cts|json)$/.test(file) && !file.includes('.test.'),
);

if (!touchesPackages) {
  console.log('本 PR 未改动 packages/*，跳过 changeset 检查');
  process.exit(0);
}

const dir = '.changeset';
const hasChangeset =
  existsSync(dir) && readdirSync(dir).some((name) => name.endsWith('.md') && name !== 'README.md');

if (!hasChangeset) {
  console.error('改动了 packages/*，但没有在 .changeset/ 里添加 changeset。');
  console.error('请运行 `bun run changeset` 并提交生成的文件。');
  process.exit(1);
}

console.log('changeset 检查通过');
