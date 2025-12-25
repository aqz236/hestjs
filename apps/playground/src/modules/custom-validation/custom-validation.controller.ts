import { Controller, Get, Post } from '@hestjs/core';
import { Body } from '@hestjs/validation';
import { CustomValidationDto, SearchQueryDto } from './dto/custom-validation.dto';
import { CustomValidationService } from './custom-validation.service';

/**
 * 自定义验证控制器 - 展示 TypeBox 自定义验证功能
 */
@Controller('/api/custom')
export class CustomValidationController {
  constructor(
    private readonly customValidationService: CustomValidationService,
  ) {}

  @Get('/')
  async getInfo() {
    return {
      success: true,
      message: 'HestJS 自定义验证功能示例',
      features: [
        '🔧 TypeBox 自定义 Schema 验证',
        '🏗️ SchemaFactory 便捷构建器',
        '📦 CommonValidators 常用验证',
        '🔗 联合类型验证',
        '📐 嵌套对象验证',
        '📱 中国手机号验证',
        '🔗 UUID 验证',
        '📍 地理坐标验证',
      ],
      endpoints: {
        'POST /api/custom/validate': '测试自定义验证',
        'POST /api/custom/search': '测试搜索参数验证',
        'GET /api/custom/examples': '获取验证示例',
      },
    };
  }

  @Post('/validate')
  async validateCustomData(
    @Body(CustomValidationDto) data: CustomValidationDto,
  ) {
    const result = this.customValidationService.processCustomData(data);
    return {
      success: true,
      message: '自定义验证通过！',
      result,
      validationInfo: {
        username: `用户名 "${data.username}" 通过正则验证`,
        role: `角色 "${data.role}" 通过联合类型验证`,
        userId: `UUID "${data.userId}" 格式验证通过`,
        phoneNumber: data.phoneNumber
          ? `手机号 "${data.phoneNumber}" 通过中国手机号验证`
          : '未提供手机号',
        location: data.location
          ? `坐标 (${data.location.lat}, ${data.location.lng}) 验证通过`
          : '未提供坐标',
        emails: data.emails
          ? `邮箱列表包含 ${data.emails.length} 个地址`
          : '未提供邮箱',
      },
    };
  }

  @Post('/search')
  async searchWithValidation(@Body(SearchQueryDto) query: SearchQueryDto) {
    const result = this.customValidationService.processSearch(query);
    return {
      success: true,
      message: '搜索参数验证通过！',
      result,
      validationInfo: {
        query: query.q || '无搜索关键词',
        pagination: query.pagination || '使用默认分页',
      },
    };
  }

  @Get('/examples')
  async getValidationExamples() {
    return {
      success: true,
      message: '自定义验证示例',
      examples: {
        customValidation: {
          description: 'POST /api/custom/validate',
          validExample: {
            username: 'john_doe123',
            role: 'user',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            phoneNumber: '13812345678',
            location: { lat: 39.9042, lng: 116.4074 },
            emails: ['john@example.com', 'john.doe@company.com'],
          },
          invalidExample: {
            username: 'a', // 太短
            role: 'invalid_role', // 不在联合类型中
            userId: 'not-a-uuid', // 无效 UUID
            phoneNumber: '123456', // 无效手机号
            location: { lat: 200, lng: 200 }, // 超出范围
            emails: ['invalid-email', 'another@invalid'], // 无效邮箱
          },
        },
        searchValidation: {
          description: 'POST /api/custom/search',
          validExample: {
            q: 'TypeScript',
            pagination: {
              page: 1,
              limit: 10,
              sort: 'createdAt',
              order: 'desc',
            },
          },
          invalidExample: {
            q: 123, // 应该是字符串
            pagination: {
              page: 0, // 应该 >= 1
              limit: 1000, // 应该 <= 100
              order: 'invalid', // 应该是 'asc' 或 'desc'
            },
          },
        },
      },
      typeboxFeatures: {
        basicTypes: [
          'Type.String()',
          'Type.Number()',
          'Type.Boolean()',
          'Type.Array()',
        ],
        advancedTypes: [
          'Type.Union()',
          'Type.Object()',
          'Type.Intersect()',
          'Type.Optional()',
        ],
        formats: ['email', 'date', 'date-time', 'uri', 'uuid'],
        patterns: ['正则表达式验证', '长度限制', '数值范围', '枚举值'],
        customValidators: [
          'SchemaFactory 便捷方法',
          'CommonValidators 常用验证',
        ],
      },
    };
  }
}
