# 《施工队 · 交付书》P0-253-2 导出同步包

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：948b3ea3（拉取时点 main；releaseNotes 在他窗 P0-255 笔记之上 rebase 合并，零覆盖）
- 范围：只做手动「导出同步包 JSON」——schema v1 五要素（schemaVersion/exportedAt/baseDate/changes/counts）；changes 支持 upsert/delete tombstone，按 entity+key 去重保留最后一条
- 未做（任务书明令）：加密/自动监听/上传——一行未写；队列入库监听归 P0-253-3，本单只按契约读取

## 载荷（5 文件，对 948b3ea3 diff 面零越界）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/exportSync.ts | 新增：schema 类型 + dedupeChanges + countChanges + buildExportPackage + validateExportPackage 离线校验器 + readPendingChanges（队列契约 CHANGE_QUEUE_KEY=cdz_v3_change_queue，P0-253-3 按此格式写入） |
| src/features/settings/components/ExportSyncTool.tsx | 新增：设置页手动导出钮→读队列→组包→自校验→下载 cdz-sync-<baseDate>.json；失败红条拦 |
| src/features/settings/pages/SettingsPage.tsx | 接线 5 处（图标/import/类型/菜单项/case），逐 spot grep 复核全中 |
| src/constants/releaseNotes.ts | 头部追加 1 条（在 P0-255 笔记之上 rebase，未覆盖他窗笔记） |
| .monkeycode/specs/2026-11-25-P0-253-2-export-schema/delivery.md | 本书 |

## 自查实证清单（对应验收逐条）
1. 脱敏假数据导出可被离线校验：runner 直跑编译后 exportSync.ts（esbuild bundle→node），脱敏样例（王某某/13800000000/CDZ-TEST-001）`离线自校验通过 PASS` + `schema 五要素齐 PASS`；validateExportPackage 纯函数零依赖，导出包自描述可脱离软件校验
2. 重复导出不重复计数：`同键去重保留最后一条 PASS`（同 key 两条 upsert 合并取后者）+ `counts 去重后不重复计数 PASS`（total=2/upserts=1/deletes=1）；反向四证：delete 缺 deletedAt 被拦 / counts 不一致被拦 / schemaVersion=2 被拦 / 坏 op 被拦 / 重复键被拦，全 PASS
3. npm run build 通过：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
4. 交付本书：落 specs/2026-11-25-P0-253-2-export-schema/delivery.md
5. 边界守护：queue 读取当前恒空=导出合法空包 PASS + 写入回环 PASS；任务书明令三不做零出现；P0-255 他窗载荷零触碰（rebase 实证：P0-255 note 保留）

## 给 P0-253-3 的队列契约（本单立）
- localStorage[cdz_v3_change_queue] = ExportChange[] JSON 数组，追加写
- ExportChange = { seq:number, entity:string, key:string, op:'upsert'|'delete', data?:object, deletedAt?:string }；delete 必须带 deletedAt（校验器强制）

## 部署
- 按 2026-11-25 裁定「部署归核验窗口」：本窗只推码不碰部署；workflow 若再遇 Pages 500 由核验窗 re-run 归正

## 教训/避坑（复盘强制落仓）
- 多窗并行常态：推前必查远端目标文件 sha（本单实证 releaseNotes 被 P0-255 窗动过），rebase 合并禁直推覆盖——与 ENV-PITFALLS §D.2.a 同型
- 接线五 spot 替换逐 spot grep 复核（253-1 教训复用）
