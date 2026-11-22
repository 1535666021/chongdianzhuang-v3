# P0-250 v2 交付（甲方裁示④：原始记录重提取+白名单变体）

## 基线与载荷
- 基线：main 5932fa7（v1 销号 68b771f 后 v2 裁示④笔）
- 载荷 4 文件：parser-engines.ts / anqingAddressFix.ts（重写）/ App.tsx / releaseNotes.ts
- v1 补丁版 anqingAddressFix 已被 v2 覆盖重写（同文件同键族，RUN_AT_KEY 换 cdz_aqreextract_p0250v2_run_at）

## 件1 实证（白名单变体）
- COMPACT_NON_ADDRESS_TOKEN 增补 `安装权益.*`——陈春林补刀单「安装权益到：2026-11-09」token 被剔除（v1 白名单仅收「权益.*」前缀开头，「安装权益到：」不被覆盖——补刀截图两点之一已修）
- 六形态样例全绿：王文亚基础形/陈春林安装权益到/汪洋叠写+10.11 日期/无 VIN 变体/纯日期+电表/潜山市——含补刀两单同款，address 全部规范为 安徽省安庆市+区县+后续，无污染词

## 件3 v2 实证（anqingAddressFix.ts 重写）
- planAddressReextract：rawText 有值（查看原始记录有值）→ parseOrderTextDetailed 重跑 → 新地址≠存值才收
- runAddressReextract：**只写 address**（姓名/电话/品牌/VIN 零触碰实证 B4）；其他字段重跑值≠存值→计数 otherDirty 记日志（不自作主张不回写——甲方口径「其他字段脏单独上报」）；备份 cdz_v3_aqreextract_backup_+RUN_AT_KEY 幂等+日志 cdz_aqreextract_fix_log
- 禁省市补丁：v1 前缀补齐逻辑全删，重提取一律以 rawText 重跑出口为准

## runner 汇总（脱敏 24 断言 FAILS=0）
六形态×2（地址+无污染词）+B1-B8（plan2/run2/重提取净地址/姓名电话零触/已净不动/异地亦重提取/留痕/幂等=0）+回归 20/20
tsc 0+vite build+[BUILD CHECK] 前后置全过

## 备注
- 件2「话」字根因：v2 任务书仍要求溯源。实跑补刀单输出均无「话」字（六形态全过含无污染词断言），维持 v1 结论=存量旧解析痕迹，非现行代码产生源；如甲方有含「话」字的新粘贴样本请投喂，我定向复跑
- 汪洋补刀单两点（怀宁前置+日期）：叠写去重+日期剔除 P0-249 已有，六形态实证覆盖
