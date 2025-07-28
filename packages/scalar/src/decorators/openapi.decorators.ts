import 'reflect-metadata';

// OpenAPI 3.0 标准类型
export type OpenAPIV3 = {
  openapi: string;
  info: OpenAPIV3.InfoObject;
  servers?: OpenAPIV3.ServerObject[];
  paths: OpenAPIV3.PathsObject;
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
  tags?: OpenAPIV3.TagObject[];
  externalDocs?: OpenAPIV3.ExternalDocumentationObject;
};

export namespace OpenAPIV3 {
  export interface InfoObject {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    version: string;
  }

  export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
  }

  export interface LicenseObject {
    name: string;
    url?: string;
  }

  export interface ServerObject {
    url: string;
    description?: string;
    variables?: Record<string, ServerVariableObject>;
  }

  export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
  }

  export interface PathsObject {
    [pattern: string]: PathItemObject | undefined;
  }

  export interface PathItemObject {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    servers?: ServerObject[];
    parameters?: (ReferenceObject | ParameterObject)[];
  }

  export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ReferenceObject | ParameterObject)[];
    requestBody?: ReferenceObject | RequestBodyObject;
    responses: ResponsesObject;
    callbacks?: Record<string, ReferenceObject | CallbackObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
  }

  export interface ParameterObject {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: ReferenceObject | SchemaObject;
    example?: any;
    examples?: Record<string, ReferenceObject | ExampleObject>;
    content?: Record<string, MediaTypeObject>;
  }

  export interface RequestBodyObject {
    description?: string;
    content: Record<string, MediaTypeObject>;
    required?: boolean;
  }

  export interface ResponsesObject {
    [code: string]: ReferenceObject | ResponseObject;
  }

  export interface ResponseObject {
    description: string;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    content?: Record<string, MediaTypeObject>;
    links?: Record<string, ReferenceObject | LinkObject>;
  }

  export interface MediaTypeObject {
    schema?: ReferenceObject | SchemaObject;
    example?: any;
    examples?: Record<string, ReferenceObject | ExampleObject>;
    encoding?: Record<string, EncodingObject>;
  }

  export interface SchemaObject {
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean;
    minimum?: number;
    exclusiveMinimum?: boolean;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    type?: string;
    allOf?: (ReferenceObject | SchemaObject)[];
    oneOf?: (ReferenceObject | SchemaObject)[];
    anyOf?: (ReferenceObject | SchemaObject)[];
    not?: ReferenceObject | SchemaObject;
    items?: ReferenceObject | SchemaObject;
    properties?: Record<string, ReferenceObject | SchemaObject>;
    additionalProperties?: boolean | ReferenceObject | SchemaObject;
    description?: string;
    format?: string;
    default?: any;
    nullable?: boolean;
    discriminator?: DiscriminatorObject;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    deprecated?: boolean;
  }

  export interface ComponentsObject {
    schemas?: Record<string, ReferenceObject | SchemaObject>;
    responses?: Record<string, ReferenceObject | ResponseObject>;
    parameters?: Record<string, ReferenceObject | ParameterObject>;
    examples?: Record<string, ReferenceObject | ExampleObject>;
    requestBodies?: Record<string, ReferenceObject | RequestBodyObject>;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    securitySchemes?: Record<string, ReferenceObject | SecuritySchemeObject>;
    links?: Record<string, ReferenceObject | LinkObject>;
    callbacks?: Record<string, ReferenceObject | CallbackObject>;
  }

  export interface ReferenceObject {
    $ref: string;
  }

  export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
  }

  export interface HeaderObject extends Omit<ParameterObject, 'name' | 'in'> {}

  export interface TagObject {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
  }

  export interface ExternalDocumentationObject {
    description?: string;
    url: string;
  }

  export interface SecurityRequirementObject {
    [name: string]: string[];
  }

  export interface SecuritySchemeObject {
    type: string;
    description?: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    flows?: OAuthFlowsObject;
    openIdConnectUrl?: string;
  }

  export interface OAuthFlowsObject {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
  }

  export interface OAuthFlowObject {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    scopes: Record<string, string>;
  }

  export interface DiscriminatorObject {
    propertyName: string;
    mapping?: Record<string, string>;
  }

  export interface XMLObject {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  }

  export interface EncodingObject {
    contentType?: string;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
  }

  export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: Record<string, any>;
    requestBody?: any;
    description?: string;
    server?: ServerObject;
  }

  export interface CallbackObject {
    [expression: string]: PathItemObject;
  }
}

