import { Injectable } from '@hestjs/core';
import type { CustomValidationDto, SearchQueryDto } from './dto/custom-validation.dto';

/**
 * 自定义验证服务
 */
@Injectable()
export class CustomValidationService {
  processCustomData(data: CustomValidationDto) {
    // 模拟处理逻辑
    return {
      processed: true,
      data: {
        ...data,
        processedAt: new Date().toISOString(),
        validation: 'TypeBox 自定义验证通过',
      },
    };
  }

  processSearch(query: SearchQueryDto) {
    // 模拟搜索逻辑
    return {
      results: [
        { id: 1, title: '搜索结果 1', relevance: 0.95 },
        { id: 2, title: '搜索结果 2', relevance: 0.87 },
      ],
      query,
      total: 2,
      searchedAt: new Date().toISOString(),
    };
  }
}
