# 《核验窗 · 核验任务书》P0-246

- 单号：P0-246（比亚迪-方程豹识别修复）
- 核验窗进场必读：SUPERVISOR-HANDOVER.md 全文 → task.md → delivery.md → 本任务书
- 基线 5e78157 → 交付 HEAD c937a55（六笔：5416117/867d922/8781686/c66470a/6a0552b/c937a55）
- 回执二选一：通过=交接书第二节加销号行；打回=本目录 return-R*.md 列 FAIL 实证
- 脱敏假数据测试（真实订单零经手）

## 验收逐条（task.md 第四节）
1. **A 甲方原文**：`202610140842-比亚迪-方程豹 7kW墙盒-30米基础安装套餐-包工包料
客户姓名：王某某
安装地址：某小区
车型:方程豹/钛7
安装套装:比亚迪-方程豹 7kW墙盒
30米基础安装套餐, 包工包料` → brandName=方程豹（甲方原文进 runner 锚点）
2. **B 对照组**：`比亚迪-汉 7kW墙盒`（KV 品牌键路径）→ brandName=比亚迪/subBrand=汉（剥前导连字符）；子品牌 states of 方程豹/仰望/腾势 states直写各一条；无法判定不猜（歧义行为与基线一致）
3. **词表口径**：子品牌词独立 SUB_BRAND_WORDS（未混入 KNOWN_BRANDS——混入将同长歧义落空，核验窗重点裁该设计口径）；PILE_BRAND_KEYWORDS 头部插方程豹/仰望/腾势
4. **修正器**：plan/run 分离+备份 cdz_v3_subbrand_backup_+幂等重跑即空+留痕 cdz_subbrand_p0246_run_at+设置页入口；3 条脱敏错标单（比亚迪+方程豹 subBrand/仰望车型/腾势文本）plan 3 → run 归正 → 重跑 0
5. **零超范围**：diff 面恰 7 文件；orderCalc/回归 20 条零改动
6. **实跑**：runner 14 断言 FAILS=0+tsc 0+build 前后检查全过
7. **双版本 diff**：5e78157 vs c937a55 快照对拍
