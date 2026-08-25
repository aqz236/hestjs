import 'reflect-metadata';
import { Controller, Get, Post } from '@hestjs/core';
import { describe, expect, it } from 'vitest';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiSchema,
  ApiSecurity,
  ApiTags,
} from './decorators/openapi.decorators';
import { OpenAPIGenerator } from './openapi-generator';
import {
  generateBaseOpenApiSpec,
  generatePathsFromController,
  generateSchemaFromClass,
  mergeOpenApiSpecs,
} from './utils';

describe('generateBaseOpenApiSpec', () => {
  it('生成 OpenAPI 3.0 骨架', () => {
    const spec = generateBaseOpenApiSpec({ title: 'HestJS', version: '1.0.0' }) as any;

    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toMatchObject({ title: 'HestJS', version: '1.0.0' });
    expect(spec.paths).toEqual({});
    expect(spec.components.schemas).toEqual({});
  });

  it('未传 description 时生成默认描述', () => {
    const spec = generateBaseOpenApiSpec({ title: 'API', version: '1.0.0' }) as any;

    expect(spec.info.description).toContain('API');
  });

  it('未传 servers 时提供本地默认值', () => {
    const spec = generateBaseOpenApiSpec({ title: 'API', version: '1.0.0' }) as any;

    expect(spec.servers[0].url).toContain('localhost');
  });

  it('传入的 servers 会覆盖默认值', () => {
    const spec = generateBaseOpenApiSpec({
      title: 'API',
      version: '1.0.0',
      servers: [{ url: 'https://api.example.com' }],
    }) as any;

    expect(spec.servers).toEqual([{ url: 'https://api.example.com' }]);
  });
});

describe('mergeOpenApiSpecs', () => {
  it('合并 paths 与 components.schemas', () => {
    const a = {
      info: { title: 'A', version: '1' },
      servers: [{ url: 'https://a' }],
      paths: { '/a': {} },
      components: { schemas: { X: { type: 'object' } } },
    };
    const b = {
      info: { title: 'B', version: '2' },
      servers: [{ url: 'https://b' }],
      paths: { '/b': {} },
      components: { schemas: { Y: { type: 'object' } } },
    };

    const merged = mergeOpenApiSpecs(a, b) as any;

    expect(Object.keys(merged.paths).sort()).toEqual(['/a', '/b']);
    expect(Object.keys(merged.components.schemas).sort()).toEqual(['X', 'Y']);
    expect(merged.servers).toHaveLength(2);
  });

  it('info 采用第一个非空值', () => {
    const merged = mergeOpenApiSpecs(
      { info: { title: 'First', version: '1' } },
      { info: { title: 'Second', version: '2' } },
    ) as any;

    expect(merged.info.title).toBe('First');
  });

  it('同名路径以后者为准', () => {
    const merged = mergeOpenApiSpecs(
      { paths: { '/x': { get: { summary: 'first' } } } },
      { paths: { '/x': { get: { summary: 'second' } } } },
    ) as any;

    expect(merged.paths['/x'].get.summary).toBe('second');
  });
});

