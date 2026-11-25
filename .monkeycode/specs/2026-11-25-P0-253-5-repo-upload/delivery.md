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
