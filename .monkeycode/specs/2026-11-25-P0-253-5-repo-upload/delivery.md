# 《施工队 · 交付书》P0-253-5 私仓上传

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：e9cc9e39（本窗 253-4 载荷；推前逐文件 sha 核验零改动）
- 范围：只做设置页私仓配置（owner/repo/token）+ 手动上传 today-new.age/.sha256 + 维护 base-current/today-new 两份
- 未做（任务书明令）：自动变更监听（253-4 已有）/导入恢复/双向同步/跨设备轮换——一行未写

## 载荷（5 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/repoUpload.ts | 新增：配置读写（REPO_CFG_KEY 本机保存）；putFile Contents API（先 HEAD 取 sha 再 PUT，401/403/404/422 分类文案）；uploadSyncPackage（today 两文件必传，私仓无 base 时以当前 today 顺带建基线）；断网 30s→60s→120s 自动退避重试（成功/手动归位清零），失败产物键原样保留 |
| src/features/settings/components/RepoUploadTool.tsx | 新增：三输入配置 + 保存 + 上传 + 取消重试 + 上次上传回执；token 仅 password 输入 |
| src/features/settings/pages/SettingsPage.tsx | 五 spot 接线逐点 grep 复核 |
| src/constants/releaseNotes.ts | 头部追加 1 条 |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. token 错误清晰提示且不入日志：runner 7 断言 FAILS=0——401→`私仓 token 无效或权限不足`；404→`私仓不存在或无权访问`；断网→`网络错误，密文已保留，可稍后重试`；console.log 捕获断言零泄漏（`token 不入日志 PASS`）
2. 私仓只有 base/today 两份：首次上传恰 4 PUT（base+today 各 age/sha256）且 baseCreated=true；二次上传仅 2 PUT 覆盖 today、base 不动；跨天滚动=PUT 同名覆盖即删旧
3. 断网重试不丢密文：401/断网后 `cdz_v3_today_age/sha256` 双键原样保留（runner 双证）；scheduleRetryWithBackoff 自动退避
4. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
5. 交付本书 ✓
6. 边界守护：fetchImpl 可注入（runner 全 fake，零真实网络）；token 仅存本机 localStorage、零日志零交付零仓库；监听/恢复/双向一行未写

## 教训/避坑
- 浏览器直调 api.github.com 走 Contents API 需两次请求（HEAD 取 sha + PUT），422 常见原因是分支保护/路径冲突，单列文案
- btoa 仅接受 Latin1：中文 sha256 说明行先 unescape(encodeURIComponent()) 再 btoa（本单文件名说明含中文风险已处理）

## 部署结果（核验窗 11-26 00:55）
- 部署执行：核验窗（RULES L70-72）；deploy 手动触发制
- 部署 run：45657953999 @c0df456 success（手动 dispatch）
- 回拉核验：线上 version.json=c0df456 与 HEAD 全同；notes 含本单私仓上传说明
- 结论：P0-253-5 核验通过+部署成功，销号成立

## 核验结论修正（核验窗 11-26 00:52）
- 本单由「销号」改「打回」：任务书功能点 2 owner/repo 白名单校验缺实现（详见 return-R2535.md）
- 已部署版本功能可用，整改后重新交付并随新部署覆盖

## 打回整改（2026-11-26，核验窗 return-R2535 裁定）

- 打回点：功能点 2「owner/repo 白名单校验」实现未见——初版仅三非空校验
- 整改：`validateRepoConfig`（repoUpload.ts）——owner `^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$`（字母数字连字符≤39，首尾禁连字符=GitHub 真规则，较裁定建议加严）；repo `/^[a-zA-Z0-9._-]{1,100}$/`；双防线：UI 保存前红条拒绝 + `uploadSyncPackage` 入口拦截（非法配置零 fetch 外呼）
- 整改实证：runner 13 断言 FAILS=0（合法/单字符/39 边界放行；下划线/首尾连字符/超 39/斜杠/超 100/空白 token 拒；上传入口拦截零外呼；合法回归可传）；build tsc 0 + 双 build-check 通过
- 环境坑（入复盘）：/mnt/agents 盘 rm node_modules 超 120s 且禁符号链接（Operation not supported）→ 回 /tmp 工作区装包 45s 完成；ENV-PITFALLS 待补此两坑
