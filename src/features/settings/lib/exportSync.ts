// P0-253-2 手动导出同步包：schema v1 + 去重 + tombstone + 离线校验
// 不含加密/监听/上传；变更队列入库是 P0-253-3 的活，本单只按既定格式读
export const EXPORT_SCHEMA_VERSION = 1
// P0-253-3 队列存储契约：localStorage[CHANGE_QUEUE_KEY] = ExportChange[]（JSON 数组，追加写）
export const CHANGE_QUEUE_KEY = 'cdz_v3_change_queue'

export type ExportOp = 'upsert' | 'delete'

export interface ExportChange {
  seq: number
  entity: string
  key: string
  op: ExportOp
  data?: Record<string, unknown>
  deletedAt?: string
}

export interface ExportCounts {
  total: number
  upserts: number
  deletes: number
  byEntity: Record<string, number>
}

export interface ExportPackage {
  schemaVersion: number
  exportedAt: string
  baseDate: string
  changes: ExportChange[]
  counts: ExportCounts
}

// 按 entity+key 去重保留最后一条：同批变更重复导出不重复计数
export function dedupeChanges(changes: ExportChange[]): ExportChange[] {
  const map = new Map<string, ExportChange>()
  for (const c of changes) {
    map.set(`${c.entity}::${c.key}`, c)
  }
  return [...map.values()]
}

export function countChanges(changes: ExportChange[]): ExportCounts {
  let upserts = 0
  let deletes = 0
  const byEntity: Record<string, number> = {}
  for (const c of changes) {
    if (c.op === 'delete') deletes += 1
    else upserts += 1
    byEntity[c.entity] = (byEntity[c.entity] ?? 0) + 1
  }
  return { total: changes.length, upserts, deletes, byEntity }
}

export function buildExportPackage(changes: ExportChange[], baseDate: string, now = new Date()): ExportPackage {
  const deduped = dedupeChanges(changes)
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    baseDate,
    changes: deduped,
    counts: countChanges(deduped),
  }
}

// 离线校验器：导出包 JSON 自描述，脱离本软件可校验 schema
export function validateExportPackage(pkg: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (typeof pkg !== 'object' || pkg === null) return { ok: false, errors: ['包必须是对象'] }
  const p = pkg as Record<string, unknown>
  if (p.schemaVersion !== EXPORT_SCHEMA_VERSION) errors.push(`schemaVersion 必须是 ${EXPORT_SCHEMA_VERSION}`)
  if (typeof p.exportedAt !== 'string' || p.exportedAt === '') errors.push('exportedAt 缺失')
  if (typeof p.baseDate !== 'string' || p.baseDate === '') errors.push('baseDate 缺失')
  if (!Array.isArray(p.changes)) {
    errors.push('changes 必须是数组')
  } else {
    const seen = new Set<string>()
    p.changes.forEach((c, i) => {
      if (typeof c !== 'object' || c === null) {
        errors.push(`changes[${i}] 非对象`)
        return
      }
      const ch = c as Record<string, unknown>
      if (ch.op !== 'upsert' && ch.op !== 'delete') errors.push(`changes[${i}].op 非法`)
      if (typeof ch.entity !== 'string' || ch.entity === '') errors.push(`changes[${i}].entity 缺失`)
      if (typeof ch.key !== 'string' || ch.key === '') errors.push(`changes[${i}].key 缺失`)
      if (ch.op === 'delete' && typeof ch.deletedAt !== 'string') errors.push(`changes[${i}].deletedAt 缺失`)
      const k = `${ch.entity}::${ch.key}`
      if (seen.has(k)) errors.push(`changes[${i}] 重复键 ${k}`)
      seen.add(k)
    })
  }
  if (typeof p.counts !== 'object' || p.counts === null) {
    errors.push('counts 缺失')
  } else if (Array.isArray(p.changes)) {
    const expect = countChanges(p.changes as ExportChange[])
    const co = p.counts as Record<string, unknown>
    if (co.total !== expect.total) errors.push('counts.total 与 changes 不一致')
    if (co.upserts !== expect.upserts) errors.push('counts.upserts 与 changes 不一致')
    if (co.deletes !== expect.deletes) errors.push('counts.deletes 与 changes 不一致')
  }
  return { ok: errors.length === 0, errors }
}

// 读取待导出变更队列（P0-253-3 监听写入；当前恒空数组也算合法导出）
export function readPendingChanges(): ExportChange[] {
  try {
    const raw = localStorage.getItem(CHANGE_QUEUE_KEY)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as ExportChange[]) : []
  } catch {
    return []
  }
}
