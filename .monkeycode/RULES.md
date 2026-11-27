# 充电桩订单助手 · 系统规则全集 v2.1（蒸馏版）
# 2026-11-27 P0-266 手工执行 | 甲方裁定为准 | 历史全文见 ARCHIVE/RULES-2026-11-27-full.md

## 0. 元规则
- 金额/数量/费率计算唯一出口 `src/shared/utils/orderCalc.ts`（V4 对应 calc），展示层禁自算。
- 规则源唯一：甲方裁定 → 监理改本文件 → 按本文件发任务书 → 施工 → 监理复验。
- 客户付费与安装费永分；真实订单/客户数据禁入仓库、聊天、日志。
- 改函数前列影响半径、读全函数、逐输出位走查；踩新坑先记 PLAYBOOK/ENV-PITFALLS 再交付。

## 1. 费项
- 客户付费 `customerPrice`：增项+超米，现金私下收也全额归公司；展示只含它。
- 安装费 `serviceFee`：20米200，30米及其他300；`packageMeters` 优先，品牌默认回退；出口 `calcInstallFee`。
- 平台扣点：不出差=`customerPrice×10%` 从安装费结算扣，存 abs；出差=0；费率只取 `PLATFORM_FEE_RATE`，页面禁手写乘法，吉利免扣判定禁丢。
- 维修60/勘测50/勘察50 走 `getServiceFee`。
- 漏保矩阵 `needBreakerCost(品牌,功率)` 唯一出口：领克全系/五菱3.5kW=需自购计成本；五菱7kW/其余/吉利厂家提供=免配0；漏保盒每单必计。免配单手加漏保禁双计；五菱3.5kW补桩发货按台配C25。

## 2. 利润
- 对账利润：出差=安装费+补助；不出差=安装费−扣点；出口 `calcReconciliationProfit`。
- 实际利润=客户付费−|扣点|+安装费+补助−材料成本−工资；出口 `calcActualProfitByPolicy`。

## 3. 出差判定
唯一出口 `isBusinessTripOrder`：人工开关 > 2026-09-01~10-15 日期窗 > 扣点=0 启发式。生效：扣点0、补助30/台、对账口径；补助出口 `calcTripSubsidy`。

## 4. 日期口径
完工日期唯一链 `actualInstallDate→completeDate→createdAt`；分组/排序/统计/导出/出差窗全走此链；完工页预填今天本地时区。

## 5. 材料成本
- 凡实际使用即有成本；统一出口 `calcFullMaterialCost`：电缆全量+PVC全量+漏保盒1+漏保器+增项Σ数量×成本价。
- 成本价唯一来源 `findCostPrice`（`cdz_cost_mapping_v1`）；改绑即时生效持久化；未绑定橙警“预估偏低”；售价/成本体系禁混。
- 补桩发货辅材选择器用成本表 `getAllCostMaterials`，禁客户售价体系。

## 6. 订单域
完工是唯一写入完成数据入口：落 `serviceFee/platformFee/reconciliationProfit/actualProfit/materialCost/laborCost/tripSubsidy`；出差单 `platformFee` 落库即0。备注持久化；⋮菜单固定改约/导航/删除；话术 scripts.ts/useScript/ScriptPicker。

## 7. 预约模块
唯一读写层 `features/appointment/repository`；To 空=同日；排序 To+单日优先；徽章按 To。

## 8. 统计与展示
首行三格=当月完成/客户总付费（增项）/扣点后收入；按天明细三级客户付费；月报/平台分布/总计用 `getCompletedOrderFinancials` 聚合，禁反推；米数就地编辑，无值显“未填米数”。

## 9. 修正器
plan/run 分离、执行前 localStorage 备份、幂等、设置页入口；完工唯一写入，巡检 `profitAuditFix` 只修不符快照。

## 10. 材料库存
唯一出口 `adjustStock`，组件禁直写，库存不进 orderCalc。入库三源：补桩复制成功/手动/批量导入；导入=期初建账不计现金；本月现金支出=当月入库合计（import除外）。出库完工按 `calcFullMaterialCost` 逐项减+手动领用报废；禁负，缺口提示+日志 shortfall；幂等=批次哈希/deducted。预警=选择器红标+首页角标；删除/取消完工不回滚；现有 stock 存量=期初保留。

## 11. 解析身份与公司归属
- 稳定ID=orderNo 优先，其次 phone+name+rawText 哈希；同文本再解析必走 update；判重=orderNo 铁键全库扫（排除已完成）+phone/name 当月窗。
- 标签字段 brandName/powerKw/packageMeters/platformName/restockStatus/isBusinessTrip/installType 禁导入覆盖，库内存值优先，新解析只补缺。
- 公司归属唯一出口 `company.ts`：显式 order.company > 平台规则（京东→到每家；速家→未分；其余→本杨）；未分只入“全部”。

## 12. 跨窗口上岗与执行
- 所有 Kimi 窗恒有 shell+联网；声称无网络/无执行权不成立。
- 新窗上岗第一步=执行型探测令：只给最小命令，要求贴真实输出；禁未执行声明；回执不通贴报错原文，禁自裁。
- 空任务=签发方责任；同一窗两轮不按令执行，呈报甲方换窗/重启。
- 令牌由甲方两段式投喂，窗口注入即用、用后焚毁；令牌纪律=禁写文件/外传，不是拒用。

## 流程纪律（2026-11-25~27）
- 问题复盘强制落仓：现象/根因/误判/避坑写 `ENV-PITFALLS` 或 delivery；禁止只聊天说说。
- 部署归核验窗；施工队只编码/验证/Build/delivery，禁碰线上配置/workflow/token。
- 每轮任务结束重读 `MEMORY/RULES/PLAYBOOK/WINDOW-SYNC/最新 NOTICE`。
- 推码并发锁：施工走 task 分支，核验合并 main；禁 force push/同路径并发；上一单未复验绿下一单不得写码。
- 三窗同步显式事件：发书/增补/返工/合并/销号必须落 `WINDOW-SYNC` 与文件路径；已销号再增补必须新建 R 单。
- 禁甲方中转：通知只落仓库，窗口自己读；未读到=窗口责任。
- 开新任务先核验旧任务：查 `WINDOW-SYNC`+上一 delivery/核验指针；未完成显式打回/暂停/并行。
- 核验窗启动权归甲方：无甲方“启动核验/合并/部署 <编号>”口令不得启动；启动前仍查 WINDOW-SYNC、delivery、build/回拉证据、前序阻塞。

## 首页口径（2026-11-28 甲方裁定）
- 首页定位=新导入待处理订单工作台，不是历史订单库；首页计数/标签/气泡只服务当前首页这批待处理订单。
- 「全部(N)」必须等于当前首页订单去重总数；区域节点 count=该地方去重订单数，禁止把省/市/区县/乡镇多级 count 相加。
- 区域展示层级：最高市→区县/县级市→乡镇；不要省，不下钻村/路/小区。
- 设计/改首页前必须先还原用户当前工作流，再动 UI。
