# 《核验指引》P0-259 移除一次性维护工具

- 交付分支：task/P0-259-remove-oneoff-tools @ 68b60fc0（二次 rebase 后，合并面干净 behind=0 冲突面）
- 合并方式：git merge --no-ff 或直接快进；合并后按下表逐项核验

## 一、代码面核验（合并后于 main 执行）

| # | 核验点 | 命令/位置 | 期望 |
| --- | --- | --- | --- |
| 1 | 五工具文件已删 | `src/features/settings/components/` 下 | PolicyFixTool/TripFeeZeroTool/BreakerCostBackfillTool/ProfitAuditTool/GhostTripFixTool 五个 .tsx **不存在**（GitHub 界面 404 或目录无） |
| 2 | 悬挂引用清零 | 全仓 grep `PolicyFixTool\|TripFeeZeroTool\|BreakerCostBackfillTool\|ProfitAuditTool\|GhostTripFixTool\|'policyfix'\|'tripfix'\|'breakercost'\|'profitAudit'\|'ghostTrip'` | **零命中** |
| 3 | 幸存者独立入口 | SettingsPage.tsx grep `subbrandfix` | 恰 3 命中（id 并集/菜单项/render case） |
| 4 | 对账入口保留 | SettingsPage.tsx grep `'reconcile'` | 菜单项+case 在（P0-257 成果零触碰） |
| 5 | releaseNotes 双行 | releaseNotes.ts 头部 | P0-259 行在，且 P0-260/R1 各行不被覆盖 |
| 6 | 类型并集干净 | SettingSection 联合类型行 | 无 policyfix/profitAudit/ghostTrip/tripfix/breakercost 五 id |

## 二、构建核验

- `npm run build` → tsc 0 错 + vite 成功 + `[BUILD CHECK] 后置检查通过`（合并前已在分支基线验过，合并后复跑归一）

## 三、渲染冒烟（真机/预览）

- 设置页菜单：「9-10月旧账修正/出差扣点归0/漏保成本回填/利润一致性巡检/幽灵补助纠正」**五个消失**
- 「子品牌价格修正」独立出现且点开正常（原寄生于幽灵补助纠正内，已解耦）
- 「本地对账/备份密钥/导出同步包/本地加解密/变更队列/私仓上传/导入恢复」等清单外工具全部健在

## 四、部署实证（合并触发 workflow 后）

- 线上 `version.json` 新 HEAD 前缀 = 合并提交号前 7 位
- releaseNotes 第一条 = 「设置页瘦身：移除 5 个一次性维护工具…」

## 五、边界守护声明

- 禁删清单零触碰：253 系列六工具/对账/订单查重/App 层 haptics
- 回滚点：合并后 revert 合并提交即恢复五工具

---
施工队 2026-11-27 07:0x
