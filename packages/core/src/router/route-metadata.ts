import { HttpMethod } from '../utils/constants';

/**
 * 路由元数据
 */
export interface RouteInfo {
  method: HttpMethod;
  path: string;
  handler: string;
  controller: string;
}

/**
 * 路由元数据收集器
 */
export class RouteMetadata {
  private routes: RouteInfo[] = [];

  /**
   * 添加路由
   */
  add(route: RouteInfo): void {
    this.routes.push(route);
  }

  /**
   * 获取所有路由
   */
  getAll(): RouteInfo[] {
    return [...this.routes];
  }

  /**
   * 根据控制器获取路由
   */
  getByController(controller: string): RouteInfo[] {
    return this.routes.filter(route => route.controller === controller);
  }

  /**
   * 根据方法获取路由
   */
  getByMethod(method: HttpMethod): RouteInfo[] {
    return this.routes.filter(route => route.method === method);
  }

  /**
   * 清空路由
   */
  clear(): void {
    this.routes = [];
  }

  /**
   * 路由数量
   */
  get size(): number {
    return this.routes.length;
  }
}
