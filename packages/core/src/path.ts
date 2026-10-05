/** 统一路径写法：永远以 / 开头，不以 / 结尾，空串表示为 ''。 */
export function normalizePath(path: string): string {
  const trimmed = path.trim().replace(/\/+/g, '/');
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

export function joinPath(...parts: readonly string[]): string {
  const joined = parts.map(normalizePath).filter((part) => part !== '').join('');
  return joined === '' ? '/' : joined;
}
