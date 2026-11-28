# 《施工队 · 任务书》P0-269

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 问题
长按复制偶发失效，刷新后看似恢复。

## 根因（已读码实证）
`src/features/order/components/OrderCard.tsx`：
- 长按逻辑在 `handleLongPressStart` 里 `setTimeout(500ms)` 后才调用 `copyToClipboard`；复制发生在定时器回调，不在原始 touch/click 手势内。
- `copyToClipboard` 先 `navigator.clipboard.writeText`，失败后 fallback `execCommand('copy')`；两条都失败时静默 `return`，无失败提示。
- 手机浏览器 Clipboard API 通常要求 transient user activation；定时器回调里 activation 可能已失效，导致 `writeText` reject。刷新只是改变浏览器权限/焦点状态，不是根因。

## 修法
A. 长按 500ms 定时器只做“标记待复制”：记录 `pendingCopyTextRef.current=text`、`longPressFiredRef.current=true`，不在定时器里写剪贴板。  
B. 在 `touchend`/`mouseup` 中若 `longPressFiredRef=true`，立即执行 `copyToClipboard(pendingText)`，并阻止随后的 click 导航/拨号。  
C. `copyToClipboard` 失败必须 `toast.error('复制失败，请重试')`，禁止静默。  
D. 保留滑动取消阈值、震动反馈；姓名/电话/地址/水印等所有长按入口统一走该修复。

## 验收
1) iOS Safari/Chrome/Android WebView 真机：长按姓名/电话/地址，松手即复制成功并 toast。  
2) 长按后不误触发拨号/导航。  
3) 复制失败有明确 toast，不再静默。  
4) npm run build 通过；delivery.md 附真机录屏。

施工队自行部署
监理窗口 · 签发完毕

## 已完成页补充实证（2026-11-28 21:25）
- 首页/已完成页都用同一 `OrderCard`，但 phone/address/contact 的 `onClick` 没有像 header 一样判断 `longPressFiredRef`。
- 结果：长按复制后松手，click 仍触发 `tel:`/高德导航，复制 toast 被后续动作盖掉/用户误判为不支持；已完成页更容易在电话/地址上长按，所以更明显。
- 必须修：所有长按热区（header、phone、contacts、address、水印）统一在 click 前检查 `longPressFiredRef`，长按后跳过本次 click。
