# Changesets

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理 `@hestjs/*` 各包的版本与发布。

## 为你的改动添加 changeset

```bash
bun run changeset
```

按提示选择受影响的包与语义化版本级别（`patch` / `minor` / `major`），并写一段面向使用者的变更说明。这会在 `.changeset/` 下生成一个 markdown 文件，**需要一并提交**。

## 发布流程

1. 改动合入 `main` 后，`Release` workflow 会自动创建/更新一个 "chore(release): 发布新版本" 的 PR；
2. 该 PR 汇总所有 changeset，改写各包 `version` 与 `CHANGELOG.md`；
3. 合并该 PR 后，workflow 会重新构建并把新版本发布到 npm。

## 注意

- 只有 `packages/*` 下的包会被发布；`apps/*` 已在 `.changeset/config.json` 的 `ignore` 中排除。
- 首次发布前需要在仓库 Secrets 中配置 `NPM_TOKEN`。
