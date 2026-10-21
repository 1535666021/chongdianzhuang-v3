/* ============================================================
 * 解析单稳定身份（P0-202-R2 G3 / RULES §12）
 * 身份=内容哈希：同文本再解析 → ID 恒等 → importOrders update 分支接管，
 * 标签类字段（brandName/powerKw/packageMeters 等）永久不被刷。
 * 基准优先级：orderNo（非空）> phone+customerName+rawText 组合（djb2 哈希）。
 * 前缀 parsed_s_ 与旧 Date.now ID 区分；历史老单 ID 不动（R-12.4），防重由
 * matchExistingDuplicate orderNo 铁键全库扫兜底（G4）。
 * ============================================================ */

/** djb2 纯字符串哈希（32 位无符号），输出 36 进制短串 */
function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

interface StableIdSource {
  orderNo?: string
  phone?: string
  customerName?: string
  rawText?: string
}

export function stableOrderId(order: StableIdSource): string {
  const orderNo = (order.orderNo || '').trim()
  const basis = orderNo
    || [order.phone, order.customerName, order.rawText]
        .map((v) => (v || '').trim())
        .join('|')
  return `parsed_s_${djb2(basis)}`
}
