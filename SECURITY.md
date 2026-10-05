# 安全策略

HestJS 目前是仓库内自用的框架，不发布到 npm：所有包都是 `private`，
通过 `workspace:*` 直接引用源码。因此安全修复跟随 `main` 分支，
没有版本发布线需要维护。

## 上报漏洞

请不要用公开 Issue 上报安全问题。请用 GitHub 的
[私密漏洞上报](https://github.com/aqz236/hestjs/security/advisories/new) 提交，
并在其中包含：

- 受影响的包（`@hestjs/core` / `validation` / `openapi` / `cqrs`）
- 复现步骤或最小示例
- 影响范围（例如：能否绕过校验、能否读到其他模块的实例）
- 你希望的公开时间

我们会在 72 小时内确认收到，并在修复后致谢（如果你愿意具名）。

## 不在范围内

- 需要先拿到开发者本机权限的攻击
- 依赖项自身的漏洞（请直接向对应上游项目上报，例如 Hono、zod）
- 仅影响 `apps/example` 的问题
