import { defineConfig } from 'vite';

const API_PORT = process.env.PORT ?? '3000';

export default defineConfig({
  root: 'src/web',
  build: {
    outDir: '../../dist/web',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    // 开发时前端在 5173、API 在 3000，靠代理接起来。
    // 生产环境由 Hono 直接服务 dist/web，没有代理这一层。
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
