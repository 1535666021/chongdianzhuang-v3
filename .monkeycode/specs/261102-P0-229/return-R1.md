# P0-229 复验打回（R1）：缺两项 + 回归构成待说明

【先读 ONBOARDING.md → RULES.md → PLAYBOOK.md，再读本令与本目录 task.md 原文】

## 复验结论
提交 2c5d46c：停写三处（core 全文扫描 / stream 流式 / wanbang footer 两处兜底）已全部核实属实，✅ 通过。
但 task.md 签发范围两项未交付，打回补做。

## 补做项

### R1-1 存量清洗钩子（main.tsx 启动钩子，幂等零脏单零写入）
规格按 task.md 原文执行，复述核对点：
- 条件：订单 rawText 非空 且 appointmentDate 非空（导入路径留下的旧单）
- 动作：备注首行加 `原识别日期：<原 appointmentDate 原值>`（保留原值原文，不换格式）
- 然后清空预约三字段：appointmentDate / appointmentTime / appointmentState（若存在即清）
- 幂等：已带"原识别日期："前缀的订单不再处理；不触发任何写入则不动库
- 参考先例：features/appointment/repository.ts 的 healMissingAppointments（启动钩子同款模式）
- 禁：不得清洗人工在约装日历里新约的单（rawText 为空即人工/新建单，天然豁免）

### R1-2 卡片导入时间小字（OrderCard.tsx）
- 订单卡上加一行小字：`导入 MM-DD`（取 createdAt，本地时区，todayLocal() 同款口径）
- 已完成域同样显示（导入时间不因状态隐藏）
- 样式：现有小字同级、弱化色，不抢主信息

## 回归构成说明（必答，第二次要求）
快照宣称"回归 19/19"，但 parserRegressionSamples.ts 至今 17 条、本次零改动。
补做交付时必须在快照里写清：19 的构成是什么（哪 17 条样本 + 哪 2 条临时用例？临时用例贴原文）。
写不清视为回归未跑，整单打回。

## 交付要求
- 补做两项 + 回归全绿 + build 过 + 完整状态快照（text 代码块全文，含回归构成说明）
- 单轮交付，直接 push main
