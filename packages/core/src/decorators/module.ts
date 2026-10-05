import { defineModule } from '../metadata';
import type { Constructor, ModuleMetadata } from '../types';

/**
 * 声明一个模块。只登记元数据，不做任何执行。
 *
 * ```ts
 * @Module({
 *   imports: [DatabaseModule],
 *   providers: [UserService, UserController],
 *   exports: [UserService],
 * })
 * class UserModule {}
 * ```
 *
 * 控制器不是特殊东西：它就是普通的 provider，方法接受 Hono 的 Context。
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target) => {
    defineModule(target as unknown as Constructor, metadata);
  };
}
