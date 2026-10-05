/**
 * 一条命令同时起 API 与前端。
 *
 * 不用 concurrently：Bun.spawn 就够了，少一个依赖。
 */
const targets = [
  ['api', ['bun', 'run', '--watch', 'src/main.ts']],
  ['web', ['bun', 'run', 'vite']],
] as const;

const children = targets.map(([name, command]) => {
  const child = Bun.spawn(command as unknown as string[], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, HESTJS_PROCESS: name },
  });
  return child;
});

const shutdown = (): void => {
  for (const child of children) {
    child.kill();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await Promise.all(children.map((child) => child.exited));
