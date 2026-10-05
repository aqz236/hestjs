#!/usr/bin/env bash
# changesets/action 的 publish 入口。
#
# 该 action 会把 publish 的值当作「可执行文件 + 参数」执行，因此不能内联 shell 片段。
#
# 行为：
#   - 未配置 npm 凭据时，只维护版本 PR，跳过发布（避免仓库在接入凭据前每次推送报红）
#   - 已配置时执行 bun run release（turbo build + changeset publish）
#
# 凭据来源二选一：
#   1. 仓库 Secret: NPM_TOKEN（npm Automation token，需对 @hestjs scope 有 publish 权限）
#   2. npm 可信发布（OIDC）：在 npm 包设置中绑定本仓库的 GitHub Actions，
#      此时无需任何 secret，changesets/action 会自动使用 OIDC。
set -euo pipefail

if [ -z "${NPM_TOKEN:-}" ] && [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  if [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ]; then
    echo "::notice::未配置 NPM_TOKEN，但检测到 OIDC 可用，将尝试 npm 可信发布"
  else
    echo "::notice::未配置 npm 凭据，跳过发布（仅维护版本 PR）"
    exit 0
  fi
fi

exec bun run release
