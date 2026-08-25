import { OpenAPIGenerator } from '../openapi-generator';
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
  // key 必须与 @ApiProperty 的写入一致（'openapi:properties'）。
  // 早先读的是重构前的 'api:properties'，没有任何装饰器写它，函数恒返回空 schema。
  const properties = Reflect.getMetadata('openapi:properties', target) || {};
  const schema: any = {
    type: 'object',
    properties: {},
  };

  const required: string[] = [];

  for (const [propertyKey, metadata] of Object.entries(properties)) {
    const propMetadata = metadata as any;

    // @ApiProperty 存进来的本就是一个 OpenAPI SchemaObject，
    // 直接透传即可。早先这里用 getTypeString() 把它当成构造函数再推导一次，
    // 而 SchemaObject.type 是字符串（'string'/'number'），推导结果恒为 'object'，
    // 导致所有属性类型都错。
    const { required: isRequired, ...rest } = propMetadata;
    schema.properties[propertyKey] = { ...rest };

    if (propMetadata.enum) {
      schema.properties[propertyKey].enum = propMetadata.enum;
    }

    if (isRequired) {
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
 *
 * 直接委托给 OpenAPIGenerator，避免重复实现一套元数据读取逻辑。
 * 原实现读取的是重构前的 'api:*' 与 'route' 键，与装饰器写入的
 * 'openapi:*' 以及 core 的路由元数据完全对不上，实际恒返回空对象。
 */
export function generatePathsFromController(
  controller: any,
  basePath?: string
): object {
  // 未显式传入时读取 @Controller 的路径，与 setupScalarWithControllers 一致
  const resolvedBasePath =
    basePath ??
    Reflect.getMetadata(Symbol.for('hest:controller'), controller)?.path ??
    '';

  const generator = new OpenAPIGenerator({
    info: { title: 'Generated API', version: '0.0.0' },
  });

  generator.addController(controller, resolvedBasePath);

  return (generator.generateDocument() as any).paths ?? {};
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
