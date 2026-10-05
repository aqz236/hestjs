import { hc } from 'hono/client';
import type { AppType } from '../main';

/**
 * 客户端类型直接从服务端推导 —— 没有代码生成、没有契约文件。
 *
 * `client.api.greet[':name'].$get({ param: { name } })` 里
 * 路径、参数名、响应类型全都是从服务端的链式注册推出来的。
 * 服务端改路径，这里立刻编译不过。
 */
const client = hc<AppType>('/');

const root = document.querySelector('#app');
if (root === null) {
  throw new Error('找不到 #app');
}

async function greet(name: string): Promise<void> {
  const response = await client.api.greet[':name'].$get({ param: { name } });
  const body = await response.json();
  root!.textContent = body.message;
}

async function main(): Promise<void> {
  const health = await client.api.health.$get();
  console.log('API 健康检查：', await health.text());
  await greet('world');
}

void main();
