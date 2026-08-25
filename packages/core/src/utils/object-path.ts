import 'reflect-metadata';

/**
 * 路径段：对象键或数组下标。
 */
export type PathSegment = string | number;

/**
 * 把 `user.profile.roles[0].name` 这样的字符串拆成路径段。
 *
 * 支持点号与方括号两种写法，方括号里可以写数字下标或带引号的键：
 *
 * ```ts
 * parsePath('user.profile.roles[0].name'); // ['user', 'profile', 'roles', 0, 'name']
 * parsePath("headers['x-trace-id']");      // ['headers', 'x-trace-id']
 * ```
 */
export function parsePath(path: string): PathSegment[] {
  if (typeof path !== 'string' || path.length === 0) {
    return [];
  }

  const segments: PathSegment[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.length > 0) {
      segments.push(buffer);
      buffer = '';
    }
  };

  for (let i = 0; i < path.length; i += 1) {
    const char = path[i];

    if (char === '.') {
      flush();
      continue;
    }

    if (char === '[') {
      flush();
      const end = path.indexOf(']', i);
      if (end === -1) {
        // 没有闭合的方括号，剩下的原样作为键
        buffer += path.slice(i);
        break;
      }
      const raw = path.slice(i + 1, end).trim();
      const key = raw.replace(/^['"]|['"]$/g, '');
      if (/^\d+$/.test(key)) {
        segments.push(Number(key));
      } else if (key.length > 0) {
        segments.push(key);
      }
      i = end;
      continue;
    }

    buffer += char;
  }

  flush();
  return segments;
}

/**
 * 按路径读取值，任意一段不存在时返回 `undefined`。
 */
export function getByPath(source: unknown, path: string | PathSegment[]): unknown {
  const segments = Array.isArray(path) ? path : parsePath(path);
  let current: any = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object' && typeof current !== 'function') {
      return undefined;
    }
    current = current[segment as any];
  }

  return current;
}

/**
 * 按路径判断值是否存在（`undefined` 视为不存在）。
 */
export function hasByPath(source: unknown, path: string | PathSegment[]): boolean {
  const segments = Array.isArray(path) ? path : parsePath(path);
  if (segments.length === 0) {
    return false;
  }
  return getByPath(source, segments) !== undefined;
}

/**
 * 按路径写入值，中间缺失的层级会自动创建。
 *
 * 下一段是数字时创建数组，否则创建普通对象。
 */
export function setByPath(target: unknown, path: string | PathSegment[], value: unknown): unknown {
  const segments = Array.isArray(path) ? path : parsePath(path);
  if (segments.length === 0) {
    return target;
  }

  let current: any = target;
  if (current === null || current === undefined || typeof current !== 'object') {
    current = typeof segments[0] === 'number' ? [] : {};
  }

  const root = current;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const next = segments[i + 1];

    if (current[segment as any] === null || typeof current[segment as any] !== 'object') {
      current[segment as any] = typeof next === 'number' ? [] : {};
    }
    current = current[segment as any];
  }

  current[segments[segments.length - 1] as any] = value;
  return root;
}

/**
 * 按路径删除值，返回是否真的删掉了。
 */
export function deleteByPath(target: unknown, path: string | PathSegment[]): boolean {
  const segments = Array.isArray(path) ? path : parsePath(path);
  if (segments.length === 0 || target === null || typeof target !== 'object') {
    return false;
  }

  let current: any = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    current = current?.[segments[i] as any];
    if (current === null || typeof current !== 'object') {
      return false;
    }
  }

  const last = segments[segments.length - 1] as any;
  if (current === null || typeof current !== 'object' || !(last in current)) {
    return false;
  }

  if (Array.isArray(current) && typeof last === 'number') {
    current.splice(last, 1);
  } else {
    delete current[last];
  }
  return true;
}
