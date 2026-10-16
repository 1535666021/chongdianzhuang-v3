export const ORDER_TEXT_PATTERNS = {
  customerName: /客户姓名[：:]\s*(.+?)(?:\n|$)/,
  phone: /电话[：:]\s*(\d{11})/,
  address: /地址[：:]\s*(.+?)(?:\n|$)/,
  platform: /平台[：:]\s*(.+?)(?:\n|$)/,
  appointment: /预约[：:]\s*(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})/,
}

export const DEFAULT_SEPARATOR = '---'
