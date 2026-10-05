/**
 * 装饰器把元数据写在这几个 symbol 上，直接挂在类自己身上。
 *
 * 刻意不用全局注册表：元数据跟着类走，你可以随时读出来看，
 * 没有藏在别处的东西。用 Symbol.for 是为了重复加载模块时仍是同一把钥匙。
 */
export const MODULE_META = Symbol.for('hestjs:module');
export const INJECT_META = Symbol.for('hestjs:inject');
export const INJECTABLE_META = Symbol.for('hestjs:injectable');
export const ROUTE_META = Symbol.for('hestjs:route');
