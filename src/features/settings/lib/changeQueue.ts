// P0-253-4 变更监听队列：订阅订单数据变更，30s 防抖生成/更新今日变更包密文队列
// 队列只留密文（today-new.age/.sha256）；失败暂存保留自动重试；不做上传/跨天滚动/导入恢复
import { useOrderStore } from '@/stores/orderStore'
import { loadStoredPublicKey } from './ageKey'
import { buildExportPackage, ExportChange, CHANGE_QUEUE_KEY } from './exportSync'
import { encryptWithPublicKey, sha256Hex, buildSha256FileContent, parsePublicKey, b64encode } from './localAge'

const QUEUE_DAY_KEY = 'cdz_v3_change_queue_day'
const SEQ_KEY = 'cdz_v3_change_seq'
export const TODAY_AGE_KEY = 'cdz_v3_today_age'
export const TODAY_SHA_KEY = 'cdz_v3_today_sha256'
export const DEBOUNCE_MS = 30_000

type OrderLike = { id?: unknown }

export function todayLocalStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function buildSnapshot(orders: unknown[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const o of orders) m.set(orderIdOf(o), JSON.stringify(o))
  return m
}

function orderIdOf(o: unknown): string {
  const id = (o as { id?: unknown } | null)?.id
  return id === undefined || id === null ? '' : String(id)
}

// 快照 diff：新增/修改→upsert，真删→delete tombstone（软删除保留在列表内=修改，走 upsert）
export function computeOrderDiff(prev: Map<string, string>, next: unknown[]): ExportChange[] {
  const entries: ExportChange[] = []
  const now = new Date().toISOString()
  const seen = new Set<string>()
  for (const o of next) {
    const id = orderIdOf(o)
    if (id === '') continue
    seen.add(id)
    const s = JSON.stringify(o)
    if (prev.get(id) !== s) {
      entries.push({ seq: 0, entity: 'order', key: id, op: 'upsert', data: o as Record<string, unknown> })
    }
  }
  for (const id of prev.keys()) {
    if (!seen.has(id)) entries.push({ seq: 0, entity: 'order', key: id, op: 'delete', deletedAt: now })
  }
  return entries
}

// ---- 暂存读写（253-2 契约：cdz_v3_change_queue = ExportChange[]） ----
function readStaging(): ExportChange[] {
  try {
    const raw = localStorage.getItem(CHANGE_QUEUE_KEY)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as ExportChange[]) : []
  } catch { return [] }
}

function writeStaging(entries: ExportChange[]): void {
  localStorage.setItem(CHANGE_QUEUE_KEY, JSON.stringify(entries))
}

function readDay(): string | null { return localStorage.getItem(QUEUE_DAY_KEY) }

function nextSeq(): number {
  const cur = Number(localStorage.getItem(SEQ_KEY) ?? '0') || 0
  const nxt = cur + 1
  localStorage.setItem(SEQ_KEY, String(nxt))
  return nxt
}

// ---- 模块内状态 ----
let snapshot = new Map<string, string>()
let timer: ReturnType<typeof setTimeout> | null = null
let started = false
let lastError = ''

function resetForNewDay(today: string, orders: unknown[]): void {
  writeStaging([])
  localStorage.setItem(QUEUE_DAY_KEY, today)
  snapshot = buildSnapshot(orders) // 新一天以当前数据为基线，不补历史变更（不做跨天滚动）
}

function appendStaging(entries: ExportChange[]): void {
  const staging = readStaging()
  let seq = Number(localStorage.getItem(SEQ_KEY) ?? '0') || 0
  for (const e of entries) {
    seq += 1
    staging.push({ ...e, seq })
  }
  localStorage.setItem(SEQ_KEY, String(seq))
  writeStaging(staging)
}

export interface QueueStatus {
  day: string
  pending: number
  hasTodayAge: boolean
  hasTodaySha: boolean
  lastError: string
}

export function getQueueStatus(): QueueStatus {
  return {
    day: readDay() ?? todayLocalStr(),
    pending: readStaging().length,
    hasTodayAge: localStorage.getItem(TODAY_AGE_KEY) !== null,
    hasTodaySha: localStorage.getItem(TODAY_SHA_KEY) !== null,
    lastError,
  }
}

// 打包：暂存→导出包→age 密文+sha256；成功清暂存（队列只留密文），失败暂存保留（只排队密文=产物仅密文）
export function flushQueue(): { ok: boolean; error?: string; packaged?: number } {
  const staging = readStaging()
  if (staging.length === 0) return { ok: true, packaged: 0 }
  const pub = loadStoredPublicKey()
  if (!pub) {
    lastError = '本机无备份公钥，暂存保留待重试'
    return { ok: false, error: lastError }
  }
  try {
    const pkg = buildExportPackage(staging, todayLocalStr())
    const json = new TextEncoder().encode(JSON.stringify(pkg))
    const age = encryptWithPublicKey(json, parsePublicKey(pub))
    localStorage.setItem(TODAY_AGE_KEY, b64encode(age))
    localStorage.setItem(TODAY_SHA_KEY, buildSha256FileContent(sha256Hex(json), 'today-new.json'))
    writeStaging([])
    lastError = ''
    return { ok: true, packaged: staging.length }
  } catch (e) {
    lastError = e instanceof Error ? e.message : '打包失败'
    return { ok: false, error: lastError }
  }
}

function scheduleFlush(): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { flushQueue() }, DEBOUNCE_MS)
}

// 启动监听（幂等）；返回停止函数
export function startChangeQueue(): () => void {
  if (started) return () => { /* 已启动 */ }
  started = true
  const orders = (useOrderStore.getState().orders ?? []) as OrderLike[]
  const today = todayLocalStr()
  if (readDay() !== today) resetForNewDay(today, orders)
  else snapshot = buildSnapshot(orders)

  const unsub = useOrderStore.subscribe((state) => {
    const next = (state.orders ?? []) as OrderLike[]
    const nowToday = todayLocalStr()
    if (readDay() !== nowToday) resetForNewDay(nowToday, next)
    const diff = computeOrderDiff(snapshot, next)
    snapshot = buildSnapshot(next)
    if (diff.length > 0) {
      appendStaging(diff)
      scheduleFlush()
    }
  })
  return unsub
}
