import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { MetadataScanner } from '../metadata/metadata-scanner';
import { HttpMethod, ParamType, Scope } from '../utils/constants';
import { Controller } from './controller';
import { Injectable } from './injectable';
import { Module } from './module';
import { Body, Get, Param, Post, Query } from './route';

describe('@Injectable', () => {
  it('默认作用域为 singleton', () => {
    @Injectable()
    class Service {}

    expect(MetadataScanner.scanInjectable(Service)?.scope).toBe(Scope.SINGLETON);
  });

  it('可以指定 transient 作用域', () => {
    @Injectable({ scope: Scope.TRANSIENT })
    class Service {}

    expect(MetadataScanner.scanInjectable(Service)?.scope).toBe(Scope.TRANSIENT);
  });

  it('isInjectable 能识别被标记的类', () => {
    @Injectable()
    class Marked {}
    class Unmarked {}

    expect(MetadataScanner.isInjectable(Marked)).toBe(true);
    expect(MetadataScanner.isInjectable(Unmarked)).toBe(false);
  });
});

describe('@Controller', () => {
  it('补全缺失的前导斜杠', () => {
    @Controller('users')
    class C {}

    expect(MetadataScanner.scanController(C)?.path).toBe('/users');
  });

  it('保留已有的前导斜杠', () => {
    @Controller('/api/users')
    class C {}

    expect(MetadataScanner.scanController(C)?.path).toBe('/api/users');
  });

  it('空路径规范化为 /', () => {
    @Controller()
    class C {}

    expect(MetadataScanner.scanController(C)?.path).toBe('/');
  });

  it('隐式标记为可注入', () => {
    @Controller('/c')
    class C {}

    expect(MetadataScanner.isInjectable(C)).toBe(true);
    expect(MetadataScanner.isController(C)).toBe(true);
  });
});

describe('@Module', () => {
  it('保存全部四个字段', () => {
    class Ctrl {}
    class Prov {}
    class Imported {}
    class Exported {}

    @Module({
      controllers: [Ctrl],
      providers: [Prov],
      imports: [Imported],
      exports: [Exported],
    })
    class M {}

    expect(MetadataScanner.scanModule(M)).toEqual({
      controllers: [Ctrl],
      providers: [Prov],
      imports: [Imported],
      exports: [Exported],
    });
    expect(MetadataScanner.isModule(M)).toBe(true);
  });

  it('未标记的类 isModule 为 false', () => {
    class M {}

    expect(MetadataScanner.isModule(M)).toBe(false);
  });
});

describe('路由装饰器', () => {
  it('@Get 记录方法、路径与方法名', () => {
    @Controller('/users')
    class C {
      @Get('/:id')
      findOne() {}
    }

    expect(MetadataScanner.scanRoutes(C)).toEqual([
      { method: HttpMethod.GET, path: '/:id', methodName: 'findOne' },
    ]);
  });

  it('同一控制器上的多个路由会累积', () => {
    @Controller('/users')
    class C {
      @Get('/')
      findAll() {}

      @Post('/')
      create() {}
    }

    const routes = MetadataScanner.scanRoutes(C);

    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.method)).toEqual([HttpMethod.GET, HttpMethod.POST]);
  });

  it('路径缺省时补为 /', () => {
    @Controller('/x')
    class C {
      @Get()
      index() {}
    }

    expect(MetadataScanner.scanRoutes(C)[0].path).toBe('/');
  });
});

describe('参数装饰器', () => {
  it('记录参数位置、类型与 key', () => {
    @Controller('/x')
    class C {
      @Post('/')
      create(
        @Body() body: unknown,
        @Param('id') id: string,
        @Query('q') q: string,
      ) {}
    }

    // TypeScript 的参数装饰器从右向左执行，因此元数据数组是倒序的。
    // 消费方（RouterExplorer）依赖 index 字段而非数组位置来还原参数顺序。
    const params = MetadataScanner.scanParameters(C, 'create');

    expect([...params].sort((a, b) => a.index - b.index)).toEqual([
      { index: 0, type: ParamType.BODY, key: undefined },
      { index: 1, type: ParamType.PARAM, key: 'id' },
      { index: 2, type: ParamType.QUERY, key: 'q' },
    ]);
  });

  it('不同方法的参数元数据互不干扰', () => {
    @Controller('/x')
    class C {
      @Get('/a')
      a(@Query('a') a: string) {}

      @Get('/b')
      b(@Query('b') b: string) {}
    }

    expect(MetadataScanner.scanParameters(C, 'a')).toHaveLength(1);
    expect(MetadataScanner.scanParameters(C, 'b')).toHaveLength(1);
    expect(MetadataScanner.scanParameters(C, 'a')[0].key).toBe('a');
    expect(MetadataScanner.scanParameters(C, 'b')[0].key).toBe('b');
  });

  it('未声明参数的方法返回空数组', () => {
    @Controller('/x')
    class C {
      @Get('/')
      index() {}
    }

    expect(MetadataScanner.scanParameters(C, 'index')).toEqual([]);
  });
});
