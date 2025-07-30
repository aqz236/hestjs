import 'reflect-metadata';
import { METADATA_KEYS } from '../utils/constants';
import type { 
  ControllerMetadata, 
  RouteMetadata, 
  ModuleMetadata, 
  ParameterMetadata,
  InjectableMetadata 
} from '../interfaces/metadata';

// 声明 Reflect 扩展
declare global {
  namespace Reflect {
    function getMetadata(key: any, target: any, propertyKey?: string | symbol): any;
    function hasMetadata(key: any, target: any, propertyKey?: string | symbol): boolean;
    function getMetadataKeys(target: any, propertyKey?: string | symbol): any[];
  }
}

/**
 * 元数据扫描器
 */
export class MetadataScanner {
  /**
   * 扫描控制器元数据
   */
  static scanController(target: any): ControllerMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.CONTROLLER, target);
  }

  /**
   * 扫描路由元数据
   */
  static scanRoutes(target: any): RouteMetadata[] {
    return Reflect.getMetadata(METADATA_KEYS.ROUTE, target) || [];
  }

  /**
   * 扫描模块元数据
   */
  static scanModule(target: any): ModuleMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.MODULE, target);
  }

  /**
   * 扫描可注入元数据
   */
  static scanInjectable(target: any): InjectableMetadata | undefined {
    return Reflect.getMetadata(METADATA_KEYS.INJECTABLE, target);
  }

  /**
   * 扫描方法参数元数据
   */
  static scanParameters(target: any, methodName: string): ParameterMetadata[] {
    const paramKey = `${METADATA_KEYS.PARAM.toString()}_${methodName}`;
    return Reflect.getMetadata(paramKey, target) || [];
  }

  /**
   * 获取构造函数参数类型
   */
  static getConstructorParameters(target: any): any[] {
    return Reflect.getMetadata('design:paramtypes', target) || [];
  }

  /**
   * 获取方法参数类型
   */
  static getMethodParameters(target: any, methodName: string): any[] {
    return Reflect.getMetadata('design:paramtypes', target.prototype, methodName) || [];
  }

  /**
   * 检查是否为控制器
   */
  static isController(target: any): boolean {
    return Reflect.hasMetadata(METADATA_KEYS.CONTROLLER, target);
  }

  /**
   * 检查是否为模块
   */
  static isModule(target: any): boolean {
    return Reflect.hasMetadata(METADATA_KEYS.MODULE, target);
  }

  /**
   * 检查是否可注入
   */
  static isInjectable(target: any): boolean {
    return Reflect.hasMetadata(METADATA_KEYS.INJECTABLE, target);
  }

  /**
   * 获取所有元数据键
   */
  static getAllMetadataKeys(target: any, propertyKey?: string | symbol): any[] {
    return Reflect.getMetadataKeys(target, propertyKey);
  }
}
