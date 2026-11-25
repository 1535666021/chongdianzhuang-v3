# 《施工队 · 任务书》P0-254

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

## 目标
优先修复 GitHub Pages 部署失败；P0-251/P0-252/P0-253A/P0-253B 全部暂停，恢复由监理另发。

## 实证
失败运行 build 成功、Upload artifact 成功，但 `actions/deploy-pages` 报：Fetching artifact metadata failed / No artifacts named "github-pages" were found。当前 `.github/workflows/deploy.yml` 的 `permissions` 缺少 `actions: read`，且仍为单 job 旧版 actions。

## 已改口径
- `permissions` 增加 `actions: read`。
- 拆成 `build`/`deploy` 两 job，`deploy.needs=build`。
- 升级 Node 24；`checkout@v5`、`configure-pages@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`。

## 验收
1) push/workflow_dispatch 后 Actions 绿，Deploy to GitHub Pages 成功。
2) 不再出现 `No artifacts named "github-pages"`。
3) 仍保留 build output 的 appointed/trash 校验和 .nojekyll。
4) 交付 `.monkeycode/specs/2026-11-25-P0-254-deploy-fix/delivery.md`，附运行链接与自查清单；其他暂停任务不得顺手施工。

施工队自行部署
监理窗口 · 签发完毕
