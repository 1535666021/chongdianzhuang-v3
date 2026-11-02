# P0-230 复验打回（R1）：回填函数口径三处错，重做

【先读 ONBOARDING.md → RULES.md → PLAYBOOK.md，再读 task.md 原文与本草稿核对】

## 通过的
- R1 去规则 ✅：company.ts isDaomeiOrder 只认显式 company 字段、resolveCompany 京东→unassigned，与书一致。
- 回填函数用 resolveDoneDate 回退链取完工日 ✅（口径工具用对了）。

## 打回项：backfillCompanyByDoneDate 三处错，整函数重做
书规三段口径（task.md 背景第 3 条原文）：完成时间 10/1–11/2 → daomei；完成时间 <10/1 → **benyang**；≥11/3 新单**不填**。

1. ❌ **口径方向反了**：你写成 `resolveDoneDate(o) >= '2026-11-03' → daomei`——把书规明确"不填、挂未分等用户选"的新单填成了到每家；而真正该填的 10/1–11/2 段一个没填。
2. ❌ **漏平台条件**：书规处理对象是"平台（platformName||platform）含京东"的单。你没有任何平台过滤——**万帮/万联/速家/奇瑞等其他平台的已完成新单会全部被你错填成到每家**，这是跨平台数据污染，比口径错更严重。
3. ❌ **benyang 段整体缺失**：<10/1 的已完成京东单应回填 benyang，你的函数里没有这个分支。

## 次要偏离（一并修正）
- 挂点位置：task.md R2 写明"挂载于 purgeLegacyAppointmentDates **之后**"，你挂在之前。两者无数据依赖，但按书执行。

## 重做要求
- 按书规三段口径重写：条件=平台含京东 + 无显式 company + status已完成；10/1≤完工日≤11/2→daomei；完工日<10/1→benyang；≥11/3 一律不动。
- 幂等：已有 company 字段跳过；零命中零写入；console.log 留痕各段回填数。
- 挂点挪到 purge 之后。
- **交付方式 v2 现已生效**（你上次 push 早于教材入库 23 秒，本次免究）：交付必须写同目录 delivery.md，会话只报指针。

回归 19/19 + build 过 + 快照（实证声明逐字核过）。单轮交付，push main。
