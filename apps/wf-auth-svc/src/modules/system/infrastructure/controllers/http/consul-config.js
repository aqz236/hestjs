// consul-config.js - 获取 Consul 配置的 JavaScript 实现
console.log('=== Consul 配置模块加载 ===');

/**
 * 从 Consul 获取配置
 * @returns {Promise<Object>} 返回配置对象的 Promise
 */
async function fetchConsulConfig() {
  // 加载环境变量
  require('dotenv').config({
    path: '/Users/ttx/Projects/NestJS/wf-user-svc/.env.development',
  });

  const { CONSUL_HOST, CONSUL_PORT, POD_GROUP_NAME, NODE_ENV, POD_UID } =
    process.env;

  console.log('环境变量检查:');
  console.log('CONSUL_HOST:', CONSUL_HOST);
  console.log('CONSUL_PORT:', CONSUL_PORT);
  console.log('POD_GROUP_NAME:', POD_GROUP_NAME);
  console.log('NODE_ENV:', NODE_ENV);
  console.log('POD_UID:', POD_UID);

  // 验证环境变量完整性
  const missing = [];
  if (!CONSUL_HOST) missing.push('CONSUL_HOST');
  if (!CONSUL_PORT) missing.push('CONSUL_PORT');
  if (!POD_GROUP_NAME) missing.push('POD_GROUP_NAME');
  if (!NODE_ENV) missing.push('NODE_ENV');
  if (!POD_UID) missing.push('POD_UID');

  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }

  // 构建 Consul URL
  const consulUrl = `http://${CONSUL_HOST}:${CONSUL_PORT}/v1/kv/${POD_GROUP_NAME}/${NODE_ENV}/${POD_UID}/base_config?raw`;
  console.log('Consul URL:', consulUrl);

  // 使用 http/https 模块发送请求
  const https = require('https');
  const http = require('http');
  const url = require('url');

  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(consulUrl);
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;

    console.log('发送 HTTP 请求到 Consul...');

    const req = requestModule.get(consulUrl, res => {
      let data = '';

      console.log('响应状态码:', res.statusCode);

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP 错误: ${res.statusCode}`));
        return;
      }

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log('收到响应数据长度:', data.length);
          const config = JSON.parse(data);

          if (!config) {
            reject(new Error('从 Consul 获取的配置为空'));
            return;
          }

          console.log('✨ Consul 配置获取成功');
          console.log('配置概览:', {
            hasPodConfig: !!config.pod,
            hasConsulConfig: !!config.consul,
            hasDbConfig: !!config.db,
            hasJwtConfig: !!config.jwt,
          });

          resolve(config);
        } catch (error) {
          reject(new Error(`解析 JSON 响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('请求超时 (5秒)'));
    });
  });
}

/**
 * 获取配置并处理错误
 * @returns {Promise<Object|null>} 返回配置对象或 null
 */
async function getConsulConfigSafe() {
  try {
    console.log('=== 开始获取 Consul 配置 ===');
    const config = await fetchConsulConfig();
    console.log('=== Consul 配置加载完成 ===');
    exports.consulConfig = config;
    exports.dbConfig = config.db;
    exports.jwtConfig = config.jwt;
    exports.podConfig = config.pod;
    console.log('已保存环境变量');
    return config;
  } catch (error) {
    console.log('❌ Consul 配置获取失败:', error.message);
    console.error('详细错误:', error);
    return null;
  }
}

// 导出函数
module.exports = {
  fetchConsulConfig,
  getConsulConfigSafe,
};

console.log('=== Consul 配置模块准备就绪 ===');
