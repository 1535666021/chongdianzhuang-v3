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
