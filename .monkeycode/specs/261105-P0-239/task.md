《施工队 · 任务书》

编号：P0-239　签发：监理窗口　日期：2026-11-05　状态：待施工
基线 HEAD：cef61e2（P0-238 交付顶）
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 背景（甲方报障实录+口径裁定，2026-11-05）═══
甲方实拍单：卡片胶囊显示"不出差"，费用明细实际利润却 +30 出差补助（306.10=安装费300+补助30−材料23.90）。
甲方裁定（本单最高指令）：**出不出差唯一判断=订单胶囊字段 order.isBusinessTrip——胶囊写"不出差"就是不出差，undefined（从未点过）=不出差；日期窗与扣点启发式全部废除**。
三连环根因（监理已逐行实证，HEAD=cef61e2）：
1. orderCalc.ts isBusinessTripOrder 末行 `return absPlatformFee(order) === 0`——客户付费 0 的单扣点天然 0，被误判出差；吉利单免扣 platformFee 恒 0 同样全灭；
2. useCompletion profit memo `order.tripSubsidy ?? calcTripSubsidy(isBusinessTripOrder(order))` 存值优先——首次完工被误判落 30 后，判定逻辑永久失效；
3. calcActualProfitByPolicy / calcReconciliationProfit 补助项直接吃 `order.tripSubsidy || 0` 存值，出口零判定兜底。
另注：胶囊本体（OrderCardTags.tsx `{order.isBusinessTrip === true ? '出差' : '不出差'}`）与点击切换（OrderCard.tsx onTripToggle 已连带 tripSubsidy 清 0）均正确，禁动。

═══ 实证锚点（行号已核对，基线 HEAD=cef61e2）═══
- orderCalc.ts isBusinessTripOrder：`if (typeof order.isBusinessTrip === 'boolean') return order.isBusinessTrip`（保留首行）→其后日期窗+`return absPlatformFee(order) === 0` 全段废除改 `return false`；
- orderCalc.ts calcTripSubsidy(isTrip: boolean)：30/0 出口不动；
- orderCalc.ts calcActualProfitByPolicy 末行：`(order.tripSubsidy || 0)` 补助项改实时判定；
- orderCalc.ts calcReconciliationProfit：`const subsidy = order.tripSubsidy || 0`+出差分支同款问题；
- useCompletion.ts profit memo：`const tripSubsidy = order ? (order.tripSubsidy ?? calcTripSubsidy(isBusinessTripOrder(order))) : 0`；
- "纠正为不出差"链接（费用明细页，施工队自行定位——疑 OrderDetail/OrderForm 纠偏入口）只改 isBusinessTrip 开关未清 tripSubsidy 存值，改与胶囊同通道。

═══ 任务 ═══
1. **判定唯一化**（甲方裁定）：isBusinessTripOrder=boolean 显式字段优先；非 boolean（undefined）一律 false。**删除日期窗（POLICY_FIX_TRIP_START/END 分支）与扣点启发式（absPlatformFee===0）两条兜底**；isBusinessTripOrder 签名同步收窄（不再读 completeDate/platformFee，调用方零改动）。
2. **出口兜底**：calcActualProfitByPolicy 补助项改实时——`calcTripSubsidy(order.isBusinessTrip === true)`（true 才 30，false/undefined 恒 0），tripSubsidy 存值参数保留在签名（写入侧留痕不断链）但出口计算不再消费；calcReconciliationProfit 同改（出差分支 serviceFee+subsidy 的 subsidy 同步实时）。
3. **写入侧**：useCompletion profit memo 补助行改实时同口径（不再存值优先）；已完工单编辑态保存同样落新口径。
4. **纠偏通道统一**："纠正为不出差/出差"入口（定位后实证行号写 delivery）改与胶囊 onTripToggle 同通道——updateOrder 连带写 `{ isBusinessTrip: x, tripSubsidy: x ? TRIP_SUBSIDY_PER_UNIT : 0 }`。
5. **存量修正器**（RULES §9 铁律：plan/run 分离+执行前 localStorage 备份+幂等+留痕+设置页入口）：已完成单扫 `order.isBusinessTrip !== true && (order.tripSubsidy || 0) > 0` → tripSubsidy 归 0（plan 预览列明细：姓名/单号/原值）；platformFee 一并核对列报告（新判定下不出差单应=付费×10%，付费 0 单本就 0，只列不一致不动手）。
6. **并入 P0-238 待裁 2 项**（甲方见报障现场即实质认同）：
   a. calcFullMaterialCost 漏保兜底命名缺口：breakerType 空且 find(/漏保|漏电保护/ && !盒) 落空时入 unmatched 橙警（静默 0 禁止）；
   b. finance 页 CostDetail:136 实际利润公式行补 tripSubsidy/laborCost 两项展示（数值本就正确，展示闭合）。
7. 解析器回归样本基线 20 条禁动；releaseNotes.ts 头追加一条。

═══ 验收（核验窗按此验）═══
1. 新增账本对拍场景（P0-238 盲区补网，写进临时 runner 跑通并留输出摘要）：**客户付费 0、未点胶囊（isBusinessTrip undefined）、30 米常规单**——期望 tripSubsidy=0、实际利润=安装费−材料，任何环节不得出现 +30；
2. 胶囊三态走查：undefined 显"不出差"/true 显"出差"可切回/点切换补助连带清 0——三态与计算全一致；
3. 旧窗口期出差老单（isBusinessTrip undefined、09-01~10-15 完工）：新判定下显不出差——**属甲方裁定预期行为**，delivery 列说明即可（真出差的由胶囊点标或修正器补）；
4. 存量修正器 plan/run 全链+备份+幂等（重跑即空）；
5. 回归 20/20 全绿 + npm run build tsc 0 错；
6. delivery.md 末尾自查实证清单（每验收一项一行证据：文件:行/命令/输出摘要），虚报一处全单退件。

═══ 交付 ═══
push 一单一次提交（message 含 P0-239）+ specs/261105-P0-239/delivery.md，会话只报一行指针。基线 HEAD=cef61e2。