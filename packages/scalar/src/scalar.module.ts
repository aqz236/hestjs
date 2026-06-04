import { Module } from '@hestjs/core';

/**
 * Scalar 模块
 * 
 * 这个模块可以在 HestJS 应用中导入，提供 Scalar API 文档功能
 */
@Module({
  providers: [],
  exports: [],
})
export class ScalarModule {
  /**
   * 静态方法：配置 Scalar 模块
   * 
   * @param config Scalar 配置选项
   * @returns 配置后的模块
   */
  static forRoot(config: any): any {
    // 这里可以根据需要扩展，目前主要通过中间件使用
    return {
      module: ScalarModule,
      providers: [
        {
          provide: 'SCALAR_CONFIG',
          useValue: config,
        },
      ],
      exports: ['SCALAR_CONFIG'],
    };
  }
}
