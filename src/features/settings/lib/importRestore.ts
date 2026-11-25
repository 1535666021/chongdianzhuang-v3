// P0-253-6 导入恢复：私仓拉 base/today 密文→本地解密→sha/schema 校验→预导入备份→确认导入
// 同主键冲突进列表人工处理，不静默覆盖；不做双向同步/静默 merge/自动覆盖
import { ExportChange, validateExportPackage, ExportPackage } from './exportSync'
import { decryptWithSecretKey, parseSecretKey, sha256Hex, parseSha256File } from './localAge'
import { loadRepoConfig, RepoConfig } from './repoUpload'

export const PREIMPORT_BACKUP_PREFIX = 'cdz_v3_preimport_backup'

type FetchImpl = typeof fetch

// ---- 拉取私仓文件 ----
async function fetchFileBytes(cfg: RepoConfig, path: string, fetchImpl: FetchImpl): Promise<Uint8Array> {
  const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`
  const r = await fetchImpl(url, { headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github+json' } })
  if (r.status === 404) throw new Error(`私仓缺少 ${path}（404），先完成上传链路`)
  if (r.status === 401 || r.status === 403) throw new Error('私仓 token 无效或权限不足（401/403）')
  if (r.status !== 200) throw new Error(`拉取 ${path} 失败（HTTP ${r.status}）`)
  const j = (await r.json()) as { content?: string; encoding?: string }
  if (j.encoding !== 'base64' || !j.content) throw new Error(`${path} 返回内容非法`)
  const bin = atob(j.content.replace(/\n/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---- 解密 + sha/schema 双校验 ----
export function verifyAndParsePackage(plain: Uint8Array, shaContent: string, label: string): ExportPackage {
  const { hex } = parseSha256File(shaContent)
  const actual = sha256Hex(plain)
  if (actual !== hex) throw new Error(`${label} sha256 校验失败：文件被篡改或私钥不匹配`)
  let pkg: unknown
  try {
    pkg = JSON.parse(new TextDecoder().decode(plain))
  } catch {
    throw new Error(`${label} 明文不是合法 JSON`)
  }
  const check = validateExportPackage(pkg)
  if (!check.ok) throw new Error(`${label} schema 校验失败：${check.errors.join('；')}`)
  return pkg as ExportPackage
}

export interface RemotePackages {
  base: ExportPackage
  today: ExportPackage
}

export async function downloadAndDecrypt(cfg: RepoConfig, secretKeyText: string, fetchImpl: FetchImpl = fetch): Promise<RemotePackages> {
  const secret = parseSecretKey(secretKeyText.trim())
  const baseAge = await fetchFileBytes(cfg, 'sync/base-current.age', fetchImpl)
  const baseSha = await fetchFileBytes(cfg, 'sync/base-current.sha256', fetchImpl)
  const todayAge = await fetchFileBytes(cfg, 'sync/today-new.age', fetchImpl)
  const todaySha = await fetchFileBytes(cfg, 'sync/today-new.sha256', fetchImpl)
  const base = verifyAndParsePackage(decryptWithSecretKey(baseAge, secret), new TextDecoder().decode(baseSha), 'base-current')
  const today = verifyAndParsePackage(decryptWithSecretKey(todayAge, secret), new TextDecoder().decode(todaySha), 'today-new')
  return { base, today }
}

// ---- 合并：同 entity+key 冲突时 today 覆盖 base（与导出侧去重同规则） ----
export function mergePackages(base: ExportPackage, today: ExportPackage): ExportChange[] {
  const map = new Map<string, ExportChange>()
  for (const c of base.changes) map.set(`${c.entity}::${c.key}`, c)
  for (const c of today.changes) map.set(`${c.entity}::${c.key}`, c)
  return [...map.values()]
}

export interface ConflictItem {
  key: string
  entity: string
  localSummary: string
  incomingSummary: string
}
export type ConflictResolution = 'keep-local' | 'take-remote' | 'skip'
export interface ImportPlan {
  adds: ExportChange[]
  updates: ExportChange[]
  deletes: ExportChange[]
  noops: number
  conflicts: ConflictItem[]
}

function summarize(o: unknown): string {
  const s = JSON.stringify(o)
  return s.length > 120 ? s.slice(0, 117) + '…' : s
}

// ---- 生成导入计划：同主键不同内容=冲突，绝不静默 ----
export function computeImportPlan(currentOrders: unknown[], changes: ExportChange[]): ImportPlan {
  const plan: ImportPlan = { adds: [], updates: [], deletes: [], noops: 0, conflicts: [] }
  const byId = new Map<string, unknown>()
  for (const o of currentOrders) {
    const id = (o as { id?: unknown } | null)?.id
    if (id !== undefined && id !== null) byId.set(String(id), o)
  }
  for (const c of changes) {
    if (c.entity !== 'order') { plan.noops += 1; continue } // 本单只恢复订单
    if (c.op === 'delete') {
      if (byId.has(c.key)) plan.deletes.push(c)
      else plan.noops += 1
      continue
    }
    const incoming = c.data ?? {}
    if (!byId.has(c.key)) {
      plan.adds.push(c)
      continue
    }
    const local = byId.get(c.key)
    if (JSON.stringify(local) === JSON.stringify(incoming)) {
      plan.noops += 1
    } else {
      plan.conflicts.push({ key: c.key, entity: c.entity, localSummary: summarize(local), incomingSummary: summarize(incoming) })
    }
  }
  return plan
}

// ---- 应用计划：仅执行 adds/updates/deletes；冲突项按人工决议处理 ----
export function applyImportPlan(
  currentOrders: unknown[],
  changes: ExportChange[],
  plan: ImportPlan,
  resolutions: Record<string, ConflictResolution>,
): unknown[] {
  const byId = new Map<string, unknown>()
  const order: string[] = []
  for (const o of currentOrders) {
    const id = (o as { id?: unknown } | null)?.id
    const k = id === undefined || id === null ? '' : String(id)
    if (k && !byId.has(k)) { byId.set(k, o); order.push(k) }
  }
  const changeByKey = new Map(changes.map((c) => [`${c.entity}::${c.key}`, c]))
  for (const c of plan.deletes) {
    if (byId.has(c.key)) { byId.delete(c.key); order.splice(order.indexOf(c.key), 1) }
  }
  for (const c of [...plan.adds, ...plan.updates]) {
    if (!byId.has(c.key)) order.push(c.key)
    byId.set(c.key, c.data ?? {})
  }
  for (const cf of plan.conflicts) {
    const res = resolutions[cf.key] ?? 'skip'
    if (res === 'take-remote') {
      const c = changeByKey.get(`${cf.entity}::${cf.key}`)
      if (c && !byId.has(c.key)) order.push(c.key)
      if (c) byId.set(c.key, c.data ?? {})
    } // keep-local / skip：不动
  }
  return order.map((k) => byId.get(k))
}

// ---- 预导入备份：先备份当前订单到独立键，再谈导入 ----
export function backupBeforeImport(currentOrders: unknown[]): string {
  const key = `${PREIMPORT_BACKUP_PREFIX}_${new Date().toISOString().replace(/[:.]/g, '-')}`
  localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), orders: currentOrders }))
  return key
}

export function loadRepoConfigOrThrow(): RepoConfig {
  const cfg = loadRepoConfig()
  if (!cfg) throw new Error('本机没有私仓配置，请先在「私仓上传」保存 owner/repo/token')
  return cfg
}
