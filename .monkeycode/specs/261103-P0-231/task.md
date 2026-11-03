# 《施工队 · 任务书》

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

## 项目上下文
- 仓库：github.com/1535666021/chongdianzhuang-v3（main 分支）
- 基线 HEAD：0bc15da（P0-230 销号，本任务全部行号以此提交为基准）
- 构建：本地 `npm run build`（node build-check.cjs && tsc --noEmit && vite build && node build-check.cjs --check-dist），tsc 0 错误、build-check 通过后才允许推送
- 技术栈：React18 + TS strict + Vite + Zustand + React Router + PWA
- 部署：推送 main 后部署 gh-pages（1535666021.github.io/chongdianzhuang-v3/），部署后回拉核验

## 任务编号
P0-231（本目录 specs/261103-P0-231/）

## 问题描述
甲方需求：已完成列表每张单卡片，「查看原始记录」按钮下方小字区（现仅显示"导入 MM/DD"），追加显示该单**完工时间**。

甲方口径（已拍板，写入侧逻辑不变）：
- 完工时间 = 实际安装日期 actualInstallDate——勘测完成点「完工」时刻记落的日期；当场点完工未填日期时系统自动记手机本地当天（useCompletion.ts:172 `order?.actualInstallDate || todayLocal()` 实证）
- **展示取值只认 actualInstallDate 字段本身**，不走 resolveDoneDate 回退链（回退链仅供排序/统计兜底，orderCalc.ts:389）

## 实现要求
**唯一改动文件：src/features/order/components/OrderCard.tsx**

现状（0bc15da 基准，行号已实证）：
- OrderCard.tsx:290-292：导入时间小字 `{order.createdAt ? <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>导入 {MM/DD}</div> : null}`（P0-229-R1）
- OrderCard.tsx:45：已完成态判定 `const isCompleted = order.status === '已完成'`

改法：
1. 导入小字区追加完工段，最终形态（已完成 且 actualInstallDate 有值）：`完工 11/02 · 导入 10/20`，同一 div 内追加，不新增一行
2. 取值：`order.actualInstallDate`，原样字符串按 MM/DD 展示；**禁走 resolveDoneDate、禁回退 completeDate / createdAt**
3. actualInstallDate 为空：不显示"完工"段（含分隔符"·"），该行退化为原样"导入 MM/DD"
4. 非已完成状态卡片（已预约/回收站等）：不显示完工段，渲染结果与改动前逐字节一致
5. 样式与导入小字完全一致：fontSize 11、color #9ca3af、marginTop 4

## 禁改清单（影响半径，擅自改动判返工）
- 写入侧：useCompletion.ts（130/172/423 行）、orderStore.completeOrder——不动
- 排序/分组/统计口径：useOrderList.ts:60、OrderFilterBar/utils.ts:25、orderCalc.ts 的 resolveDoneDate(389)/getOrderBusinessDate(120)——不动
- 既有展示位：MonthDetailSections.tsx:105、DupQuarantinePage.tsx:45、seedOrders.ts:121——不动
- 回归样本 parserRegressionSamples.ts 19 条——不动、不新增

## 验收标准
1. 已完成单（actualInstallDate 有值）卡片小字区显示"完工 MM/DD · 导入 MM/DD"，灰小字同款样式
2. 已完成单（actualInstallDate 为空）仅显示"导入 MM/DD"，无"完工"无"·"
3. 已预约/回收站卡片小字区与改动前完全一致
4. 显示值与卡片上部安装日期位同源一致（同读 actualInstallDate）
5. tsc 0 错误 + build-check 通过
6. git diff 仅 OrderCard.tsx 一个文件

## 交付要求
- 交付写本目录 delivery.md（格式按 ONBOARDING 交付方式 v2），会话只报一行指针
- 单轮交付：编码→验证→Build→推送→回拉核验，一次性完成

施工队自行部署。

监理窗口 · 签发完毕