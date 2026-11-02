# P0-229 复验打回（R2）：清洗钩子三处违背书规，重做

【先读 ONBOARDING.md → RULES.md → PLAYBOOK.md，再读本目录 task.md 与 return-R1.md】

## 本次交付核收
- OrderCard 导入时间小字 ✅（MM-DD/本地时区/弱化色，与书一致）
- 挂点顺序 ✅（purge 在 heal 之前，先清日期再降级，同一次启动闭环）
- 增量纯净 ✅（3 文件最小 diff，载荷==打回范围）
- 回归 19/19 构成说明 ✅（19 条顶层样本已对拍实证，"19/19"悬案销号；监理台账旧数 16/17 为 P0-219 前旧值，已更正）
- 实证纪律指正（不罚但记）：快照称"HEAD 无 main.tsx"不成立——main.tsx 存在（runStartupMaintenance 定义在 App.tsx、main.tsx:71 调用）。挂点本身没错，但实证声明必须逐字核过再写书。

## 打回项：purgeLegacyAppointmentDates 三处违背书规，整函数重做
书规原文（task.md 与 return-R1.md 双重要求）三步，你只做了一步：

1. ❌ **缺备注留痕**：书规要求清空前先把原值写进备注首行 `原识别日期：<原 appointmentDate 原值>`（保留原文不换格式），你直接清掉不留痕——旧单日期来源事后无法对账，违背书规。
2. ❌ **缺 rawText 条件**：书规要求只处理 `rawText 非空` 的单（旧解析器遗留），你清所有 appointmentDate 非空单——**人工在约装日历新约的单会被误清**，这是数据风险不是洁癖，必须加回。
3. ❌ **三字段只清一个**：书规要求清空 appointmentDate / appointmentTime / appointmentState（若存在即清），你只清 appointmentDate。

## 重做要求
- 按书规三步完整重做该函数：rawText 非空 → 备注首行加"原识别日期：<原值>"→ 清三字段
- 幂等口径不变：已带"原识别日期："前缀的订单不再处理
- 回归 + build + 完整状态快照，快照里实证声明逐字核过再写
- 单轮交付，直接 push main
