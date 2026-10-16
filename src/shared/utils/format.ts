/**
 * 格式化货币为人民币格式
 * @example formatCurrency(1234.5) => '¥1,234.50'
 */
export function formatCurrency(n: number): string {
  return '¥' + n.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
}

/**
 * 格式化数字为带千分位的字符串
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}
