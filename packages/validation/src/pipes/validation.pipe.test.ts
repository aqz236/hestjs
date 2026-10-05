import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { CommonValidators, Custom, SchemaFactory } from '../decorators/custom';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from '../decorators/validation';
import { ValidationError, ValidationException, ValidationPipe } from './validation.pipe';

class UpdateUserDto {
  @IsString({ minLength: 2, maxLength: 20 })
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber({ minimum: 18, maximum: 120 })
  age!: number;

  @IsOptional()
  @IsString()
  bio?: string;
}

class AdvancedDto {
  @CommonValidators.UUID()
  id!: string;

  @Matches(/^1[3-9]\d{9}$/)
  phone!: string;

  // SchemaFactory.* 返回的是 schema，需要经 @Custom 包裹才是装饰器
  @Custom(SchemaFactory.range(0, 100, { exclusive: false }))
  score!: number;
}

describe('ValidationPipe：基础行为', () => {
  const pipe = new ValidationPipe();

  it('合法输入通过并返回对象', async () => {
    const input = { name: 'Alice', email: 'alice@example.com', age: 30, bio: 'hi' };

    await expect(pipe.validate(UpdateUserDto, input)).resolves.toMatchObject(input);
  });

  it('缺省的可选字段不影响通过', async () => {
    const input = { name: 'Alice', email: 'alice@example.com', age: 30 };

    await expect(pipe.validate(UpdateUserDto, input)).resolves.toBeDefined();
  });

  it('缺失必填字段会抛 ValidationException', async () => {
    await expect(pipe.validate(UpdateUserDto, { email: 'a@b.com', age: 20 })).rejects.toBeInstanceOf(
      ValidationException,
    );
  });

  it('类型错误会抛 ValidationException', async () => {
    await expect(
      pipe.validate(UpdateUserDto, { name: 'Alice', email: 'a@b.com', age: 'thirty' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('越界数值会抛 ValidationException', async () => {
    await expect(
      pipe.validate(UpdateUserDto, { name: 'Alice', email: 'a@b.com', age: 17 }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('非对象输入直接被拒绝', async () => {
    await expect(pipe.validate(UpdateUserDto, null)).rejects.toBeInstanceOf(ValidationException);
    await expect(pipe.validate(UpdateUserDto, 'str')).rejects.toBeInstanceOf(ValidationException);
  });

  it('DTO 没有校验元数据时原样返回', async () => {
    class PlainDto {}

    const input = { anything: 1 };

    await expect(pipe.validate(PlainDto, input)).resolves.toEqual(input);
  });
});

describe('ValidationException', () => {
  it('汇总多条错误消息', () => {
    const error = new ValidationException([
      new ValidationError('name 太短', 'name', 'a', 'minLength'),
      new ValidationError('email 格式错误', 'email', 'x', 'pattern'),
    ]);

    expect(error.getMessages()).toEqual(['name 太短', 'email 格式错误']);
  });

  it('格式化消息包含字段名', () => {
    const error = new ValidationException([
      new ValidationError('name 太短', 'name', 'a', 'minLength'),
    ]);

    expect(error.getFormattedMessage()).toContain('name');
  });

  it('是 Error 的实例，便于统一捕获', () => {
    const error = new ValidationException([new ValidationError('x', 'f', 1, 't')]);

    expect(error).toBeInstanceOf(Error);
  });
});

describe('ValidationPipe：自定义断言与高级 schema', () => {
  const pipe = new ValidationPipe();

  it('UUID 与手机号规则生效', async () => {
    const good = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phone: '13812345678',
      score: 50,
    };
    const badId = { ...good, id: 'nope' };
    const badPhone = { ...good, phone: '12812345678' };

    await expect(pipe.validate(AdvancedDto, good)).resolves.toBeDefined();
    await expect(pipe.validate(AdvancedDto, badId)).rejects.toBeInstanceOf(ValidationException);
    await expect(pipe.validate(AdvancedDto, badPhone)).rejects.toBeInstanceOf(ValidationException);
  });

  it('range 的边界按 inclusive 处理', async () => {
    await expect(
      pipe.validate(AdvancedDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone: '13812345678',
        score: 0,
      }),
    ).resolves.toBeDefined();

    await expect(
      pipe.validate(AdvancedDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone: '13812345678',
        score: 101,
      }),
    ).rejects.toBeInstanceOf(ValidationException);
  });
});

describe('ValidationPipe：白名单', () => {
  const base = { name: 'Alice', email: 'alice@example.com', age: 30 };

  it('whitelist（默认）移除未声明的字段', async () => {
    const pipe = new ValidationPipe();
    const result = (await pipe.validate(UpdateUserDto, {
      ...base,
      injected: 'should be removed',
    })) as Record<string, unknown>;

    expect(result).not.toHaveProperty('injected');
    expect(result).toMatchObject(base);
  });

  it('关闭 whitelist 时保留额外字段', async () => {
    const pipe = new ValidationPipe({ whitelist: false });
    const result = (await pipe.validate(UpdateUserDto, {
      ...base,
      extra: 'kept',
    })) as Record<string, unknown>;

    expect(result).toHaveProperty('extra', 'kept');
  });

  it('whitelist + forbidNonWhitelisted 时改为报错', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      pipe.validate(UpdateUserDto, { ...base, injected: 'nope' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });
});
