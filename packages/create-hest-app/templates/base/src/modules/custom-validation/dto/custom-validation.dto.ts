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
    { optional: true, message: '坐标必须在有效范围内' },
  )
  location?: {
    lat: number;
    lng: number;
  };

  // 数组验证
  @Custom(Type.Array(Type.String({ format: 'email' })), {
    optional: true,
    message: '邮箱列表必须是有效的邮箱地址数组',
  })
  emails?: string[];
}

/**
 * 搜索查询 DTO - 展示复杂对象验证
 */
export class SearchQueryDto {
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  q?: string;

  // 使用 SchemaFactory 构建复杂的分页对象
  @Custom(
    Type.Object({
      page: Type.Number({ minimum: 1 }),
      limit: Type.Number({ minimum: 1, maximum: 100 }),
      sort: Type.Optional(Type.String()),
      order: Type.Optional(
        Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
      ),
    }),
    {
      optional: true,
      message: '分页参数格式错误',
    },
  )
  pagination?: {
    page: number;
    limit: number;
    sort?: string;
    order?: 'asc' | 'desc';
  };

  // 使用联合类型进行复杂验证
  @Custom(
    Type.Union([
      Type.Array(Type.String()),
      Type.String(),
      Type.Null(),
      Type.Undefined(),
    ]),
    {
      optional: true,
      message: '标签可以是字符串、字符串数组或空值',
    },
  )
  tags?: string | string[] | null;

  // 使用数值范围验证
  @Custom(Type.Number({ minimum: 0, maximum: 100 }), {
    optional: true,
    message: '评分必须在 0-100 之间',
  })
  score?: number;

  // 使用日期字符串验证
  @Custom(Type.String({ format: 'date' }), {
    optional: true,
    message: '开始日期格式必须是 YYYY-MM-DD',
  })
  startDate?: string;

  @Custom(Type.String({ format: 'date' }), {
    optional: true,
    message: '结束日期格式必须是 YYYY-MM-DD',
  })
  endDate?: string;
}
