// P0-257 本地对账：纯函数核——标准化/解析/匹配/差因拆分/汇总/导出
// 全程本机内存计算：零网络、零仓库、零日志；真实数据不出设备
import * as XLSX from 'xlsx'

export interface RawRow { [key: string]: string | number | boolean | undefined }

// ---- 标准化 ----
export function normalizePhone(input: unknown): string {
  let s = String(input ?? '').replace(/[\s-]/g, '')
  s = s.replace(/^\+?86(?=\d{11}$)/, '') // 去 +86/86 国际前缀（后跟 11 位手机号时）
  return s.replace(/\D/g, '')
}

export function normalizeName(input: unknown): string {
  return String(input ?? '')
    .replace(/[\s　]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角字母数字→半角
    .toLowerCase()
}

export function normalizeAddress(input: unknown): string {
  return String(input ?? '')
    .replace(/[\s　]/g, '')
    .replace(/[，。、·•／\/:：;；!！?？()（）\[\]{}【】'"'"]/g, '')
    .toLowerCase()
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30)
export function excelDateToISO(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(EXCEL_EPOCH + Math.round(v) * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = String(v ?? '').trim()
  const m = s.match(/^(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return s
}

function num(v: unknown): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[,，¥￥\s]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// ---- 表解析 ----
export function sheetRows(buf: ArrayBuffer): { rows: RawRow[]; warnings: string[] } {
  const wb = XLSX.read(buf, { type: 'array', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { rows: [], warnings: ['空表'] }
  const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '', raw: true })
  return { rows, warnings: [] }
}

function pick(row: RawRow, keys: string[]): unknown {
  for (const k of Object.keys(row)) {
    const kk = k.replace(/[\s　]/g, '')
    for (const want of keys) {
      if (kk.includes(want)) return row[k]
    }
  }
  return undefined
}

function parseDetail(v: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  const s = String(v ?? '').trim()
  if (!s) return out
  for (const seg of s.split(/[；;]/)) {
    const m = seg.match(/([^：:]+)[：:]\s*(-?[\d.]+)/)
    if (m) out[normalizeName(m[1])] = num(m[2])
  }
  return out
}

export interface AcctRecord {
  side: 'acct'
  date: string
  orderNo: string
  name: string
  phone: string
  address: string
  brand: string
  installFee: number
  meters: number
  onlineFee: number
  deduction: number
  raw: RawRow
}

export interface SysRecord {
  side: 'sys'
  date: string
  orderNo: string
  name: string
  phone: string
  address: string
  brand: string
  installFee: number
  meters: number
  customerFee: number
  detail: Record<string, number>
  status: string
  finishDate: string
  cablePrice: number
  units: number
  raw: RawRow
}

export function buildAcctRecord(row: RawRow): AcctRecord {
  return {
    side: 'acct',
    date: excelDateToISO(pick(row, ['日期'])),
    orderNo: String(pick(row, ['单号', '订单号']) ?? '').trim(),
    name: normalizeName(pick(row, ['姓名'])),
    phone: normalizePhone(pick(row, ['电话', '手机'])),
    address: normalizeAddress(pick(row, ['地址'])),
    brand: String(pick(row, ['品牌']) ?? '').trim(),
    installFee: num(pick(row, ['安装费'])),
    meters: num(pick(row, ['米数'])),
    onlineFee: num(pick(row, ['线上收费', '收费'])),
    deduction: num(pick(row, ['扣款', '扣除'])),
    raw: row,
  }
}

export function buildSysRecord(row: RawRow): SysRecord {
  return {
    side: 'sys',
    date: excelDateToISO(pick(row, ['日期'])),
    orderNo: String(pick(row, ['单号', '订单号']) ?? '').trim(),
    name: normalizeName(pick(row, ['姓名'])),
    phone: normalizePhone(pick(row, ['电话', '手机'])),
    address: normalizeAddress(pick(row, ['地址'])),
    brand: String(pick(row, ['品牌']) ?? '').trim(),
    installFee: num(pick(row, ['安装费'])),
    meters: num(pick(row, ['米数'])),
    customerFee: num(pick(row, ['客户收费'])),
    detail: parseDetail(pick(row, ['收费明细'])),
    status: String(pick(row, ['状态']) ?? '').trim(),
    finishDate: excelDateToISO(pick(row, ['完工日期'])),
    cablePrice: num(pick(row, ['电缆单价', '单价'])),
    units: num(pick(row, ['台数'])) || 1,
    raw: row,
  }
}

// P0-257-R1：系统侧免导入直读——Order 直映 SysRecord，默认当月可按月过滤
export interface OrderLike {
  id: string | number
  customerName?: string
  phone?: string
  address?: string
  status?: string
  customerPrice?: number
  materialCost?: number
  laborCost?: number
  brandName?: string
  orderNo?: string
  completeDate?: string
  actualInstallDate?: string
  createdAt?: number | string
}

export function ordersToSysRecords(orders: OrderLike[], month?: string): SysRecord[] {
  const out: SysRecord[] = []
  for (const o of orders) {
    const tsRaw = o.completeDate || o.actualInstallDate || ''
    const date = tsRaw
      ? excelDateToISO(tsRaw)
      : typeof o.createdAt === 'number'
        ? new Date(o.createdAt).toISOString().slice(0, 10)
        : excelDateToISO(o.createdAt ?? '')
    if (month && !date.startsWith(month)) continue
    out.push({
      side: 'sys',
      date,
      orderNo: String(o.orderNo || o.id || ''),
      name: normalizeName(o.customerName),
      phone: normalizePhone(o.phone),
      address: normalizeAddress(o.address),
      brand: String(o.brandName ?? ''),
      // 口径近似：安装费=材料+人工（直读无独立安装费字段；匹配主锚为单号/手机号/总额）
      installFee: Math.round(((o.materialCost ?? 0) + (o.laborCost ?? 0)) * 100) / 100,
      meters: 0,
      customerFee: o.customerPrice ?? 0,
      detail: {},
      status: String(o.status ?? ''),
      finishDate: date,
      cablePrice: 0,
      units: 1,
      raw: o as unknown as RawRow,
    })
  }
  return out
}

// ---- 匹配 ----
export type MatchType = 'matched' | 'acct-only' | 'sys-only' | 'suspect'

export interface MatchResult {
  type: MatchType
  acct?: AcctRecord
  sys?: SysRecord
  score: number
  reason: string
}

export function acctTotal(r: AcctRecord): number { return r.onlineFee - r.deduction }
export function sysTotal(r: SysRecord): number { return r.customerFee }

function nameFragmentMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const frag = a.replace(/\*/g, '')
  return frag.length >= 2 && b.includes(frag)
}

function addressMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a.includes(b) || b.includes(a)) return true
  // 分段：取较长串 6 字以上子串在另一侧出现
  const [long, short] = a.length >= b.length ? [a, b] : [b, a]
  for (let i = 0; i + 6 <= long.length; i++) {
    if (short.includes(long.slice(i, i + 6))) return true
  }
  return false
}

export function matchAll(acct: AcctRecord[], sys: SysRecord[]): MatchResult[] {
  const results: MatchResult[] = []
  const usedA = new Set<number>()
  const usedS = new Set<number>()

  // 1. 单号精确
  const sByNo = new Map<string, number>()
  sys.forEach((s, i) => { if (s.orderNo) sByNo.set(s.orderNo, i) })
  acct.forEach((a, i) => {
    if (a.orderNo && sByNo.has(a.orderNo)) {
      const j = sByNo.get(a.orderNo)!
      if (!usedS.has(j)) { usedA.add(i); usedS.add(j); results.push({ type: 'matched', acct: a, sys: sys[j], score: 100, reason: '单号精确' }) }
    }
  })
  // 2. 手机号精确；未中再辅助尾号 8 位（双方唯一才成对，防误配）
  const sByPhone = new Map<string, number[]>()
  sys.forEach((s, i) => { if (s.phone) { const l = sByPhone.get(s.phone) ?? []; l.push(i); sByPhone.set(s.phone, l) } })
  acct.forEach((a, i) => {
    if (usedA.has(i) || !a.phone || a.phone.length < 8) return
    for (const j of sByPhone.get(a.phone) ?? []) {
      if (!usedS.has(j)) { usedA.add(i); usedS.add(j); results.push({ type: 'matched', acct: a, sys: sys[j], score: 90, reason: '手机号精确' }); return }
    }
  })
  const tail8 = (p: string) => p.slice(-8)
  const sByTail = new Map<string, number[]>()
  sys.forEach((s, i) => { if (s.phone.length >= 8) { const l = sByTail.get(tail8(s.phone)) ?? []; l.push(i); sByTail.set(tail8(s.phone), l) } })
  acct.forEach((a, i) => {
    if (usedA.has(i) || !a.phone || a.phone.length < 8) return
    const cands = (sByTail.get(tail8(a.phone)) ?? []).filter((j) => !usedS.has(j))
    if (cands.length === 1) { const j = cands[0]; usedA.add(i); usedS.add(j); results.push({ type: 'matched', acct: a, sys: sys[j], score: 80, reason: '手机尾号8位（辅助）' }) }
  })
  // 3. 姓名+日期±3天+金额一致
  const parseT = (s: string) => Date.parse(s)
  acct.forEach((a, i) => {
    if (usedA.has(i) || !a.name) return
    for (let j = 0; j < sys.length; j++) {
      if (usedS.has(j)) continue
      const s = sys[j]
      if (s.name !== a.name) continue
      const ta = parseT(a.date); const ts = parseT(s.date) || parseT(s.finishDate)
      if (!Number.isFinite(ta) || !Number.isFinite(ts) || Math.abs(ta - ts) > 3 * 86400000) continue
      const feeOk = Math.abs(a.installFee - s.installFee) < 0.01 || Math.abs(acctTotal(a) - sysTotal(s)) < 0.01
      if (feeOk) { usedA.add(i); usedS.add(j); results.push({ type: 'matched', acct: a, sys: s, score: 75, reason: '姓名+日期±3天+金额一致' }); return }
    }
  })
  // 4. 模糊（姓名片段或地址片段+日期近）→ 疑似同人，进人工确认，不自动对上
  acct.forEach((a, i) => {
    if (usedA.has(i)) return
    for (let j = 0; j < sys.length; j++) {
      if (usedS.has(j)) continue
      const s = sys[j]
      const nameHit = nameFragmentMatch(a.name, s.name)
      const addrHit = addressMatch(a.address, s.address)
      if (!nameHit && !addrHit) continue
      let score = 0
      if (nameHit) score += 0.4
      if (addrHit) score += 0.4
      const ta = parseT(a.date); const ts = parseT(s.date) || parseT(s.finishDate)
      if (Number.isFinite(ta) && Number.isFinite(ts) && Math.abs(ta - ts) <= 7 * 86400000) score += 0.2
      if (score >= 0.6) {
        usedA.add(i); usedS.add(j)
        results.push({ type: 'suspect', acct: a, sys: s, score: Math.round(score * 100), reason: `疑似同人：姓名片段${nameHit ? '√' : '×'} 地址片段${addrHit ? '√' : '×'} 日期相近${score >= 0.8 ? '√' : '×'}` })
        return
      }
    }
  })
  // 5. 单边
  acct.forEach((a, i) => { if (!usedA.has(i)) results.push({ type: 'acct-only', acct: a, score: 0, reason: '只有会计有' }) })
  sys.forEach((s, j) => { if (!usedS.has(j)) results.push({ type: 'sys-only', sys: s, score: 0, reason: '只有系统有' }) })
  return results
}

// ---- 差因拆分（小计恒闭合：Σ差因=总差额；补贴/管理费仅内部差因，不作客户增项） ----
export const DIFF_CAUSES = ['安装费', '增项', '管理费', '电缆米数', '电缆补贴', '补漏保', '材料', '其他'] as const
export type DiffCause = (typeof DIFF_CAUSES)[number]
export type DiffSplit = Record<DiffCause, number>

export function splitDiff(a: AcctRecord, s: SysRecord): { split: DiffSplit; totalDiff: number } {
  const totalDiff = acctTotal(a) - sysTotal(s)
  const out = {} as DiffSplit
  out['安装费'] = a.installFee - s.installFee
  out['电缆米数'] = (a.meters - s.meters) * (s.cablePrice || 0)
  out['增项'] = -(s.detail['增项'] ?? 0)
  out['补漏保'] = -(s.detail['补漏保'] ?? s.detail['漏保'] ?? 0)
  out['材料'] = -(s.detail['材料'] ?? 0)
  // 内部结算差因：电缆补贴（出差按台 30）/ 管理费（不出差按客户付费 10%）
  const subsidy = s.detail['补贴'] ?? s.detail['出差补贴'] ?? 0
  const mgmt = s.detail['管理费'] ?? s.detail['扣点'] ?? 0
  out['电缆补贴'] = -subsidy
  out['管理费'] = -mgmt
  const known = DIFF_CAUSES.filter((c) => c !== '其他').reduce((sum, c) => sum + out[c], 0)
  out['其他'] = Math.round((totalDiff - known) * 100) / 100
  return { split: out, totalDiff: Math.round(totalDiff * 100) / 100 }
}

// ---- 汇总 ----
export interface ReconcileSummary {
  acctTotal: number
  sysTotal: number
  totalDiff: number
  causeTotals: DiffSplit
  statusCounts: Record<MatchType, number>
  diffOrderCount: number
}

export function summarize(results: MatchResult[]): ReconcileSummary {
  let acctT = 0; let sysT = 0
  const causeTotals = Object.fromEntries(DIFF_CAUSES.map((c) => [c, 0])) as unknown as DiffSplit
  const statusCounts: Record<MatchType, number> = { matched: 0, 'acct-only': 0, 'sys-only': 0, suspect: 0 }
  let diffOrders = 0
  for (const r of results) {
    statusCounts[r.type] += 1
    if (r.acct) acctT += acctTotal(r.acct)
    if (r.sys) sysT += sysTotal(r.sys)
    if (r.type === 'matched' && r.acct && r.sys) {
      const { split, totalDiff } = splitDiff(r.acct, r.sys)
      if (Math.abs(totalDiff) >= 0.01) diffOrders += 1
      for (const c of DIFF_CAUSES) causeTotals[c] = Math.round((causeTotals[c] + split[c]) * 100) / 100
    }
  }
  return { acctTotal: Math.round(acctT * 100) / 100, sysTotal: Math.round(sysT * 100) / 100, totalDiff: Math.round((acctT - sysT) * 100) / 100, causeTotals, statusCounts, diffOrderCount: diffOrders }
}

// ---- 导出 ----
export function exportDiffsCsv(results: MatchResult[]): string {
  const header = ['状态', '匹配依据/原因', '会计单号', '系统单号', '姓名(会计)', '电话(会计)', '会计实收', '系统应收', '差额', ...DIFF_CAUSES]
  const lines = [header.join(',')]
  for (const r of results) {
    const a = r.acct; const s = r.sys
    const base = [r.type, r.reason, a?.orderNo ?? '', s?.orderNo ?? '', a?.name ?? '', a?.phone ?? '',
      a ? acctTotal(a) : '', s ? sysTotal(s) : '']
    let diffCells: (string | number)[] = []
    if (a && s) {
      const { split, totalDiff } = splitDiff(a, s)
      diffCells = [totalDiff, ...DIFF_CAUSES.map((c) => split[c])]
    } else {
      diffCells = ['', ...DIFF_CAUSES.map(() => '')]
    }
    lines.push([...base, ...diffCells].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  }
  return '\ufeff' + lines.join('\n')
}
