import { useState } from 'react'
import { Scale, Play, Download, Trash2, Check, AlertTriangle } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import {
  parseAcctWorkbook, rowsForMonth, prevMonth, buildReport, buildAcctRecord,
  ordersToSysRecords, matchAll, exportDiffsCsv,
  MatchResult, ReconcileReport,
} from '../lib/reconcile'

// P0-257-R1+增补：会计 Excel 导入（可多工作表），系统侧直读本机订单；默认上一自然月；四类分组可视化+报告
const CONFIRMED_KEY = 'cdz_v3_reconcile_confirmed'

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function personLine(r: MatchResult): string {
  const side = r.acct ?? r.sys
  if (!side) return ''
  return [side.name, side.phone, side.address].filter(Boolean).join(' · ')
}

export default function ReconcileTool() {
  const [acctFile, setAcctFile] = useState<File | null>(null)
  const [month, setMonth] = useState<string>(() => prevMonth())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReconcileReport | null>(null)
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [confirmed, setConfirmed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CONFIRMED_KEY) ?? '[]')) } catch { return new Set() }
  })

  const run = async () => {
    setError(''); setReport(null); setResults(null)
    if (!acctFile) { setError('请先选择会计账单导入'); return }
    const sys = ordersToSysRecords(useOrderStore.getState().orders, month)
    if (sys.length === 0) { setError(`当前范围（${month}）无系统订单，不生成假差异`); return }
    setBusy(true)
    try {
      const aBuf = await acctFile.arrayBuffer()
      const { sheets, warnings } = parseAcctWorkbook(aBuf)
      if (!sheets.length) { setError(`会计表解析失败（${warnings.join('；') || '无工作表'}）`); return }
      const rows = rowsForMonth(sheets, month)
      if (!rows.length) { setError(`会计表无 ${month} 数据，不生成假差异`); return }
      const res = matchAll(rows.map(buildAcctRecord), sys)
      setResults(res)
      setReport(buildReport(res))
    } catch (e) {
      setError(e instanceof Error ? e.message : '核对失败')
    } finally { setBusy(false) }
  }

  const toggleConfirm = (r: MatchResult) => {
    if (!r.acct || !r.sys) return
    const key = `${r.acct.orderNo || r.acct.phone}|${r.sys.orderNo || r.sys.phone}`
    const next = new Set(confirmed)
    if (next.has(key)) next.delete(key); else next.add(key)
    setConfirmed(next)
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify([...next]))
  }

  const clearAll = () => { setReport(null); setResults(null); setError('') }

  const inputCls = 'block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:border-0 file:rounded-lg file:bg-blue-50 file:text-blue-700'

  const groupTitle = (label: string, count: number, danger: boolean) => (
    <p className={`text-xs font-medium px-3 py-2 ${danger ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>{label}（{count}）</p>
  )

  const personRow = (r: MatchResult, danger: boolean, i: number) => (
    <div key={`${r.type}-${i}`} className={`px-3 py-2 text-xs space-y-0.5 border-l-4 ${danger ? 'border-red-400 bg-red-50/50' : 'border-transparent'}`}>
      <p className={danger ? 'font-medium text-red-700' : 'text-gray-700'}>{personLine(r) || '（无姓名）'}</p>
      {r.acct && <p className="text-gray-500">会计：{r.acct.date} {r.acct.orderNo} 实收 {(r.acct.onlineFee - r.acct.deduction).toFixed(2)}</p>}
      {r.sys && <p className="text-gray-500">系统：{r.sys.date} {r.sys.orderNo} 应收 {r.sys.customerFee.toFixed(2)}</p>}
      {r.type === 'suspect' && (
        <button onClick={() => toggleConfirm(r)} className="mt-1 px-2 py-1 text-xs border rounded-lg border-gray-300 text-gray-600 flex items-center gap-1">
          {confirmed.has(`${r.acct?.orderNo || r.acct?.phone}|${r.sys?.orderNo || r.sys?.phone}`) ? <><Check size={11} className="text-green-600" />已人工确认同人</> : '标记为同人（人工确认）'}
        </button>
      )}
    </div>
  )

  const totalFlags = report ? report.missingCount + report.extraCount + report.diffCount + report.suspectCount : 0

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Scale size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">本地对账：只传会计 Excel（可多工作表自动识月），系统侧直读本机订单。默认核对上一自然月，可手改。空范围不造假差异。</p>
      </div>

      <div className="space-y-2">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setAcctFile(e.target.files?.[0] ?? null)} className={inputCls} />
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <div className="flex gap-2">
          <button onClick={run} disabled={busy} className="flex-1 py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Play size={14} />
            {busy ? '核对中…' : '开始核对'}
          </button>
          <button onClick={clearAll} className="px-3 py-2.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            <Trash2 size={12} />
            清除
          </button>
          <button onClick={() => results && downloadText(exportDiffsCsv(results), `对账差异表-${month}.csv`)} disabled={!results}
            className="px-3 py-2.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1">
            <Download size={12} />
            另存报告
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">{error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">系统单数</p><p className="font-medium text-gray-800 mt-0.5">{report.sysCount}</p></div>
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">会计单数</p><p className="font-medium text-gray-800 mt-0.5">{report.acctCount}</p></div>
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">金额差额</p><p className={`font-medium mt-0.5 ${Math.abs(report.amountDiffTotal) >= 0.01 ? 'text-red-600' : 'text-green-600'}`}>{report.amountDiffTotal.toFixed(2)}</p></div>
          </div>
          <div className="border border-gray-200 rounded-lg p-2.5 text-xs">
            <p className="text-gray-600">对比报告（{month}）：总单数 系统 {report.sysCount} / 会计 {report.acctCount}；对上 {report.matchedCount}；会计缺失 {report.missingCount}；会计多出 {report.extraCount}；金额不一致 {report.diffCount}；疑似同人 {report.suspectCount}；金额差汇总 {report.amountDiffTotal.toFixed(2)}</p>
          </div>
        </div>
      )}

      {report && totalFlags > 0 && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-80 overflow-y-auto text-xs">
          {report.missingCount > 0 && (<>{groupTitle('会计缺失（系统有·会计无）', report.missingCount, true)}{report.missing.map((r, i) => personRow(r, true, i))}</>)}
          {report.extraCount > 0 && (<>{groupTitle('会计多出（会计有·系统无）', report.extraCount, true)}{report.extra.map((r, i) => personRow(r, true, i))}</>)}
          {report.diffCount > 0 && (<>{groupTitle('金额不一致', report.diffCount, false)}{report.diffs.map((r, i) => personRow(r, false, i))}</>)}
          {report.suspectCount > 0 && (<>{groupTitle('疑似同人（待人工确认）', report.suspectCount, false)}{report.suspects.map((r, i) => personRow(r, false, i))}</>)}
        </div>
      )}

      {report && totalFlags === 0 && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">全部对上，无差异</p>
      )}
    </div>
  )
}
