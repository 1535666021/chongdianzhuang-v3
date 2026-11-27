// P0-265-C 区域树纯模型（runner 可测）
import type { Order } from '@/types'
import { extractAreaChain } from '@/shared/utils/groupTags'

export interface RegionNode {
  name: string
  count: number
  children: Map<string, RegionNode>
}

export function buildRegionTree(orders: Order[]): RegionNode {
  const root: RegionNode = { name: '', count: 0, children: new Map() }
  for (const o of orders) {
    const chain = extractAreaChain(o.address || '')
    const levels = chain
      ? [chain.province, chain.city, chain.district, chain.township].filter((x): x is string => Boolean(x))
      : []
    if (!levels.length) levels.push('未知区域')
    root.count += 1
    let cur = root
    for (const lv of levels) {
      if (!cur.children.has(lv)) cur.children.set(lv, { name: lv, count: 0, children: new Map() })
      cur = cur.children.get(lv)!
      cur.count += 1
    }
  }
  return root
}

// 沿路径取当前层子节点（count 降序）
export function nodesAtPath(root: RegionNode, path: string[]): RegionNode[] {
  let cur = root
  for (const seg of path) {
    const n = cur.children.get(seg)
    if (!n) return []
    cur = n
  }
  return [...cur.children.values()].sort((a, b) => b.count - a.count)
}

// 区域路径过滤订单（地址包含每一级片段）
export function matchRegionPath(o: Order, path: string[] | null): boolean {
  if (!path || !path.length) return true
  const addr = o.address || ''
  // 「未知区域」是树内兜底标签，非地址子串：特判=extractAreaChain 无任何层级命中
  if (path.length === 1 && path[0] === '未知区域') {
    const chain = extractAreaChain(addr)
    return !chain || ![chain.province, chain.city, chain.district, chain.township].some(Boolean)
  }
  return path.every((seg) => addr.includes(seg))
}
