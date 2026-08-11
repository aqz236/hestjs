import 'reflect-metadata';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { CommonValidators, Custom, SchemaFactory } from './custom';
import { VALIDATION_METADATA_KEY } from './validation';

function props(target: any) {
  return Reflect.getMetadata(VALIDATION_METADATA_KEY, target)?.properties ?? [];
}

function schemaOf(target: any, propertyKey: string) {
  return props(target).find((p: any) => p.propertyKey === propertyKey)?.schema;
}

function accepts(schema: any, value: unknown) {
  return Value.Check(schema, value);
}

describe('SchemaFactory：标识符类', () => {
  it('uuid 接受 v4 形态并拒绝其它', () => {
    const schema = SchemaFactory.uuid();

    expect(accepts(schema, '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(accepts(schema, 'not-a-uuid')).toBe(false);
  });

  it('objectId 只接受 24 位十六进制', () => {
    const schema = SchemaFactory.objectId();

    expect(accepts(schema, '507f1f77bcf86cd799439011')).toBe(true);
    expect(accepts(schema, '507f1f77bcf86cd79943901')).toBe(false);
    expect(accepts(schema, 'ZZZf1f77bcf86cd799439011')).toBe(false);
  });

  it('hexColor 接受 3 位与 6 位写法', () => {
    const schema = SchemaFactory.hexColor();

    expect(accepts(schema, '#fff')).toBe(true);
    expect(accepts(schema, '#a1b2c3')).toBe(true);
    expect(accepts(schema, 'a1b2c3')).toBe(false);
  });

  it('creditCard 接受合法卡号并拒绝非法卡号', () => {
    const schema = SchemaFactory.creditCard();

    expect(accepts(schema, '4111111111111111')).toBe(true);
    expect(accepts(schema, '123')).toBe(false);
  });

  it('chinesePhoneNumber 只接受 1[3-9] 开头的 11 位', () => {
    const schema = SchemaFactory.chinesePhoneNumber();

    expect(accepts(schema, '13812345678')).toBe(true);
    expect(accepts(schema, '12812345678')).toBe(false);
    expect(accepts(schema, '1381234567')).toBe(false);
  });

  it('chineseIdCard 校验 18 位身份证', () => {
    const schema = SchemaFactory.chineseIdCard();

    expect(accepts(schema, '110101199003074518')).toBe(true);
    expect(accepts(schema, '11010119900307451')).toBe(false);
  });
});

describe('SchemaFactory：通用构造', () => {
  it('range 生成数值区间，exclusive 控制是否排除端点', () => {
    const inclusive = SchemaFactory.range(0, 10);
    const exclusive = SchemaFactory.range(0, 10, { exclusive: true });

    expect(accepts(inclusive, 0)).toBe(true);
    expect(accepts(inclusive, 10)).toBe(true);
    expect(accepts(exclusive, 0)).toBe(false);
    expect(accepts(exclusive, 10)).toBe(false);
    expect(accepts(exclusive, 5)).toBe(true);
  });

  it('template 直接把 pattern 透传', () => {
    const schema = SchemaFactory.template('^[A-Z]{2}-\\d{4}$');

    expect(accepts(schema, 'AB-1234')).toBe(true);
    expect(accepts(schema, 'ab-1234')).toBe(false);
  });

  it('enum 由字面量联合构成', () => {
    const schema = SchemaFactory.enum(['draft', 'published'] as const);

    expect(accepts(schema, 'draft')).toBe(true);
    expect(accepts(schema, 'archived')).toBe(false);
  });

  it('pagination 提供带默认值的可选分页字段', () => {
    const schema = SchemaFactory.pagination();

    expect(accepts(schema, {})).toBe(true);
    expect(accepts(schema, { page: 1, pageSize: 20 })).toBe(true);
    expect(accepts(schema, { page: 0 })).toBe(false);
  });

  it('search 要求 q 至少一个字符', () => {
    const schema = SchemaFactory.search();

    expect(accepts(schema, {})).toBe(true);
    expect(accepts(schema, { q: 'a' })).toBe(true);
    expect(accepts(schema, { q: '' })).toBe(false);
  });

  it('recursive 生成自引用结构', () => {
    const schema = SchemaFactory.recursive((self: any) =>
      Type.Object({
        name: Type.String(),
        children: Type.Optional(Type.Array(self)),
      }),
    );

    expect(accepts(schema, { name: 'root' })).toBe(true);
    expect(accepts(schema, { name: 'root', children: [{ name: 'child' }] })).toBe(true);
    expect(accepts(schema, { name: 1 })).toBe(false);
  });
});

describe('@Custom 装饰器', () => {
  it('把自定义 schema 挂到属性上', () => {
    class Dto {
      @Custom(SchemaFactory.uuid())
      id!: string;
    }

    expect(accepts(schemaOf(Dto, 'id'), '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(accepts(schemaOf(Dto, 'id'), 'nope')).toBe(false);
  });

  it('optional 会把属性标记为可选', () => {
    class Dto {
      @Custom(SchemaFactory.uuid(), { optional: true })
      id?: string;
    }

    const meta = props(Dto).find((p: any) => p.propertyKey === 'id');

    expect(meta?.isOptional).toBe(true);
  });

  it('保留自定义 message', () => {
    class Dto {
      @Custom(SchemaFactory.uuid(), { message: '不是合法 UUID' })
      id!: string;
    }

    expect(props(Dto).find((p: any) => p.propertyKey === 'id')?.message).toBe('不是合法 UUID');
  });
});

describe('CommonValidators', () => {
  it('每个验证器都产出可用的 schema', () => {
    class Dto {
      @CommonValidators.UUID()
      uuid!: string;

      @CommonValidators.ChinesePhone()
      phone!: string;

      @CommonValidators.HexColor()
      color!: string;

      @CommonValidators.JsonString()
      json!: string;

      @CommonValidators.Base64()
      b64!: string;
    }

    expect(accepts(schemaOf(Dto, 'uuid'), '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(accepts(schemaOf(Dto, 'phone'), '13812345678')).toBe(true);
    expect(accepts(schemaOf(Dto, 'color'), '#a1b2c3')).toBe(true);
    expect(accepts(schemaOf(Dto, 'json'), '{"a":1}')).toBe(true);
    expect(accepts(schemaOf(Dto, 'b64'), 'aGVsbG8=')).toBe(true);
  });

  it('optional 选项生效', () => {
    class Dto {
      @CommonValidators.UUID({ optional: true })
      id?: string;
    }

    expect(props(Dto).find((p: any) => p.propertyKey === 'id')?.isOptional).toBe(true);
  });
});

describe('CommonValidators.JsonString 的实际校验能力', () => {
  // schema 只能表达「是字符串」，真正的 JSON 合法性由 validate 断言承担，
  // 因此这里通过 ValidationPipe 验证，而不是直接 Value.Check。
  it('拒绝非 JSON 字符串', async () => {
    const { ValidationPipe, ValidationException } = await import('../pipes/validation.pipe');

    class Dto {
      @CommonValidators.JsonString()
      payload!: string;
    }

    const pipe = new ValidationPipe();

    await expect(pipe.validate(Dto, { payload: '{"a":1}' })).resolves.toBeDefined();
    await expect(pipe.validate(Dto, { payload: 'not json' })).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('schema 本身仍是字符串（断言不体现在 schema 上）', () => {
    class Dto {
      @CommonValidators.JsonString()
      payload!: string;
    }

    expect(accepts(schemaOf(Dto, 'payload'), 'anything')).toBe(true);
  });
});