describe('OpenAPI 装饰器元数据', () => {
  it('@ApiTags 记录标签', () => {
    @ApiTags('users', 'admin')
    class Ctrl {}

    expect(Reflect.getMetadata('openapi:tags', Ctrl)).toEqual(['users', 'admin']);
  });

  it('@ApiOperation 记录操作描述', () => {
    class Ctrl {
      @ApiOperation({ summary: '获取用户', operationId: 'getUser' })
      getUser() {}
    }

    expect(Reflect.getMetadata('openapi:operation', Ctrl.prototype, 'getUser')).toMatchObject({
      summary: '获取用户',
    });
  });

  it('@ApiQuery / @ApiParam 记录参数', () => {
    class Ctrl {
      @ApiQuery('limit')
      @ApiParam('id')
      handler() {}
    }

    expect(
      Reflect.getMetadata('openapi:parameters', Ctrl.prototype, 'handler'),
    ).toHaveLength(2);
  });

  it('@ApiBody 记录请求体', () => {
    class Ctrl {
      @ApiBody({ 'application/json': { schema: { type: 'object' } } })
      create() {}
    }

    expect(
      Reflect.getMetadata('openapi:requestBody', Ctrl.prototype, 'create'),
    ).toBeDefined();
  });

  it('@ApiSecurity 记录安全要求', () => {
    class Ctrl {
      @ApiSecurity([{ bearerAuth: [] }])
      secure() {}
    }

    expect(Reflect.getMetadata('openapi:security', Ctrl.prototype, 'secure')).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it('@ApiSchema / @ApiProperty 记录 schema 信息', () => {
    @ApiSchema({ type: 'object' })
    class Dto {
      @ApiProperty({ type: 'string', description: '名称' })
      name!: string;
    }

    expect(Reflect.getMetadata('openapi:schema', Dto)).toMatchObject({ type: 'object' });
    // @ApiProperty 把属性收集到类上的 'openapi:properties'（复数）映射里
    expect(Reflect.getMetadata('openapi:properties', Dto)).toMatchObject({
      name: { type: 'string', description: '名称' },
    });
  });
});

describe('OpenAPIGenerator', () => {
  // 必须使用 core 的 @Controller / @Get 提供路由元数据，
  // OpenAPIGenerator 据此（Symbol.for('hest:route')）展开 paths
  @ApiTags('users')
  @Controller('/users')
  class UsersController {
    @Get('/')
    @ApiOperation({ summary: '列出用户' })
    @ApiQuery('limit')
    findAll() {}

    @Post('/')
    @ApiOperation({ summary: '创建用户' })
    @ApiBody({ 'application/json': { schema: { type: 'object' } } })
    create() {}
  }

  it('为控制器生成 path 条目', () => {
    const generator = new OpenAPIGenerator({
      info: { title: 'Test API', version: '1.0.0' },
    });

    generator.addController(UsersController as never, '/users');
    const doc = generator.generateDocument() as any;

    expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
  });

  it('生成文档包含 info 与 openapi 版本', () => {
    const generator = new OpenAPIGenerator({
      info: { title: 'Test API', version: '2.0.0' },
    });

    const doc = generator.generateDocument() as any;

    expect(doc.openapi).toBeDefined();
    expect(doc.info).toMatchObject({ title: 'Test API', version: '2.0.0' });
  });

  it('addComponent 注册可复用组件', () => {
    const generator = new OpenAPIGenerator({
      info: { title: 'Test API', version: '1.0.0' },
    });

    generator.addComponent('schemas', 'User', { type: 'object' });
    const doc = generator.generateDocument() as any;

    expect(doc.components.schemas.User).toEqual({ type: 'object' });
  });

  it('按 core 路由元数据展开 paths', () => {
    const generator = new OpenAPIGenerator({
      info: { title: 'Test API', version: '1.0.0' },
    });

    generator.addController(UsersController as never, '/users');
    const doc = generator.generateDocument() as any;

    // joinPaths 把 /users + / 规范化为 /users
    expect(Object.keys(doc.paths)).toEqual(['/users']);
    expect(doc.paths['/users'].get.summary).toBe('列出用户');
    expect(doc.paths['/users'].post.requestBody).toBeDefined();
  });

  it('reset 清空已收集的内容', () => {
    const generator = new OpenAPIGenerator({
      info: { title: 'Test API', version: '1.0.0' },
    });

    generator.addComponent('schemas', 'User', { type: 'object' });
    generator.reset();

    const doc = generator.generateDocument() as any;

    // generateDocument 会剔除空的组件分组，因此重置后 components 可能整体缺省
    expect(doc.components?.schemas?.User).toBeUndefined();
    expect(doc.paths).toEqual({});
  });
});

describe('generateSchemaFromClass / generatePathsFromController', () => {
  it('无 @ApiProperty 的类返回空 properties 的 object schema', () => {
    class Plain {}

    expect(generateSchemaFromClass(Plain)).toEqual({ type: 'object', properties: {} });
  });

  it('读取 @ApiProperty 写入的属性（key 曾与装饰器不一致）', () => {
    class Dto {
      @ApiProperty({ type: 'string', description: '名称' })
      name!: string;

      @ApiProperty({ type: 'number', required: true } as never)
      age!: number;
    }

    const schema = generateSchemaFromClass(Dto) as any;

    expect(schema.properties.name).toMatchObject({ type: 'string', description: '名称' });
    expect(schema.properties.age).toMatchObject({ type: 'number' });
    // required 是装饰器参数，不应出现在属性的 schema 里
    expect(schema.properties.age).not.toHaveProperty('required');
    expect(schema.required).toContain('age');
  });

  it('未装饰的类产出空 paths', () => {
    class NotAController {}

    expect(generatePathsFromController(NotAController)).toEqual({});
  });

  it('带 core 路由元数据的控制器能产出 paths', () => {
    @Controller('/items')
    class ItemsController {
      @Get('/')
      list() {}
    }

    const paths = generatePathsFromController(ItemsController) as any;

    expect(Object.keys(paths)).toContain('/items');
    expect(paths['/items'].get).toBeDefined();
  });
});
