# 《施工队 · 交付书》P0-253-1 备份密钥

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：cc8927a1（拉包时点 main，仅文书笔 RULES.md 与载荷零重叠）
- 新 HEAD：推送后回执为准
- 范围：只做设置页「备份密钥」（age 密钥对生成；公钥持久化；私钥仅下载一次）
- 未做（任务书明令）：变更监听/加密上传/私仓 token/导入恢复——一行未写

## 载荷（6 文件，diff 面全量对拍 0 越界）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/ageKey.ts | 新增：x25519 keygen + bech32(公钥)/bech32m(私钥) 编码；localStorage 唯一写入键 cdz_v3_backup_age_pubkey 只存公钥 |
| src/features/settings/components/BackupKeyManager.tsx | 新增：三态 UI（未生成→生成引导；持私钥→下载仅此一次；常态→公钥展示+复制+二次确认重生成） |
| src/features/settings/pages/SettingsPage.tsx | 接线 4 处（图标/import/菜单项/section case），只增不改 |
| src/constants/releaseNotes.ts | 头部追加 1 条 |
| package.json / package-lock.json | 新增 @noble/curves@2.4.0 + @scure/base@2.4.0 |

## 自查实证清单（对应验收逐条）
1. 可生成密钥并显示/复制公钥：runner 直跑编译后 ageKey.ts（esbuild bundle→node）——`公钥格式 age1+58 小写 PASS`、`公钥 bech32 解码回环 PASS`；组件公钥区只读框+复制钮（copy 成功绿勾 1.5s）
2. 私钥下载后软件内不保存：三证——① runner `localStorage 仅存公钥一条 PASS`（mock 存储注入持久化函数，全程仅写公钥）；② 组件源码 grep `localStorage|setItem` 零命中（仅注释）；③ 组件源码 grep `secretKey` 零命中（私钥只经 buildSecretKeyFileContent 进下载 Blob，setTimeout 500ms 后内存即焚）
3. npm run build 通过：build-check 前置→tsc 0 错→vite build→`[BUILD CHECK] 后置检查通过`
4. 交付本书：即本文件，落 specs/2026-11-25-P0-253-1-key/delivery.md
5. 边界守护：grep 载荷全目录 255/brand-price 零命中（x25519 曲线名除外）；253-2~6 与 P0-255 一行未动；真实明文/私钥/token 零入库

## 格式与依赖说明
- age 私钥标准格式：bech32m + HRP `age-secret-key-`，大写展示 `AGE-SECRET-KEY-1...`（64 字符）；公钥 bech32 + HRP `age`，`age1...`（62 字符）——与 age 官方工具互通
- @noble/curves v2 导入路径须带 `.js` 后缀（`@noble/curves/ed25519.js`），keygen API=`x25519.keygen()`（v1 的 utils.randomPrivateKey 已移除）
- 更新说明：设置页可生成 age 备份密钥：公钥本机保存，私钥只给下载一次

## 复验指引
- 渲染入口：设置页菜单「备份密钥」→ section `backupkey` → BackupKeyManager
- 关键行：ageKey.ts L27-35（keygen+编码）/L37-45（持久化只写公钥）；组件 L42-52（生成+只存公钥）/L72-86（下载+即焚）
- 功能冒烟：设置→备份密钥→生成密钥对→下载私钥（浏览器弹下载 .txt）→刷新页面→功能态正常、localStorage 仅 cdz_v3_backup_age_pubkey 一条

## 教训/避坑（2026-11-25 复盘强制落仓）

1. **多 spot 文本替换必须逐 spot grep 复核**（本单亲历 FAIL→已修）
   - 现象：菜单入口行未落上，功能在设置页进不去。
   - 根因：python str.replace 目标串缩进写错（6 空格 vs 实际 4 空格），replace 未命中无报错静默跳过。
   - 误判：assert 只查类型串存在，没查菜单项锚点。
   - 定式：N 处替换 = N 次 grep 复核（锚点行号+内容双核），禁只查总数。
2. **Pages 部署 500 = 服务端瞬时故障，非代码问题**
   - 现象：build job success，deploy step `Failed to create deployment (status: 500)`。
   - 定式：HEAD 与 run 一致时 re-run 该 run 归正（勿推空提交）；**2026-11-25 甲方裁定部署归核验窗口，施工队自此禁碰部署/线上配置/workflow 密钥**。
   - 本单部署已由核验窗链路完成：线上 version.json=4a450f5（含本单 releaseNote，只读校验实证）。
3. **@noble/curves v2 API 变更**：导入路径须 `.js` 后缀（`@noble/curves/ed25519.js`）；`utils.randomPrivateKey()` 已移除，改 `x25519.keygen()` 返回 {secretKey, publicKey}。
   - 定式：新装依赖先 node 单行实测 API 形状再写码，禁凭 v1 记忆。
4. **curl 命令行参数长度上限**：package-lock 级大文件 push 用 `-d @payload.json` 走文件，禁命令行内联 JSON（Argument list too long 亲历）。

## 部署结果（核验窗 11-26 00:18）
- 部署执行：核验窗（RULES L70-72 甲方裁定 11-25）
- 部署方式：销号笔 push main 触发 deploy workflow 自动部署
- 部署 run：45652586898 @742de7a success（手动 dispatch 触发，deploy 已改手动触发 e4ec4ad）
- 回拉核验：线上 version.json=742de7a 与 HEAD 全同；notes 第二条=本单 age 密钥说明
- 结论：P0-253-1 核验通过+部署，销号成立
