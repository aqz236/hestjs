import {
  CommonValidators,
  Custom,
  IsOptional,
  IsString,
  SchemaFactory,
} from '@hestjs/validation';
import { Type } from '@sinclair/typebox';

/**
 * 展示自定义验证功能的简化 DTO
 */
export class CustomValidationDto {
  // 使用基础的 TypeBox API
  @Custom(
    Type.String({ minLength: 3, maxLength: 20, pattern: '^[a-zA-Z0-9_]+$' }),
    {
      message: '用户名必须是3-20位字母、数字或下划线',
    },
  )
  username!: string;

  // 使用联合类型
  @Custom(
    Type.Union([
      Type.Literal('admin'),
      Type.Literal('user'),
      Type.Literal('guest'),
    ]),
    {
      message: '角色必须是 admin、user 或 guest',
    },
  )
  role!: 'admin' | 'user' | 'guest';

  // 使用 CommonValidators 的便捷方法
  @CommonValidators.UUID({ message: '必须是有效的 UUID' })
  userId!: string;

  // 使用 SchemaFactory 的便捷方法
  @Custom(SchemaFactory.chinesePhoneNumber(), {
    message: '必须是有效的中国手机号',
    optional: true,
  })
  phoneNumber?: string;

  // 自定义对象验证
  @Custom(
    Type.Object({
      lat: Type.Number({ minimum: -90, maximum: 90 }),
      lng: Type.Number({ minimum: -180, maximum: 180 }),
    }),
    {
      message: '必须是有效的地理坐标',
      optional: true,
    },
  )
  location?: {
    lat: number;
    lng: number;
  };

  // 使用数组验证
  @Custom(
    Type.Array(
      Type.String({
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      }),
      { minItems: 0, maxItems: 3 },
    ),
    {
      message: '最多可以有3个邮箱地址',
      optional: true,
    },
  )
  emails?: string[];
}

/**
 * 搜索查询 DTO
 */
export class SearchQueryDto {
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  q?: string;

  // 使用 SchemaFactory 的分页验证
  @Custom(
    Type.Object({
      page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
      limit: Type.Optional(
        Type.Number({ minimum: 1, maximum: 100, default: 10 }),
      ),
      sort: Type.Optional(Type.String()),
      order: Type.Optional(
        Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
      ),
    }),
    {
      message: '分页参数格式错误',
      optional: true,
    },
  )
  pagination?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}
