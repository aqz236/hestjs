export const USAGE = `用法：bun run new <name> [--dir <path>] [--with-web]

在单仓里生成一个 HestJS 应用。默认落到 apps/<name>。

选项：
  --dir <path>   指定生成位置
  --with-web     同时生成 Vite 前端，并用 hc<AppType> 拿到端到端类型
  --force        目标已存在时先删掉
  -h, --help     看这段说明
`;

export interface ParsedArgs {
  readonly kind: 'run';
  readonly name: string;
  readonly dir?: string;
  readonly force: boolean;
  readonly web: boolean;
}

export type ParseResult =
  | ParsedArgs
  | { readonly kind: 'help' }
  | { readonly kind: 'error'; readonly message: string };

/**
 * 解析命令行参数。
 *
 * 单独抽出来是因为它是纯函数：不用起进程就能测，
 * 而且参数解析出错是很难在集成测试里覆盖到的地方。
 */
export function parseArgs(argv: readonly string[]): ParseResult {
  if (argv.includes('-h') || argv.includes('--help')) {
    return { kind: 'help' };
  }

  const dirIndex = argv.indexOf('--dir');
  if (dirIndex !== -1 && argv[dirIndex + 1] === undefined) {
    return { kind: 'error', message: '--dir 后面要跟一个路径' };
  }

  const consumed = new Set<number>();
  if (dirIndex !== -1) {
    consumed.add(dirIndex);
    consumed.add(dirIndex + 1);
  }

  const name = argv.find((arg, index) => !arg.startsWith('-') && !consumed.has(index));
  if (name === undefined) {
    return { kind: 'error', message: '缺少应用名' };
  }

  const extra = argv.filter(
    (arg, index) => !arg.startsWith('-') && !consumed.has(index) && arg !== name,
  );
  if (extra.length > 0) {
    return { kind: 'error', message: `多了用不上的参数：${extra.join(' ')}` };
  }

  return {
    kind: 'run',
    name,
    ...(dirIndex === -1 ? {} : { dir: argv[dirIndex + 1]! }),
    force: argv.includes('--force'),
    web: argv.includes('--with-web'),
  };
}
