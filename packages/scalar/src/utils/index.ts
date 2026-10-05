/**
 * 生成基础 OpenAPI 文档结构
 */
export function generateBaseOpenApiSpec(config: {
  title: string;
  version: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
}): object {
  return {
    openapi: '3.0.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description || `${config.title} API Documentation`,
    },
    servers: config.servers || [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
      responses: {},
      parameters: {},
      securitySchemes: {},
    },
  };
}

/**
 * 从类元数据生成 OpenAPI schema
 */
export function generateSchemaFromClass(target: any): object {
  const properties = Reflect.getMetadata('api:properties', target) || {};
  const schema: any = {
    type: 'object',
    properties: {},
  };

  const required: string[] = [];

  for (const [propertyKey, metadata] of Object.entries(properties)) {
    const propMetadata = metadata as any;
    schema.properties[propertyKey] = {
      type: getTypeString(propMetadata.type),
      description: propMetadata.description,
      example: propMetadata.example,
    };

    if (propMetadata.enum) {
      schema.properties[propertyKey].enum = propMetadata.enum;
    }

    if (propMetadata.required) {
      required.push(propertyKey);
    }
  }

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * 从控制器生成 OpenAPI 路径
 */
export function generatePathsFromController(controller: any, basePath: string = ''): object {
  const paths: any = {};
  const controllerTags = Reflect.getMetadata('api:tags', controller) || [];
  
  // 获取控制器的所有方法
  const prototype = controller.prototype;
  const methodNames = Object.getOwnPropertyNames(prototype).filter(
    name => name !== 'constructor' && typeof prototype[name] === 'function'
  );

  for (const methodName of methodNames) {
    const routeMetadata = Reflect.getMetadata('route', prototype, methodName);
    if (!routeMetadata) continue;

    const { method, path } = routeMetadata;
    const fullPath = `${basePath}${path}`;
    
    if (!paths[fullPath]) {
      paths[fullPath] = {};
    }

    const operation = generateOperationFromMethod(controller, methodName, controllerTags);
    paths[fullPath][method.toLowerCase()] = operation;
  }

  return paths;
}

/**
 * 从方法生成 OpenAPI 操作
 */
function generateOperationFromMethod(controller: any, methodName: string, tags: string[]): object {
  const prototype = controller.prototype;
  const operation: any = {
    tags,
  };

  // 获取操作元数据
  const operationMetadata = Reflect.getMetadata('api:operation', prototype, methodName);
  if (operationMetadata) {
    operation.summary = operationMetadata.summary;
    operation.description = operationMetadata.description;
    operation.operationId = operationMetadata.operationId || `${controller.name}_${methodName}`;
  }

  // 获取参数元数据
  const parametersMetadata = Reflect.getMetadata('api:parameters', controller) || {};
  if (parametersMetadata[methodName]) {
    operation.parameters = parametersMetadata[methodName].map((param: any) => ({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required || param.in === 'path',
      schema: {
        type: getTypeString(param.type),
        example: param.example,
      },
    }));
  }

  // 获取请求体元数据
  const bodyMetadata = Reflect.getMetadata('api:body', prototype, methodName);
  if (bodyMetadata) {
    operation.requestBody = {
      description: bodyMetadata.description,
      required: bodyMetadata.required,
      content: {
        'application/json': {
          schema: bodyMetadata.type ? generateSchemaFromClass(bodyMetadata.type) : {},
        },
      },
    };
  }

  // 获取响应元数据
  const responsesMetadata = Reflect.getMetadata('api:responses', controller) || {};
  if (responsesMetadata[methodName]) {
    operation.responses = {};
    for (const response of responsesMetadata[methodName]) {
      operation.responses[response.status] = {
        description: response.description,
        content: response.type ? {
          'application/json': {
            schema: response.schema || generateSchemaFromClass(response.type),
          },
        } : undefined,
      };
    }
  } else {
    // 默认响应
    operation.responses = {
      200: {
        description: 'Success',
      },
    };
  }

  return operation;
}

/**
 * 获取类型字符串
 */
function getTypeString(type: any): string {
  if (!type) return 'string';
  
  if (type === String) return 'string';
  if (type === Number) return 'number';
  if (type === Boolean) return 'boolean';
  if (type === Date) return 'string';
  if (Array.isArray(type)) return 'array';
  
  return 'object';
}

/**
 * 合并多个 OpenAPI 文档
 */
export function mergeOpenApiSpecs(...specs: object[]): object {
  const merged: any = {
    openapi: '3.0.0',
    info: {},
    servers: [],
    paths: {},
    components: {
      schemas: {},
      responses: {},
      parameters: {},
      securitySchemes: {},
    },
  };

  for (const spec of specs) {
    const specObj = spec as any;
    
    // 合并基本信息（使用第一个非空的）
    if (specObj.info && !merged.info.title) {
      merged.info = { ...specObj.info };
    }
    
    // 合并服务器
    if (specObj.servers) {
      merged.servers.push(...specObj.servers);
    }
    
    // 合并路径
    if (specObj.paths) {
      Object.assign(merged.paths, specObj.paths);
    }
    
    // 合并组件
    if (specObj.components) {
      if (specObj.components.schemas) {
        Object.assign(merged.components.schemas, specObj.components.schemas);
      }
      if (specObj.components.responses) {
        Object.assign(merged.components.responses, specObj.components.responses);
      }
      if (specObj.components.parameters) {
        Object.assign(merged.components.parameters, specObj.components.parameters);
      }
      if (specObj.components.securitySchemes) {
        Object.assign(merged.components.securitySchemes, specObj.components.securitySchemes);
      }
    }
  }

  return merged;
}
