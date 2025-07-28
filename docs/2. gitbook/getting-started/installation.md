# ⚡ 安装与环境配置

HestJS 基于 Bun 和 TypeScript 构建，推荐在最新版本的 Bun 环境下开发。

## 前置要求

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0（可选，Bun 已包含 Node.js 兼容层）
- TypeScript >= 5.x

## 安装步骤

1. 安装 Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

2. 克隆项目

```bash
git clone <your-repo-url>
cd hest
```

3. 安装依赖

```bash
bun install
```

4. 启动开发环境

```bash
bun run dev
```

或在 monorepo 根目录：

```bash
turbo run dev --filter=@hestjs/demo
```

## 生产环境构建与运行

```bash
bun run build
bun run start:prod
```

## 兼容性说明

- 推荐使用 Bun 作为主运行环境，兼容 Node.js 生态。
- 支持 macOS、Linux、Windows（WSL）。

> ⚠️ 请确保 Bun 版本为最新，避免依赖兼容性问题。

---

下一步：创建你的第一个 HestJS 应用。
