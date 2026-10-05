import { defineModule, type ModuleMetadata } from '../metadata';
import type { Constructor } from '../types';

/**
 * 声明一个模块。只登记元数据，不做任何执行。
 *
 * `imports` 只表达依赖关系：被导入模块的 providers 会一起并入同一个容器。
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target) => {
    defineModule(target as unknown as Constructor, metadata);
  };
}
