import "reflect-metadata";
import { injectable } from "tsyringe";
import type { ControllerMetadata } from "../interfaces/metadata";
import { METADATA_KEYS } from "../utils/constants";

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function defineMetadata(
      key: any,
      value: any,
      target: any,
      propertyKey?: string | symbol
    ): void;
    function hasMetadata(
      key: any,
      target: any,
      propertyKey?: string | symbol
    ): boolean;
    function getMetadata(
      key: any,
      target: any,
      propertyKey?: string | symbol
    ): any;
  }
}

/**
 * 控制器装饰器
 * @param path 控制器路径前缀
 */
export function Controller(path = ""): ClassDecorator {
  return (target: any) => {
    const metadata: ControllerMetadata = {
      path: path.startsWith("/") ? path : `/${path}`,
    };

    Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, metadata, target);

    // 确保类可以被注入
    if (!Reflect.hasMetadata(METADATA_KEYS.INJECTABLE, target)) {
      Reflect.defineMetadata(
        METADATA_KEYS.INJECTABLE,
        { scope: "singleton" },
        target
      );
    }

    // 自动应用 TSyringe 的 injectable 装饰器
    injectable()(target);

    return target;
  };
}
