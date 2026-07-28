# 文档站部署

文档站（Docusaurus）通过 GitHub Actions 自动部署到 GitHub Pages。

- **线上地址**：<https://aqz236.github.io/hestjs/>
- **流水线**：`.github/workflows/docs.yml`
- **Pages 模式**：`workflow`（由 Actions 发布产物，不再使用 `gh-pages` 分支）

## 触发条件

| 事件 | 条件 |
| --- | --- |
| `push` 到 `main` | 改动命中 `apps/docs/**` 或 `docs.yml` |
| `pull_request` 到 `main` | 改动命中 `apps/docs/**`（只构建，不部署） |
| `workflow_dispatch` | 手动触发 |

## 流程

```
bun install --frozen-lockfile
bun run --filter hestjs-docs build     # 产出 apps/docs/build
actions/upload-pages-artifact          # 上传 build/
actions/deploy-pages                   # 发布到 Pages
```

## 关键配置

`docusaurus.config.ts` 中的三项必须与部署位置一致，否则页面能打开但**资源全部 404**：

```ts
url: 'https://aqz236.github.io',
baseUrl: '/hestjs/',     // 必须与仓库名一致
projectName: 'hestjs',
```

`onBrokenLinks: 'throw'`：内部链接失效会直接让构建失败，这是刻意的。

## 本地验证

```bash
bun run --filter hestjs-docs start     # 开发服务器
bun run --filter hestjs-docs build     # 生产构建
bun run --filter hestjs-docs serve     # 预览构建产物
```

本地预览时 `baseUrl` 仍为 `/hestjs/`，因此 `serve` 的地址是
<http://localhost:3000/hestjs/>，而不是根路径。

## 排查清单

页面 200 但白屏 / 样式丢失：

1. 打开 DevTools 看静态资源请求是否 404，若 404 则是 `baseUrl` / `projectName` 与实际部署路径不一致
2. Docusaurus 会在页面注入一段 baseUrl 不匹配的提示脚本，可直接读出它建议的值
3. 确认仓库 Settings → Pages 的 Source 是 **GitHub Actions** 而不是某个分支

构建失败：

- `onBrokenLinks: 'throw'` 会因失效的内部链接失败，日志里会列出具体文件与目标
- 本地 `bun run --filter hestjs-docs build` 可复现同一错误

## 历史说明

本仓库合并前，文档站位于独立仓库 `aqz236/hestjs-docs`，使用 `docusaurus deploy`
推送到 `gh-pages` 分支。迁移后改为 Actions 发布，仓库中的 `gh-pages` 分支仅作回退保留。
