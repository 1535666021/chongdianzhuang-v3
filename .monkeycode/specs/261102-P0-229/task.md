《施工队 · 任务书》
编号：P0-229　优先级：P0　日期：2026-11-03
先读 MEMORY.md 再读 RULES.md 再读本任务书，读完再动手；踩新坑先记 PLAYBOOK.md 再交付。

一、任务一句话
导入订单日期一刀切：原文日期不再进预约字段（进备注）；卡片加"导入时间"小字；存量旧单启动时顺手清洗。京东批量删/归档等其余事项甲方明确后期再做，本书不含。

二、甲方口径（2026-11-03 拍板，四条）
1. 一刀切：智能识别/批量导入时，原文里的任何日期一律不进预约日期，带日期的行原文落备注；
2. 存量顺手洗：已错进预约字段的历史单，预约日期清空、原值挪进备注；
3. 卡片加一行小字显示导入时间；
4. 其他（京东单批量处理等）后期再做，本书禁超范围。

三、现状实证（监理已核 HEAD，照此下刀）
1. 预约日期导入路径写入点仅三处：
   src/lib/parser-core.ts 第 278 行（fillFallbacks 全文日期扫描，P0-141 回填链）；
   src/lib/parser-stream.ts 第 189 行（流式引擎行扫描）；
   src/lib/parser-wanbang.ts 第 74-129 行（万联流 footer 日期）。
   无 KV 显式键写 appointmentDate（KV_FIELD_KEYS 无此键）。
2. 存量清洗先例：src/features/appointment/repository.ts healMissingAppointments
   （main.tsx 启动钩子，幂等、无脏单零写入）——本书清洗仿此模式。
3. 卡片组件：src/features/order/components/OrderCard.tsx（加行位置自选，禁动其他行）。
4. 订单有 rawText 字段（src/types/order.ts 第 66 行），可作"导入单"判定依据。

四、改造口径（只改列明处，禁动比较/排序/回退逻辑）
R1　停写：上述三处预约日期写入全部停用——导入路径一律不写 appointmentDate/appointmentFrom/
　appointmentTo。停写后被跳过的日期行原文必须仍可见于 remark（多数情况自然成立：非 KV 行本就
　进 remark；缺则补，禁止丢信息）。
R2　存量清洗：main.tsx 启动钩子新增一次性清洗（仿 healMissingAppointments 模式，幂等零写入）：
　判定=订单 rawText 存在 且 appointmentDate 非空 → 备注首行插入"原识别日期：<原值>"，
　清空 appointmentDate/appointmentFrom/appointmentTo。状态=已预约的单由既有 P0-159 规则
　（已预约无日期→降级待办，repository.ts 第 98-100 行）自然接住，禁额外状态处理；
　禁迁移其他任何字段。
R3　卡片小字：OrderCard.tsx 加一行"导入 MM-DD"（createdAt 本地时区格式化，展示层只读
　既有字段，格式工具参照 todayLocal 同源实现）。
R4　回归：parserRegressionSamples 全量回归。若既有样本断言 appointmentDate 非空，
　按新口径修改该断言并在快照注明"甲方口径变更（P0-141 预约日期回填退役）"。
　奇瑞样本 expect appointmentDate:'' 不变。

五、影响半径（消费点清单，全函数阅读）
readAppointment/appointmentSortTs/倒计时徽章 getAppointmentCountdown/月分组 extractTimeTag/
统计模块/预约自愈。预约排序空值回退 createdAt、分组空值回退创建月、无日期不显示倒计时——
三处既有回退链已天然接住空值，禁改回退链。
场景走查：①新导入一单（原文带日期）→ 卡片有导入小字、无倒计时、备注含日期行、预约空；
②启动后存量导入单 → 备注首行出现"原识别日期："、预约空、已预约单降级待办；
③手填过预约的存量单也会被洗（甲方已批一刀切，快照中说明清洗单数）；④既有样本全绿。

六、验收门
1. R1-R3 diff 逐条核对，禁夹带；
2. 全量回归绿 + 本地 build 过；
3. 场景走查四情形结论写入快照（含清洗单数）。
七、交付物：代码 + 《施工队 · 状态快照》。禁超范围；禁动 src 外文件。
