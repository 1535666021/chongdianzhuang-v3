# 《施工队 · 交付书》P0-261 已完成虚拟列表与加载更多冲突

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-261-completed-virtual-loadmore（基线=main 现 HEAD；核验窗合并/部署）
- 交付引用：.monkeycode/specs/2026-11-27-P0-261-completed-virtual-loadmore/TASK.md

## 根因与修法（OrderList.tsx 三补丁，+9-4 行）
| # | 根因 | 修法 |
| --- | --- | --- |
| A | virtualEnabled 判定（L143）位于 displayOrders（L130）之后，displayOrders 无条件 `.slice(0, showCount)`（默认 120）——虚拟滚动拿到的 displayOrders 永远≤120 条 | virtualEnabled 判定**提前**至 displayOrders 之前；memo 内 `virtualEnabled ? filtered : filtered.slice(0, showCount)`——虚拟模式全量直出（DOM 仍受 useVirtualRows 固定窗口约束），非虚拟路径零改动；memo deps 增 virtualEnabled |
| B | 加载更多按钮条件只看 `orders.length > showCount`，虚拟模式下无意义且与「只按虚拟滚动」冲突 | 条件改 `!virtualEnabled && orders.length > showCount` |
| C | virtualEnabled 重复定义（提前+原 L143） | 原 L143 行删除，单一事实源 |

## 载荷（3 文件）
- src/features/order/pages/OrderList.tsx（三补丁）
- src/constants/releaseNotes.ts（头部 1 条）
- 本书

## 自查实证
1. 复现前提成立：预改代码实测 displayOrders 恒 ≤showCount（120）而 virtualEnabled=true（165>120）——全量被截，加载更多残留（任务书诊断逐字命中）
2. runner 判 N/A：组件渲染层逻辑（useMemo 分支），无纯函数可抽；以 build+代码审计交付
3. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
4. 边界：非虚拟路径（≤120 条）分支语义逐字保持（slice 不变）；useVirtualRows/flatRows/groupOrdersByTag 零改动；待办/已预约/全部 Tab 的 P0-222 过滤出口不动

## 核验冒烟（脱敏 165 条，核验窗照跑）
1. DevTools Console 注入 165 条假已完成单：
```js
const { useOrderStore } = await import('/src/stores/orderStore.ts');
const base = useOrderStore.getState().orders[0];
const fake = Array.from({length:165},(_,i)=>({...base,id:`T-261-${i}`,orderNo:`T261-${i}`,customerName:`脱敏${i}号`,phone:`139${String(10000000+i).slice(0,8)}`,status:'已完成'}));
useOrderStore.getState().setOrders([...useOrderStore.getState().orders, ...fake]);
```
2. 切「已完成」Tab，期望：**加载更多按钮消失**；滚动到底继续出单（虚拟窗口滚动）；DOM 节点数恒定（useVirtualRows 固定窗口，不随 165 增长）
3. 清空假数据回归：≤120 条时加载更多按原逻辑出现

## 教训/避坑
- 判定顺序 bug（先截后判）单靠读代码难发现——「memo 依赖里缺一个下游分支标志」是典型触发器，改截断类逻辑先问「上游是否有模式开关」
