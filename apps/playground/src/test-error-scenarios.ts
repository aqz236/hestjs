import { logger } from '@hestjs/logger';

// 模拟应用启动时的错误处理
async function testErrorScenarios() {
  console.log('=== Testing Real-world Error Scenarios ===\n');

  // 场景 1: 数据库连接错误
  try {
    throw new Error('Database connection failed');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error instanceof Error ? error : new Error(String(error)));
  }

  // 场景 2: API 调用失败
  try {
    const apiError = new Error('API request timeout');
    (apiError as any).status = 504;
    (apiError as any).endpoint = '/api/users';
    throw apiError;
  } catch (error) {
    logger.error('❌ API call failed:', error instanceof Error ? error : new Error(String(error)), {
      requestId: 'req-12345',
      userId: 'user-67890'
    });
  }

  // 场景 3: 验证错误
  try {
    const validationError = new Error('Validation failed');
    (validationError as any).fields = ['email', 'password'];
    (validationError as any).code = 'VALIDATION_ERROR';
    throw validationError;
  } catch (error) {
    logger.error('❌ Validation failed:', error instanceof Error ? error : new Error(String(error)));
  }

  // 场景 4: 使用简化的语法
  const simpleError = new Error('Something went wrong');
  logger.error('❌ Simple error logging:', simpleError);

  console.log('\n=== Test Complete ===');
}

testErrorScenarios();
