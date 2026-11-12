# 《核验窗 · 核验任务书》P0-247

- 单号：P0-247（结算保存米数拦截+未绑定禁静默保存+存量错单自动修正）
- 核验窗进场必读：SUPERVISOR-HANDOVER.md 全文 → task.md → delivery.md → 本任务书
- 基线 28c42c1 → 交付 HEAD（四笔：见仓库）
- 回执二选一：通过=交接书第二节加销号行；打回=本目录 return-R*.md 列 FAIL 实证
- 脱敏假数据测试（真实订单零经手）

## 验收逐条（task.md 第四节）
1. **件1 拦截**：save 时 cableMeters=0 ∧ survey.cableDistance>0 → 弹窗双选（带入重算/坚持按 0 留痕）；留痕键 cdz_meter_zero_overrides
2. **件2 禁静默保存**：save 时 pendingCostBind 非空 → return false 不入库；绑定成功（豁免转 null）后可存；弹窗复用 P0-241 常驻挂载
3. **件3 自动修正**：首进执行一次；收窄三条件；三出口同刷；备份 cdz_v3_metermismatch_backup_+幂等 cdz_metermismatch_p0247_run_at+日志 cdz_metermismatch_fix_log；toast 报数
4. **零超范围**：diff 面恰 4 文件；orderCalc/parser/回归 20 条零改动
5. **实跑**：runner 13 断言 FAILS=0+tsc 0+build 前后检查全过
6. **双版本 diff**：28c42c1 vs HEAD 快照对拍
