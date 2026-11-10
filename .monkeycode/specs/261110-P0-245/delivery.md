# P0-245 交付（手写备注行显眼色·橙红#ea580c）

## 基线与载荷
- 基线：main a149ec5（P0-244 销号后 HEAD）
- 载荷 3 文件（1 改 tsx + 1 改 css + 1 改 releaseNotes）：OrderCard.tsx 显示态块叠修饰类、OrderCard.css 新立 .order-card__cardnote、releaseNotes 头追加
- 单文件改动量：tsx 恰 2 行（外层 div + 内层 span className），css 恰 1 个新类块（只加不改正类）

## 三件实证
1. **新立修饰类**：显示态块外层叠 `order-card__remark order-card__cardnote`，内层 span 叠 `order-card__cardnote-text`（展开态同）——不覆写解析备注/空态占位既有类
2. **CSS 修饰**：`.order-card__cardnote` 及 clamp/full 文本+图标 `#ea580c`/`font-weight:600`，只加新类不动 `.order-card__remark` 正类（解析备注原灰色零误伤）
3. **零误伤实证**（runner 断言级）：
   - 解析备注块 `{order.remark && (<div className="order-card__remark"` 原样未动（grep 实证）
   - 空态占位块 `style={{ opacity: 0.55 }}` 原样未动（grep 实证）
   - 编辑态行（Edit3 行）未叠修饰类——任务书锚点=显示态块
   - releaseNotes 头追加 P0-245 一条（L3）

## 任务书禁区自查
- Order.ts/解析备注备注块/原始记录查看入口/编辑态零改动：diff 对拍 tscx 仅显示态 2 行
- 橙红与"待办"橙同族区分：`--color-warning`（#d97706）≠ #ea580c，不撞状态色
- 全单零新增 orderCalc/parser/计算相关改动

## 备注
验收建议真机走查一张有待办单+有 cardNote 单：待办胶囊橙、cardNote 行橙红加粗、解析备注灰——三色同屏可辨。
