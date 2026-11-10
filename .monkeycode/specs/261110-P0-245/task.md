《施工队 · 任务书》P0-245

编号：P0-245　签发：监理窗口　日期：2026-11-10　状态：待施工
基线：仓库 main 当前 HEAD=a149ec5
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方报障 2026-11-10，截图实拍）═══
P0-243 手写备注（cardNote）已上线，甲方红圈指出：备注文字颜色太淡不显眼。
甲方裁定：「这个颜色要体现出来，你看哪个颜色显眼，用哪个颜色，就是这个备注」。
颜色甲方授权监理定：**橙红 #ea580c + 字重 600**（与"待办"橙同族最跳、语义=待关注；不选红防像报错）。

═══ 二、实证锚点（行号与 HEAD=a149ec5 逐字核对）═══
- src/features/order/components/OrderCard.tsx：L479 `const note = order.cardNote || ''`；L505-518 显示态渲染块（PenLine 图标+`order-card__remark-text--clamp/full`+行尾 Edit3 编辑钮）；L496 空态占位块（`style={{ opacity: 0.55 }}` 淡色，**保持不动**）
- src/shared/components/OrderCard.css L338-346 `.order-card__remark { color: #6b7280 }`——**解析备注（order.remark）与手写备注（cardNote）共用此类**，改类会误伤解析备注

═══ 三、施工一件 ═══
手写备注显示态块（OrderCard.tsx L505 块）新立修饰类（如 `order-card__cardnote`）叠用：颜色 #ea580c、font-weight 600、PenLine 图标与文字同色。
**零误伤**：解析备注（order.remark）块颜色/样式零改动；空态占位「添加备注」保持淡色；CSS 只加新类不改正类。

═══ 四、验收 ═══
1. 有手写备注卡片：备注行显橙红加粗，解析备注（若有）仍灰色——同卡两备注对拍截图
2. 空态占位淡色未变；编辑交互（点展开/行尾钮编辑）零回归
3. npm run build tsc 0；releaseNotes.ts 头追加 P0-245

═══ 五、交付方式 ═══
push 一笔（message 含 P0-245）+ specs/261110-P0-245/delivery.md（自查实证清单），会话只报一行指针。
