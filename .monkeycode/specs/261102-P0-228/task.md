《施工队 · 任务书》
编号：P0-228　优先级：P0　日期：2026-11-02（教材入库版）
先读 MEMORY.md 再读 RULES.md 再读本任务书，读完再动手；踩新坑先记 PLAYBOOK.md 再交付。

一、任务一句话
消灭"完成时间"的 UTC 时区偏差：北京时间每天 16:00 前点完成的单，完成日期被记成
前一天。所有日期口径统一改本地时区 todayLocal()（src/constants/availableWindow.ts，
既有工具，禁新造轮子）。

二、现状实证（监理已核 HEAD，照此下刀）
1. src/stores/orderStore.ts 第 70 行（completeOrder 落库）：
   completeDate: new Date().toISOString().slice(0, 10) —— UTC，实锤偏差源。
   同函数签名已禁外部传 completeDate（第 16 行 Omit），故落库只有这一个出口。
2. src/features/order/hooks/useCompletion.ts 第 169 行：表单预填 completeDate 同 UTC；
   该值不落库（落库被 orderStore 强制覆盖），但经 src/features/order/hooks/useScript.ts 第 131 行进话术默认值，
   同样差一天，一并改。
3. src/features/order/pages/OrderList.tsx 第 113 行、src/features/order/hooks/useOrderList.ts
   第 72 行：列表"今日"判定同 UTC，改前先读上下文确认用途，只换取值不换逻辑。
4. src/features/batchParser/hooks/batchDedupe.ts 第 31、39 行：识别去重的"当前月"
   判定同 UTC（北京每月 1 号 0-8 点跨月偏差），31 行改 todayLocal().slice(0,7)；
   39 行是历史单 createdAt 的月份回读，仅当它也是"当前月"口径才许动，否则不碰。

三、改造口径（只改取值，禁动比较/排序/回退逻辑）
R1　orderStore.ts:70 completeDate: todayLocal()（import 既有 todayLocal）。
R2　useCompletion.ts:169 表单预填 completeDate: todayLocal()。
R3　OrderList.tsx:113、useOrderList.ts:72 today 改 todayLocal()，用途先读后改。
R4　batchDedupe.ts:31 当前月改 todayLocal().slice(0,7)；39 行按第二节第 4 条判定，拿不准就不动并在快照说明。
历史已落库的 completeDate 数据一律不迁移（排序分组回退链 actualInstallDate 优先，src/shared/utils/orderCalc.ts:389，错一天数据影响可忽略）。

四、影响半径（消费点清单，全函数阅读）
completeDate 消费点：src/constants/scripts.ts 话术变量（61/126/180/232 行）、useScript.ts:62、
src/features/finance/hooks/useFinance.ts:60、src/features/finance/components/ReceivablesManager.tsx:67、
src/features/settings/pages/DupQuarantinePage.tsx:45、src/shared/utils/groupTags.ts:39、
src/shared/utils/orderCalc.ts resolveDoneDate/getOrderBusinessDate、useOrderList.ts 排序、OrderList.tsx 分组。
场景走查：上午点完成一单 → 列表/统计/话术/月分组逐处看日期是否为当天。

五、验收门
1. R1-R4 diff 逐条核对，禁夹带无关改动；
2. 既有回归全绿 + 本地 build 通过；
3. 场景走查结论写入快照。

六、交付物
代码 + 《施工队 · 状态快照》（改动文件行号清单、回归结果、走查结论、新坑记录）。
禁超范围开发；禁动 src 目录外文件；数据迁移禁做。
