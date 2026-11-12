# P0-247 交付（结算保存米数拦截+未绑定禁静默保存+存量错单自动修正）

## 基线与载荷
- 基线：main 28c42c1（P0-246 销号后 HEAD）
- 载荷 4 文件（1 新+3 改）：meterMismatchFix.ts（新）/useCompletion.ts/App.tsx/releaseNotes.ts

## 三件实证
1. **米数不一致拦截**（useCompletion.save 顶部）：fixedAux.cableMeters===0 ∧ survey.cableDistance>0 → confirm 双选——确定=带入重算（updateForm 电缆+PVC 米数=勘测值，重算后再点保存）；取消→二问=坚持按 0（写留痕 cdz_meter_zero_overrides 后保存）/再取消=中止
2. **未绑定=弹窗绑定禁静默保存**（save 内 `if (pendingCostBind) return false`）：pendingCostBind=既有首未绑定非免费配额非豁免材料；CostBindModal 由 OrderComplete 常驻挂载；「不做绑定」=逐条豁免留痕转 null 后可存（P0-241 生态化口径兼容）
3. **存量错单自动修正**（App.tsx 首个 useEffect，runStartupMaintenance 同款 requestIdleCallback 链）：runMeterMismatchFix=收窄三条件（已完成∧completionCableMeters 空/0∧survey.cableDistance>0∧materialCost≠实时导出）；命中→completionCableMeters 补勘测米数+materialCost/actualProfit/reconciliationProfit 按实时导出三出口同刷（buildFullMaterialCostInput 覆米数）；备份 cdz_v3_metermismatch_backup_<ts>+RUN_AT_KEY cdz_metermismatch_p0247_run_at 幂等+日志文件 cdz_metermismatch_fix_log（from/to）；toast「已自动修正 N 单成本」

## runner 汇总（脱敏假数据 13 断言 FAILS=0）
T1 detect 三态（0vs30 拦/30vs30 放/0vs0 放）/T2 mm-1 命中·mm-2 已带米数不命中/T3 修正 1 单（米数=30+三出口刷新）/T4 RUN_AT_KEY+日志 from/to+备份含原值/T5 幂等重跑=0

## 统一铁规矩自查
- orderCalc/parser 零改动（输入型复用既有出口）；tsc 0+vite build+[BUILD CHECK] 前后置全过
- 真实订单零经手；修正器静默执行不阻断首屏（requestIdleCallback 兜底 setTimeout）
