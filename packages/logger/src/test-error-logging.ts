#!/usr/bin/env bun

import { createLogger } from './factory';

// 创建测试 logger
const logger = createLogger('ErrorTest');

// 创建一些测试错误
const simpleError = new Error('This is a simple error');
const complexError = new Error('Complex error with custom properties');
(complexError as any).statusCode = 500;
(complexError as any).code = 'INTERNAL_ERROR';

console.log('=== Testing Enhanced Error Logging ===\n');

// 测试 1: 直接传递错误消息和错误对象
console.log('Test 1: logger.error("报错了", error)');
logger.error('报错了', simpleError);

console.log('\nTest 2: logger.error("报错了", complexError)');
logger.error('报错了', complexError);

// 测试 3: 错误对象在前，消息在后
console.log('\nTest 3: logger.error(error, "发生了错误")');
logger.error(simpleError, '发生了错误');

// 测试 4: 只传递错误对象
console.log('\nTest 4: logger.error(error)');
logger.error(complexError);

// 测试 5: 错误与额外数据
console.log('\nTest 5: logger.error("API调用失败", error, { userId: 123, endpoint: "/api/users" })');
logger.error('API调用失败', simpleError, { userId: 123, endpoint: '/api/users' });

// 测试 6: 多个错误
console.log('\nTest 6: logger.error("多重错误", error1, error2)');
logger.error('多重错误', simpleError, complexError);

// 测试 7: 传统方式对比
console.log('\nTest 7: 传统方式 (应该仍然工作)');
logger.error({ err: simpleError }, '传统方式记录错误');

// 测试 8: 复杂场景
console.log('\nTest 8: 复杂场景');
const requestError = new Error('Request timeout');
(requestError as any).timeout = 5000;
(requestError as any).url = 'https://api.example.com';

logger.error('请求超时', requestError, { 
  requestId: 'req-123',
  retry: 3,
  metadata: { source: 'api-client' }
});

console.log('\n=== Error Logging Tests Complete ===');
