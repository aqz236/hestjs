/**
 * 装饰器把元数据写在这几个 symbol 上，直接挂在类和原型自己身上。
 *
 * 刻意不用全局注册表：元数据跟着类走，你可以随时
 * `SomeController[ROUTES_META]` 把表读出来看，没有藏在别处的东西。
 * 用 Symbol.for 是为了在重复加载模块时仍然是同一把钥匙。
 */
export const MODULE_META = Symbol.for('hestjs:module');
export const CONTROLLER_META = Symbol.for('hestjs:controller');
export const ROUTES_META = Symbol.for('hestjs:routes');
export const INJECTABLE_META = Symbol.for('hestjs:injectable');
export const MIDDLEWARE_META = Symbol.for('hestjs:middlewares');
