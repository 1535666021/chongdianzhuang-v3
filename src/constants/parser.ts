export const ORDER_TEXT_PATTERNS = {
  // 匹配订单文本中的关键信息
  customerName: /客户姓名[：:]\s*(.+?)(?:
|$)/,
  phone: /电话[：:]\s*(\d{11})/,
  address: /地址[：:]\s*(.+?)(?:
|$)/,
  platform: /平台[：:]\s*(.+?)(?:
|$)/,
  appointment: /预约[：:]\s*(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})?/,
}

export const LINE_SEPARATOR = '---'
export const FIELD_SEPARATOR = '|'
