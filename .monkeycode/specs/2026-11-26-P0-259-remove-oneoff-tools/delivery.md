# 《施工队 · 交付书》P0-259 移除一次性维护工具

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-259-remove-oneoff-tools（基线=main 8bca8068 含 P0-257 合并；核验窗合并/部署）
- 范围：只移除任务书列名的 5 个一次性工具；禁删清单外一行不动

## 载荷（8 文件：2 改 + 5 删 + 1 新增文书）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/pages/SettingsPage.tsx | 删 5 import / 5 菜单项 / 5 render case / 5 id 并集；**SubBrandFixTool 原寄生 ghostTrip case 内，独立为「子品牌价格修正」菜单项（id=subbrandfix，Wrench 图标）**；P0-257 对账菜单项保留零触碰 |
| src/features/settings/components/{PolicyFix,TripFeeZero,BreakerCostBackfill,ProfitAudit,GhostTripFix}Tool.tsx | 删除（5 文件，tree sha:null） |
| src/constants/releaseNotes.ts | 头部 1 条 |
| 本书 | — |

## 自查实证清单
1. 无悬挂引用：全仓 grep 五组件名+五 id = 零命中（ZERO-DANGLING 实证）
2. 菜单不残留：5 项全清；reconcile/subbrandfix 均独立可入（grep 双证）
3. SubBrandFixTool 可访问：独立 case 渲染（寄生关系解耦）
4. build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
5. 边界：禁删清单零触碰；P0-257 对账入口明文保留；App 层 haptics 不在清单零改动
6. 交付本书 ✓

## 复验指引
- 渲染入口：设置页菜单——5 工具消失、「子品牌价格修正」独立出现可点开、「本地对账」仍在
- 回滚点：分支未合并零影响；合并后 revert 本分支

## 教训/避坑
- 寄生渲染（ghostTrip case 内嵌 SubBrandFixTool）删除时须给幸存者独立入口，否则隐性丢功能
- 本单亲历合并竞速：分支基于 main HEAD 建立后，本地工作区必须是**同一** HEAD——本窗首版基于旧 HEAD 险些把刚合并的 P0-257 对账入口顶掉（隐性回滚事故），重放前必核 `branch HEAD == 本地基线`（与 ENV-PITFALLS §D.2.b 同型）
