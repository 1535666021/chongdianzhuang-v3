/* ============================================================
 * 分组标签提取（P0-095 下沉自 useOrderList.ts，计算集中化）
 * extractAreaTag：地址 → 片区标签（P0-112：区/县 → 街道/镇 → 其他）
 * extractTimeTag：订单 → 月份标签（完工 > 预约 > 创建，YYYY-MM）
 * ============================================================ */

import type { Order } from '@/types'

/**
 * 一级（最细）：XX镇/街道/乡。
 * 前缀排除 省/市/区/县 与空白字符，防止"博望区 丹阳镇"被误并为长名。
 */
const AREA_TAG_STREET_RE = /([^\s省市区县]{2,8}?(?:镇|街道|乡))/
/**
 * 二级：XX区/县（P0-099 收紧）。
 * 前缀排除 省/市/空白/数字/字母/连字符：防"丰收佳苑3区"吃数字成垃圾组、
 * 防"安徽省-马鞍山市-花山区"产出"-花山区"；"马鞍山市"类地级市不会命中。
 * 后行断言排除"区小区/区社区"粘连场景。
 */
const AREA_TAG_DISTRICT_RE = /([^省市区县\s0-9A-Za-z\-]{2,6}?(?:区|县))(?!小区|社区)/

/** 防御性剥除标签首尾非汉字字符（如连字符前缀） */
function stripNonHanEdges(text: string): string {
  return text.replace(/^[^一-龥]+/, '').replace(/[^一-龥]+$/, '')
}

/** 地址 → 片区标签：P0-112区/县优先（甲方裁定，如花山区优先于解放路街道），无区/县再街道/镇，均无归「其他」 */
export function extractAreaTag(address: string): string {
  // P0-242：内部改调新链取最细可用级（乡镇>区县>市>省；签名与导出零改动）
  const chain = extractAreaChain(address)
  if (!chain) return '其他'
  return chain.township || chain.district || chain.city || chain.province || '其他'
}

/** 订单 → 时间维度分组标签：完工日期 > 预约日期 > 创建时间，取 YYYY-MM */
export function extractTimeTag(order: Order): string {
  const raw = (order.completeDate || order.appointmentDate || '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(raw)) return raw
  const created = new Date(order.createdAt)
  return Number.isNaN(created.getTime()) ? '其他' : created.toISOString().slice(0, 7)
}

/* ============================================================
 * P0-242 行政层级链：省→市→区县→乡镇（胶囊层级化数据源）
 * extractAreaChain：地址 → 四级链（逐级独立提取+同名级互斥去重，
 * 治「寿县安徽寿县」类地址串同名重复拼接）；全 null 归 null=「其他」
 * matchAreaChain：点选层级匹配——链上任一级命中=该级及其下级全域
 * ============================================================ */

export interface AreaChain {
  province: string | null
  city: string | null
  district: string | null
  township: string | null
}

const AREA_TAG_PROVINCE_RE = /([^\s0-9A-Za-z\-]{2,6}?(?:省|自治区))/
const AREA_TAG_CITY_RE = /([^\s省0-9A-Za-z\-]{2,8}?(?:市|州|盟))/
const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市']

/** 地址 → 行政层级链（省→市→区县→乡镇）；逐级解析不出为 null，全解析不出返回 null */
/** 折叠重复片段：「寿县寿县」→「寿县」（同一行政名在串中重复拼接只取一次） */
function foldRepeats(name: string): string {
  const m = name.match(/^(.{2,4}?[一-龥])\1+$/)
  return m ? m[1] : name
}

export function extractAreaChain(address: string): AreaChain | null {
  const province = stripNonHanEdges(address.match(AREA_TAG_PROVINCE_RE)?.[1] || '') || null
  let city = stripNonHanEdges(address.match(AREA_TAG_CITY_RE)?.[1] || '') || null
  // 直辖市：省级名即市级（北京市→省/市同链）
  let prov = province
  if (!prov && city && MUNICIPALITIES.includes(city)) prov = city
  if (prov && !city && MUNICIPALITIES.includes(prov)) city = prov
  // 组名片段去重（P0-242）：剥除已提取的省/市名后再提区县乡镇，
  // 治「寿县安徽寿县」类地址串同名重复拼接垃圾组名
  let rest = address
  if (prov) rest = rest.replace(prov, '')
  if (city) rest = rest.replace(city, '')
  let district = stripNonHanEdges(rest.match(AREA_TAG_DISTRICT_RE)?.[1] || '') || null
  // "XX小区/XX社区"是住宅小区名而非行政区（与 extractAreaTag 同口径排除）
  if (district && /(?:小区|社区)$/.test(district)) district = null
  // 区县名中残留的省/市基名剥除+重复折叠（「安徽寿县」→「寿县」）
  if (district && prov) district = foldRepeats(stripNonHanEdges(district.replace(prov.replace(/(?:省|自治区)$/, ''), '')))
  let township = stripNonHanEdges(rest.match(AREA_TAG_STREET_RE)?.[1] || '') || null
  // 同名级互斥去重：同一行政名在地址串重复出现只取一次（防「寿县安徽寿县」类拼接垃圾组名）
  if (township && township === district) township = null
  if (district && district === city) district = null
  if (city && city === prov) city = null
  if (!prov && !city && !district && !township) return null
  return { province: prov, city, district, township }
}

/** 点选层级匹配：一单链上任一级===tag 即命中（层级累计=该级及其下级全域订单） */
export function matchAreaChain(chain: AreaChain | null, tag: string): boolean {
  if (tag === '其他') return !chain
  if (!chain) return false
  return chain.province === tag || chain.city === tag || chain.district === tag || chain.township === tag
}
