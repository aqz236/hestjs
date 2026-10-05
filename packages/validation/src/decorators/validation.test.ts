import 'reflect-metadata';
import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInteger,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  VALIDATION_METADATA_KEY,
} from './validation';

/** 取出某个 DTO 类的属性元数据 */
function props(target: any) {
  return Reflect.getMetadata(VALIDATION_METADATA_KEY, target)?.properties ?? [];
}

function schemaOf(target: any, propertyKey: string) {
  return props(target).find((p: any) => p.propertyKey === propertyKey)?.schema;
}

function accepts(schema: any, value: unknown) {
  return Value.Check(schema, value);
}

function isOptional(target: any, propertyKey: string) {
  return props(target).find((p: any) => p.propertyKey === propertyKey)?.isOptional;
}

describe('基础校验装饰器：schema 形状', () => {
  it('@IsString 默认接受任意字符串', () => {
    class Dto {
      @IsString()
      name!: string;
    }

    expect(accepts(schemaOf(Dto, 'name'), 'hello')).toBe(true);
    expect(accepts(schemaOf(Dto, 'name'), 123)).toBe(false);
  });

  it('@IsString 支持 minLength / maxLength', () => {
    class Dto {
      @IsString({ minLength: 2, maxLength: 5 })
      name!: string;
    }

    expect(accepts(schemaOf(Dto, 'name'), 'ab')).toBe(true);
    expect(accepts(schemaOf(Dto, 'name'), 'a')).toBe(false);
    expect(accepts(schemaOf(Dto, 'name'), 'abcdef')).toBe(false);
  });

  it('@IsString 支持 pattern', () => {
    class Dto {
      @IsString({ pattern: '^[a-z]+$' })
      slug!: string;
    }

    expect(accepts(schemaOf(Dto, 'slug'), 'abc')).toBe(true);
    expect(accepts(schemaOf(Dto, 'slug'), 'ABC')).toBe(false);
  });

  it('@IsNumber 支持 minimum / maximum', () => {
    class Dto {
      @IsNumber({ minimum: 0, maximum: 100 })
      score!: number;
    }

    expect(accepts(schemaOf(Dto, 'score'), 0)).toBe(true);
    expect(accepts(schemaOf(Dto, 'score'), 100)).toBe(true);
    expect(accepts(schemaOf(Dto, 'score'), -1)).toBe(false);
    expect(accepts(schemaOf(Dto, 'score'), 101)).toBe(false);
  });

  it('@IsInteger 拒绝小数', () => {
    class Dto {
      @IsInteger()
      count!: number;
    }

    expect(accepts(schemaOf(Dto, 'count'), 3)).toBe(true);
    expect(accepts(schemaOf(Dto, 'count'), 3.5)).toBe(false);
  });

  it('@IsBoolean 只接受布尔值', () => {
    class Dto {
      @IsBoolean()
      active!: boolean;
    }

    expect(accepts(schemaOf(Dto, 'active'), true)).toBe(true);
    expect(accepts(schemaOf(Dto, 'active'), 'true')).toBe(false);
  });

  it('@IsEmail 校验邮箱格式', () => {
    class Dto {
      @IsEmail()
      email!: string;
    }

    expect(accepts(schemaOf(Dto, 'email'), 'a@b.com')).toBe(true);
    expect(accepts(schemaOf(Dto, 'email'), 'not-an-email')).toBe(false);
  });

  it('@IsUrl 校验 URL', () => {
    class Dto {
      @IsUrl()
      site!: string;
    }

    expect(accepts(schemaOf(Dto, 'site'), 'https://example.com')).toBe(true);
    expect(accepts(schemaOf(Dto, 'site'), 'example')).toBe(false);
  });

  it('@IsArray 支持元素 schema 与长度约束', () => {
    class Dto {
      @IsArray(undefined, { minItems: 1, maxItems: 3 })
      tags!: unknown[];
    }

    expect(accepts(schemaOf(Dto, 'tags'), ['a'])).toBe(true);
    expect(accepts(schemaOf(Dto, 'tags'), [])).toBe(false);
    expect(accepts(schemaOf(Dto, 'tags'), ['a', 'b', 'c', 'd'])).toBe(false);
  });

  it('@IsEnum 只接受枚举内的值', () => {
    class Dto {
      @IsEnum(['admin', 'user'])
      role!: string;
    }

    expect(accepts(schemaOf(Dto, 'role'), 'admin')).toBe(true);
    expect(accepts(schemaOf(Dto, 'role'), 'guest')).toBe(false);
  });

  // 这里刻意用 pattern 断言：TypeBox 的 Value.Check 不校验 format 关键字，
  // 早先 IsDate 用 `format: 'date-time'` 时该装饰器实际接受任意字符串。
  it('@IsDate 接受 ISO 日期与日期时间', () => {
    class Dto {
      @IsDate()
      createdAt!: string;
    }

    expect(accepts(schemaOf(Dto, 'createdAt'), '2025-07-27')).toBe(true);
    expect(accepts(schemaOf(Dto, 'createdAt'), '2025-07-27T10:00:00.000Z')).toBe(true);
    expect(accepts(schemaOf(Dto, 'createdAt'), '2025-07-27T10:00:00+08:00')).toBe(true);
    expect(accepts(schemaOf(Dto, 'createdAt'), 'not-a-date')).toBe(false);
    expect(accepts(schemaOf(Dto, 'createdAt'), '2025/07/27')).toBe(false);
  });

  it('@Length / @Min / @Max / @Matches 生成对应约束', () => {
    class Dto {
      @Length(3, 8)
      code!: string;

      @Min(1)
      page!: number;

      @Max(50)
      size!: number;

      @Matches(/^[A-Z]{2}$/)
      country!: string;
    }

    expect(accepts(schemaOf(Dto, 'code'), 'abc')).toBe(true);
    expect(accepts(schemaOf(Dto, 'code'), 'ab')).toBe(false);
    expect(accepts(schemaOf(Dto, 'page'), 0)).toBe(false);
    expect(accepts(schemaOf(Dto, 'size'), 51)).toBe(false);
    expect(accepts(schemaOf(Dto, 'country'), 'CN')).toBe(true);
    expect(accepts(schemaOf(Dto, 'country'), 'cn')).toBe(false);
  });
});

describe('基础校验装饰器：元数据收集', () => {
  it('同一类的多个属性都会被记录', () => {
    class Dto {
      @IsString()
      name!: string;

      @IsNumber()
      age!: number;
    }

    expect(props(Dto).map((p: any) => p.propertyKey).sort()).toEqual(['age', 'name']);
  });

  it('@IsOptional 标记的是它下面那个属性', () => {
    class Dto {
      @IsOptional()
      @IsString()
      bio?: string;

      @IsString()
      name!: string;
    }

    expect(isOptional(Dto, 'bio')).toBe(true);
    expect(isOptional(Dto, 'name')).toBeUndefined();
  });

  it('保留装饰器传入的自定义 message', () => {
    class Dto {
      @IsString({ message: '名字必须是字符串' })
      name!: string;
    }

    expect(props(Dto).find((p: any) => p.propertyKey === 'name')?.message).toBe(
      '名字必须是字符串',
    );
  });
});
