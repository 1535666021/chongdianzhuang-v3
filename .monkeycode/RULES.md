# 充电桩订单助手 · 系统规则全集 v2.0
# 2026-11-03 蒸馏 | 甲方裁定为准 | 过程记录压结论，废止标【已废止】

## 0. 元规则
R-0.1 计算/显示唯一出口：金额数量费率只在 src/shared/utils/orderCalc.ts；展示层只读存储快照或 orderCalc 出口，禁自算。
R-0.2 规则源唯一：甲方裁定 → 监理改本文件 → 按本文件签发任务书 → 施工 → 监理复验。
R-0.3 客户付费与安装费永分 + 真实订单数据禁入仓库（见 §1、PLAYBOOK §6）。
R-0.4 影响半径：动函数前列全部消费点清单；函数从头读到尾；新场景所有输出位逐处走查。
R-0.5 开工强制：接任务书先三读（MEMORY→RULES→PLAYBOOK）；踩新坑先记 PLAYBOOK 再交付。

## 1. 费项
R-1.1 客户付费=customerPrice：增项+超米（超米米数×结算价），现金私下收、不经平台、全额归公司；客户付费类展示只含它。
R-1.2 安装费=serviceFee：20米200/30米及其他300，不分品牌平台（packageMeters 优先回退品牌默认）；车企结算给公司，与客户无关；出口 calcInstallFee。
R-1.3 平台扣点：不出差=customerPrice×10% 从安装费结算里扣（20米实结190/30米290），存值取 abs；出差=0；费率唯一来源 PLATFORM_FEE_RATE；禁页面手写乘法（吉利免扣判定禁丢）。
R-1.4 独立费项：维修60/勘测50/勘察50；关键词走 getServiceFee。
R-1.5 漏保矩阵（needBreakerCost 唯一出口，按品牌+功率）：领克全系/五菱3.5kW=需自购计成本；五菱7kW/其余品牌/吉利厂家提供=免配0成本；漏保盒每单必含1个永远计成本。免配单手加漏保行由矩阵接管不计价禁双计；五菱3.5kW 补桩发货按台自动配漏保C25。

## 2. 利润（双口径，出口均 orderCalc）
R-2.1 对账利润：出差=安装费+补助；不出差=安装费−扣点。出口 calcReconciliationProfit。
R-2.2 实际利润=客户付费−|扣点|+安装费+补助−材料成本−工资。出口 calcActualProfitByPolicy。

## 3. 出差判定（isBusinessTripOrder 唯一出口）
优先级：人工开关 order.isBusinessTrip → 日期窗 2026-09-01~10-15 → 启发式扣点=0。生效：扣点0/补助30/对账口径。补助 30元/台仅出差单（calcTripSubsidy）。

## 4. 日期口径
完工日期唯一链 resolveDoneDate=actualInstallDate→completeDate→createdAt，分组/排序/统计/导出/出差窗口全走此链；完工页预填今天本地时区，appointmentDate 禁入完工口径。

## 5. 材料成本（凡实际使用即有成本，超不超米都算）
R-5.1 统一出口 calcFullMaterialCost：电缆全量+PVC全量+漏保盒1+漏保器（按§1.6矩阵）+增项Σ数量×成本价；勘测预估/完工核算/工资估算三链全经此。
R-5.2 成本价唯一来源=成本绑定表 findCostPrice（cdz_cost_mapping_v1）；弹窗行内/设置页改绑即时生效持久化；禁品牌分表、禁售价充成本；未绑定材料显橙警"预估偏低"。增项售价体系与成本体系分离禁混。
R-5.3 补桩发货辅材选择器=成本表全量条目（getAllCostMaterials，含 custom_），禁客户售价体系/订单增项列表。

## 6. 订单域
R-6.1 完工=唯一写入完成数据入口：落库 profit 字段组（serviceFee/platformFee/reconciliationProfit/actualProfit/materialCost/laborCost/tripSubsidy）；出差单 platformFee 落库即0。
R-6.2 备注（surveyNote/notes）持久化订单对象，重开自动带入；⋮菜单固定3项=改约/导航/删除；话术 scripts.ts 15条硬编码+useScript 渲染+ScriptPicker。

## 7. 预约模块
唯一读写层 features/appointment/repository（含 legacy 导入映射）；To 留空=同日；排序=To+单日优先；徽章按 To。

## 8. 统计与展示
首行三格=当月完成/客户总付费（增项）/扣点后收入；按天明细三级客户付费（每单金额+已收未收徽标/天标题合计/区块底月总计+利润总计）；月报/平台分布/总计=逐单 getCompletedOrderFinancials 聚合，禁反推重算；米数卡片就地编辑，无值显"未填米数"。

## 9. 修正器
plan/run 分离+执行前 localStorage 备份+幂等+设置页入口；完工=唯一写入入口，巡检（profitAuditFix）只修不符快照。授权记录：2026-10-16 出差单 platformFee 归0（含存量，修正器批量自修复）。

## 10. 材料库存（adjustStock 唯一出口，组件禁直写，库存不进 orderCalc）
R-10.1 入库：成本表条目均可入（桩=特殊条目金额恒0只计数）；三源=一键补桩复制成功/手动/批量导入，写日志按当时绑定价，绑定价变动不动历史；导入=期初建账不计现金；本月现金支出=当月入库合计（import 除外），库存页顶部按月可翻不进统计页。
R-10.2 出库：完工落库按 calcFullMaterialCost 逐项减（增项/漏保盒/漏保器按支，电缆PVC按米）+手动领用报废；禁负下限0，缺口进完工弹窗提示+日志 shortfall；幂等=批次哈希/订单 deducted 标记；名称归一=精确名→别名→自动新建。
R-10.3 预警：选择器余量红标+首页库存角标（stock≤minStock 且 >0）；桩结余=公司核销凭据；已完工单删除/取消完工不回滚库存；现有 stock 存量=期初保留。

## 11. 解析身份与公司归属
R-11.1 稳定ID=orderNo 优先，其次 phone+name+rawText 组合（djb2 哈希）；同文本再解析 ID 恒等必走 update 分支不新增；判重双轨=orderNo 铁键全库扫（排除已完成）+phone/name 当月窗防误并。
R-11.2 标签字段（brandName/powerKw/packageMeters/platformName/restockStatus/isBusinessTrip/installType）禁任何导入路径覆盖，以库内存值为准，新解析只补空缺；一切机器写路径让位人手：已存非空即跳过。
R-11.3 公司归属唯一出口 company.ts：显式 order.company > 平台规则（京东→到每家；速家→未分；其余→本杨）；未分单只入"全部"口径，不入两公司账。
