# 《施工队 · 交付书》P0-253-4 变更监听队列

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：推送时点 main 回执为准（载荷相对文件上次由本窗 253-3 @269dcf06 交付，推前逐文件 sha 核验零改动）
- 范围：只做变更监听与今日密文包队列——订阅订单数据变更；30s 防抖生成/更新 today-new.age/today-new.sha256；失败重试只排队密文
- 未做（任务书明令）：私仓上传/跨天滚动/导入恢复——一行未写；明文不落任何中间文件

## 载荷（7 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/changeQueue.ts | 新增：快照 diff（新增/修改 upsert、真删 delete tombstone、软删除=修改走 upsert）→暂存追加（seq 单调）→30s 防抖 flushQueue（暂存→buildExportPackage→age 密文+sha256 双键）→成功清暂存（队列只留密文）/失败暂存保留重试；跨天重置不滚动 |
| src/features/settings/components/ChangeQueueTool.tsx | 新增：状态面板（今日/暂存数/错误）+立即打包+双产物下载 |
| src/features/settings/pages/SettingsPage.tsx | 五 spot 接线逐点 grep 复核（Inbox 复用既有导入，禁重引） |
| src/App.tsx | 启动链 useEffect 挂 startChangeQueue（幂等） |
| src/constants/releaseNotes.ts | 头部追加 1 条 |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. 脱敏假数据增删改触发防抖更新 today 密文：runner（esbuild bundle+`--define:import.meta.env` shim）9 断言 FAILS=0——`diff：未变不入队/修改→upsert/新增→upsert/真删→tombstone` 四态全证
2. 队列只有密文：打包成功后 `cdz_v3_change_queue` 清空 + today-new.age/sha256 双产物存在 + 无 today-new.json 明文键；解密回环得 schema v1 包（counts.total=变更数）
3. 失败重试：无公钥 flush 失败且暂存原样保留（runner `无公钥打包失败且暂存保留 PASS`）
4. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`（修 Order 索引签名兼容：unknown 窄化 orderIdOf）
5. 交付本书 ✓
6. 边界守护：任务书明令三不做零出现；253-2 契约键 cdz_v3_change_queue 保持纯数组格式不变（日标记另键）

## 教训/避坑
- runner 直跑 vite 工程模块须 `--define:import.meta.env=...`（constants/common.ts 顶格读 VITE_APP_VERSION，node 下 import.meta.env 为 undefined 即炸）；orderStore 依赖链带入该常量
- lucide 图标接线前先 grep 既有导入防重名（本单 Inbox 撞重复隔离箱，双 import 被 build 拦下才算捡回——接线后逐点 grep 复核定式再立功）
