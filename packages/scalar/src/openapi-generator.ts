import 'reflect-metadata';
import type { OpenAPIV3 } from './decorators/openapi.decorators';

/**
 * OpenAPI 生成器配置
 */
export interface OpenAPIGeneratorConfig {
  /** 基础文档信息 */
  info: OpenAPIV3.InfoObject;
  /** 服务器配置 */
  servers?: OpenAPIV3.ServerObject[];
  /** 安全方案 */
  security?: OpenAPIV3.SecurityRequirementObject[];
  /** 全局标签 */
  tags?: OpenAPIV3.TagObject[];
  /** 外部文档 */
  externalDocs?: OpenAPIV3.ExternalDocumentationObject;
  /** 全局组件 */
  components?: OpenAPIV3.ComponentsObject;
}

/**
 * OpenAPI 文档生成器
 */
export class OpenAPIGenerator {
  private config: OpenAPIGeneratorConfig;
  private paths: OpenAPIV3.PathsObject = {};
  private components: OpenAPIV3.ComponentsObject = {
    schemas: {},
    responses: {},
    parameters: {},
    examples: {},
    requestBodies: {},
    headers: {},
    securitySchemes: {},
    links: {},
    callbacks: {},
  };

  constructor(config: OpenAPIGeneratorConfig) {
    this.config = config;
    if (config.components) {
      this.components = { ...this.components, ...config.components };
    }
  }

  /**
   * 从控制器类生成 OpenAPI 路径
   */
  addController(controller: any, basePath: string = ''): void {
    // console.log(`Processing controller: ${controller.name}, basePath: ${basePath}`);
    const controllerTags = Reflect.getMetadata('openapi:tags', controller) || [];
    // console.log(`Controller tags:`, controllerTags);
    
    // 获取HestJS的路由元数据（存储在控制器类上）
    const HEST_ROUTE_KEY = Symbol.for('hest:route');
    const routes = Reflect.getMetadata(HEST_ROUTE_KEY, controller) || [];
    // console.log(`Found routes:`, routes);

    for (const route of routes) {
      const { method, path, methodName } = route;
      const fullPath = this.joinPaths(basePath, path);
      // console.log(`Adding route: ${method.toUpperCase()} ${fullPath} (method: ${methodName})`);
      
      // 确保路径存在
      if (!this.paths[fullPath]) {
        this.paths[fullPath] = {};
      }

      // 生成操作对象
      const operation = this.generateOperation(controller, methodName, controllerTags);
      (this.paths[fullPath] as any)[method.toLowerCase()] = operation;
    }

    // 处理类级别的schema
    this.addSchemaFromClass(controller);
  }

  /**
   * 生成操作对象
   */
  private generateOperation(
    controller: any, 
    methodName: string, 
    defaultTags: string[]
  ): OpenAPIV3.OperationObject {
    const prototype = controller.prototype;
    
    // 基础操作信息
    const operationMetadata = Reflect.getMetadata('openapi:operation', prototype, methodName) || {};
    
    const operation: OpenAPIV3.OperationObject = {
      tags: operationMetadata.tags || defaultTags,
      summary: operationMetadata.summary,
      description: operationMetadata.description,
      operationId: operationMetadata.operationId || `${controller.name}_${methodName}`,
      responses: {},
      ...operationMetadata
    };

    // 参数
    const parameters = Reflect.getMetadata('openapi:parameters', prototype, methodName);
    if (parameters && parameters.length > 0) {
      operation.parameters = parameters;
    }

    // 请求体
    const requestBody = Reflect.getMetadata('openapi:requestBody', prototype, methodName);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    // 响应
    const responses = Reflect.getMetadata('openapi:responses', prototype, methodName);
    if (responses && Object.keys(responses).length > 0) {
      operation.responses = responses;
    } else {
      // 默认响应
      operation.responses = {
        '200': {
          description: 'Success'
        }
      };
    }

    // 安全
    const security = Reflect.getMetadata('openapi:security', prototype, methodName);
    if (security) {
      operation.security = security;
    }

    return operation;
  }

  /**
   * 从类添加 Schema
   */
  private addSchemaFromClass(target: any): void {
    const schema = Reflect.getMetadata('openapi:schema', target);
    if (schema) {
      const schemaName = target.name;
      this.components.schemas![schemaName] = schema;
    }

    // 处理属性级别的schema
    const properties = Reflect.getMetadata('openapi:properties', target);
    if (properties && Object.keys(properties).length > 0) {
      const schemaName = target.name;
      if (!this.components.schemas![schemaName]) {
        this.components.schemas![schemaName] = {
          type: 'object',
          properties: {},
        };
      }
      
      const existingSchema = this.components.schemas![schemaName] as OpenAPIV3.SchemaObject;
      if (!existingSchema.properties) {
        existingSchema.properties = {};
      }
      
      // 合并属性
      Object.assign(existingSchema.properties, properties);
      
      // 收集required字段
      const required: string[] = [];
      for (const [propName, propSchema] of Object.entries(properties)) {
        if ((propSchema as any).required === true) {
          required.push(propName);
        }
      }
      
      if (required.length > 0) {
        existingSchema.required = [...(existingSchema.required || []), ...required];
      }
    }
  }

  /**
   * 标准化路径
   */
  private normalizePath(path: string): string {
    // 将 :id 格式转换为 {id} 格式
    let normalized = path.replace(/:([^/]+)/g, '{$1}');
    
    // 移除末尾的斜杠（除非是根路径）
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  }

  /**
   * 拼接路径
   */
  private joinPaths(basePath: string, path: string): string {
    // 规范化基础路径
    basePath = basePath.replace(/\/$/, ''); // 移除末尾斜杠
    
    // 规范化路径
    if (path === '/') {
      // 如果路径是根路径，直接使用基础路径
      return basePath || '/';
    } else if (!path.startsWith('/')) {
      // 如果路径不以斜杠开头，添加斜杠
      path = '/' + path;
    }
    
    const fullPath = basePath + path;
    return this.normalizePath(fullPath);
  }

  /**
   * 添加全局组件
   */
  addComponent(type: keyof OpenAPIV3.ComponentsObject, name: string, component: any): void {
    if (!this.components[type]) {
      this.components[type] = {};
    }
    (this.components[type] as any)[name] = component;
  }

  /**
   * 生成完整的 OpenAPI 文档
   */
  generateDocument(): OpenAPIV3 {
    // 清理空的组件
    const cleanComponents: OpenAPIV3.ComponentsObject = {};
    for (const [key, value] of Object.entries(this.components)) {
      if (value && Object.keys(value).length > 0) {
        cleanComponents[key as keyof OpenAPIV3.ComponentsObject] = value;
      }
    }

    return {
      openapi: '3.0.0',
      info: this.config.info,
      servers: this.config.servers,
      paths: this.paths,
      components: Object.keys(cleanComponents).length > 0 ? cleanComponents : undefined,
      security: this.config.security,
      tags: this.config.tags,
      externalDocs: this.config.externalDocs,
    };
  }

  /**
   * 重置生成器
   */
  reset(): void {
    this.paths = {};
    this.components = {
      schemas: {},
      responses: {},
      parameters: {},
      examples: {},
      requestBodies: {},
      headers: {},
      securitySchemes: {},
      links: {},
      callbacks: {},
    };
    if (this.config.components) {
      this.components = { ...this.components, ...this.config.components };
    }
  }
}
