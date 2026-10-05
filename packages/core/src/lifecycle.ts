/**
 * provider 的启动与关闭钩子。
 *
 * 刻意只有这两个：模块是纯声明，生命周期属于「有资源的东西」，
 * 也就是那些真的持有连接、定时器、缓存的 provider。
 */
export interface OnStart {
  onStart(): void | Promise<void>;
}

export interface OnStop {
  onStop(): void | Promise<void>;
}

export function hasOnStart(value: unknown): value is OnStart {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<OnStart>).onStart === 'function'
  );
}

export function hasOnStop(value: unknown): value is OnStop {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<OnStop>).onStop === 'function'
  );
}
