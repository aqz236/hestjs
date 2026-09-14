/**
 * 字符串归一化工具。
 *
 * 这些函数只做「把用户输入收敛到规范形态」这件事，不负责校验对错：
 * 归一化之后再交给装饰器或 `ValidationPipe` 判断是否合法。
 */

/**
 * 合并连续空白为单个空格并去掉首尾空白。
 */
export function normalizeWhitespace(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * 邮箱归一化：去空白 + 转小写。
 *
 * 只处理域名与本地部分的大小写，不做任何格式判断。
 */
export function normalizeEmail(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return value.trim().toLowerCase();
}

/**
 * 空串、纯空白、`null`、`undefined` 一律收敛为 `undefined`。
 *
 * 用于「可选字段但用户传了空串」的场景，避免下游把 `''` 当成有效值。
 */
export function normalizeEmptyToUndefined(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * 只保留数字字符，常用于手机号、验证码。
 */
export function normalizeDigits(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\D/g, '');
}

/**
 * 去掉首尾空白，并把连续空白压成一个空格。
 *
 * 会让所有空白字符变成普通空格，因此不适合保留换行的长文本。
 */
export function normalize(value: unknown): unknown {
  if (typeof value === 'string') {
    return normalizeWhitespace(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}