/**
 * OpenAPI Tags 装饰器 - OpenAPI 标准
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('openapi:tags', tags, target);
  };
}

/**
 * OpenAPI Operation 装饰器 - OpenAPI 标准
 */
export function ApiOperation(operation: Partial<OpenAPIV3.OperationObject>): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    Reflect.defineMetadata('openapi:operation', operation, target, propertyKey);
  };
}

/**
 * OpenAPI Response 装饰器 - OpenAPI 标准
 */
  export function ApiResponse(status: string | number, response: OpenAPIV3.ResponseObject): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    const existingResponses = Reflect.getMetadata('openapi:responses', target, propertyKey) || {};
    existingResponses[status] = response;
    Reflect.defineMetadata('openapi:responses', existingResponses, target, propertyKey);
  };
}

/**
 * OpenAPI Parameter 装饰器 - OpenAPI 标准
 */
export function ApiParameter(param: OpenAPIV3.ParameterObject): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    const existingParams = Reflect.getMetadata('openapi:parameters', target, propertyKey) || [];
    existingParams.push(param);
    Reflect.defineMetadata('openapi:parameters', existingParams, target, propertyKey);
  };
}

/**
 * OpenAPI Request Body 装饰器 - OpenAPI 标准
 */
export function ApiRequestBody(requestBody: OpenAPIV3.RequestBodyObject): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    Reflect.defineMetadata('openapi:requestBody', requestBody, target, propertyKey);
  };
}

/**
 * OpenAPI Security 装饰器 - OpenAPI 标准
 */
export function ApiSecurity(security: OpenAPIV3.SecurityRequirementObject[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    Reflect.defineMetadata('openapi:security', security, target, propertyKey);
  };
}

/**
 * OpenAPI Schema 装饰器 - OpenAPI 标准
 */
export function ApiSchema(schema: OpenAPIV3.SchemaObject): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('openapi:schema', schema, target);
  };
}

/**
 * OpenAPI Property 装饰器 - OpenAPI 标准
 */
export function ApiProperty(property: OpenAPIV3.SchemaObject): PropertyDecorator {
  return (target: any, propertyKey: string | symbol | undefined) => {
    if (!propertyKey) return;
    const existingProperties = Reflect.getMetadata('openapi:properties', target.constructor) || {};
    existingProperties[propertyKey] = property;
    Reflect.defineMetadata('openapi:properties', existingProperties, target.constructor);
  };
}

// 便捷装饰器 - 基于 OpenAPI 标准的常用场景
export function ApiQuery(name: string, options: Partial<Omit<OpenAPIV3.ParameterObject, 'name' | 'in'>> = {}): MethodDecorator {
  return ApiParameter({
    name,
    in: 'query',
    ...options
  });
}

export function ApiParam(name: string, options: Partial<Omit<OpenAPIV3.ParameterObject, 'name' | 'in'>> = {}): MethodDecorator {
  return ApiParameter({
    name,
    in: 'path',
    required: true,
    ...options
  });
}

export function ApiHeader(name: string, options: Partial<Omit<OpenAPIV3.ParameterObject, 'name' | 'in'>> = {}): MethodDecorator {
  return ApiParameter({
    name,
    in: 'header',
    ...options
  });
}

export function ApiBody(content: Record<string, OpenAPIV3.MediaTypeObject>, options: Partial<Omit<OpenAPIV3.RequestBodyObject, 'content'>> = {}): MethodDecorator {
  return ApiRequestBody({
    content,
    ...options
  });
}
