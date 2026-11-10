# P0-246 交付（比亚迪-方程豹识别修复·词表补子品牌+最长匹配优先+存量修正器）

## 基线与载荷
- 基线：5e78157（甲方裁示三件全修笔）；与当前 HEAD 2889ba6 代码零增量已实证
- 载荷 7 文件（2 新+5 改）：parser-engines.ts / brands.ts / subBrandFix.ts（新）/ SubBrandFixTool.tsx（新）/ SettingsPage.tsx / releaseNotes.ts

## 三件实证
1. **词表补子品牌**：parser-engines 新立 SUB_BRAND_WORDS（方程豹/仰望/腾势/欧拉/坦克/魏牌/星途/捷途/深蓝/阿维塔/埃安/昊铂/乐道/极狐/岚图/问界/智界/享界/尊界，出处=市面真实母子品牌谱系非凭空造词）；brands.ts PILE_BRAND_KEYWORDS 头部插方程豹/仰望/腾势（最长匹配优先序）
2. **最长匹配优先**：extractSubBrand 改子品牌词命中优先于母品牌词——`比亚迪-方程豹`→方程豹；subBrand 余量剥前导连字符/空白/斜杠（`-方程豹`→方程豹）；套装名匹配（L164-169 同款）+品牌行扫描（unshift 优先）+KV 品牌值路径（pickKv 截取后原始值重判归正）三路径同修
3. **存量修正器**：subBrandFix.ts（RULES §9 模板：plan/run 分离+执行前备份 cdz_v3_subbrand_backup_<ts>+幂等重跑即空+留痕 cdz_subbrand_p0246_run_at）+SubBrandFixTool 设置页入口（plan 列明细/run 确认框后执行，甲方裁示 run 生效）

## 设计口径说明（核验重点）
- **子品牌词独立于 KNOWN_BRANDS**：若混入 KNOWN_BRANDS，`比亚迪-方程豹`套装名将同长歧义（3 字=3 字）→禁猜落空——与任务书验收 1 冲突；独立词表+命中优先是满足「方程豹赢+歧义不猜」双约束的唯一解
- 任务书「4 字>3 字」按笔误处理（方程豹实为 3 字），实现语义=子品牌词优先，效果与验收锚点一致
- 车型字段真名=vehicleModel（非 model）已对齐 Order 类型

## runner 汇总（脱敏假数据 14 断言 FAILS=0）
A1 甲方原文=方程豹/A2 subBrand 无脏值/B1 比亚迪-汉 母品牌不动/B2 subBrand=汉（KV 品牌键路径剥前导连字符）/C 方程豹·仰望·腾势直写/D 歧义不猜/E1 plan 命中 3 条/E2 run 3 条+备份/E3 归正方豹+清脏/E4 备份含原值/E5 留痕/E6 幂等重跑即空

对抗样例四条：方程豹/仰望/腾势（甲方原文同款套装名）+无法判定不猜——与任务书锚点逐条对齐。

## 统一铁规矩自查
- orderCalc/parser 回归 20 条零改动（词表层新增，出口零改）
- tsc 0+vite build+[BUILD CHECK] 前置/后置全过
- 真实订单数据零经手


## R2 简化增补（甲方 2026-11-10 二次裁示「直接修就行，不需要留记录」）
- SubBrandFixTool 改一键直修：设置页一个「品牌归正」钮 → 点击直接修 → toast 报「已修正 N 单」（0 单时报「无需修正（0 单命中，幂等）」）
- 无 plan 预览确认页、无修正记录页（run_at 留痕保留作保险）
- 备份（cdz_v3_subbrand_backup_<ts>）+幂等（重跑即空）保留
- 修正器核心 subBrandFix.ts 未动（plan/run 分离保留，仅 UI 层简化）
