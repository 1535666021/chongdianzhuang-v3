import { useState } from 'react'
import { Scale, Play, Download, Trash2, Check } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import {
  sheetRows, buildAcctRecord, ordersToSysRecords, matchAll, summarize, exportDiffsCsv,
  MatchResult, ReconcileSummary, DIFF_CAUSES,
} from '../lib/reconcile'

// P0-257 本地对账：两侧 Excel 导入→标准化→匹配→差因拆分→汇总→导出；全程本机零网络
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

export default function ReconcileTool() {
  const [acctFile, setAcctFile] = useState<File | null>(null)
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [summary, setSummary] = useState<ReconcileSummary | null>(null)
  const [confirmed, setConfirmed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CONFIRMED_KEY) ?? '[]')) } catch { return new Set() }
  })

  const run = async () => {
    setError(''); setResults(null); setSummary(null)
    if (!acctFile) { setError('请先选择会计账单导入'); return }
    const sys = ordersToSysRecords(useOrderStore.getState().orders, month)
    if (sys.length === 0) { setError(`当前范围（${month}）无系统订单，不生成假差异`); return }
    setBusy(true)
    try {
      const aBuf = await acctFile.arrayBuffer()
      const { rows: aRows, warnings: aw } = sheetRows(aBuf)
      if (!aRows.length) { setError(`会计表为空或解析失败（${aw.join('；') || '无行'}）`); return }
      const acct = aRows.map(buildAcctRecord)
      const res = matchAll(acct, sys)
      setResults(res)
      setSummary(summarize(res))
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

  const clearAll = () => {
    setResults(null); setSummary(null); setError('')
  }

  const inputCls = 'block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:border-0 file:rounded-lg file:bg-blue-50 file:text-blue-700'

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Scale size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">本地对账：会计表导入，系统侧直读本机订单（默认当月，可切月份），零网络零日志。匹配优先级：单号→手机号→姓名+日期±3天+金额→模糊（疑似同人进人工确认）。补贴/管理费仅内部差因。</p>
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
          <button onClick={() => results && downloadText(exportDiffsCsv(results), `对账差异表-${new Date().toISOString().slice(0, 10)}.csv`)} disabled={!results}
            className="px-3 py-2.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1">
            <Download size={12} />
            导出差异表
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

      {summary && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">会计总收</p><p className="font-medium text-gray-800 mt-0.5">{summary.acctTotal.toFixed(2)}</p></div>
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">系统总收</p><p className="font-medium text-gray-800 mt-0.5">{summary.sysTotal.toFixed(2)}</p></div>
            <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">总差额</p><p className={`font-medium mt-0.5 ${Math.abs(summary.totalDiff) >= 0.01 ? 'text-red-600' : 'text-green-600'}`}>{summary.totalDiff.toFixed(2)}</p></div>
          </div>
          <div className="border border-gray-200 rounded-lg p-2.5 text-xs space-y-1">
            <p className="text-gray-500">状态：对上 {summary.statusCounts.matched} / 疑似 {summary.statusCounts.suspect} / 只有会计 {summary.statusCounts['acct-only']} / 只有系统 {summary.statusCounts['sys-only']} / 差异单 {summary.diffOrderCount}</p>
            <p className="text-gray-500">差因小计：{DIFF_CAUSES.map((c) => `${c} ${summary.causeTotals[c].toFixed(2)}`).join('　')}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {results.slice(0, 200).map((r, i) => {
            const key = r.acct && r.sys ? `${r.acct.orderNo || r.acct.phone}|${r.sys.orderNo || r.sys.phone}` : ''
            const tagColor = r.type === 'matched' ? 'text-green-600' : r.type === 'suspect' ? 'text-amber-600' : 'text-red-600'
            return (
              <div key={i} className="px-3 py-2 text-xs space-y-0.5">
                <p className={tagColor}>
                  {r.type === 'matched' ? '对上' : r.type === 'suspect' ? '疑似同人' : r.type === 'acct-only' ? '只有会计' : '只有系统'}
                  　{r.reason}{r.score > 0 ? `（${r.score}分）` : ''}
                </p>
                {r.acct && <p className="text-gray-600">会计：{r.acct.date} {r.acct.orderNo} {r.acct.name} {r.acct.phone} 实收 {(r.acct.onlineFee - r.acct.deduction).toFixed(2)}</p>}
                {r.sys && <p className="text-gray-600">系统：{r.sys.date} {r.sys.orderNo} {r.sys.name} 应收 {r.sys.customerFee.toFixed(2)}</p>}
                {r.type === 'suspect' && (
                  <button onClick={() => toggleConfirm(r)} className="mt-1 px-2 py-1 text-xs border rounded-lg flex items-center gap-1 border-gray-300 text-gray-600">
                    {confirmed.has(key) ? <><Check size={11} className="text-green-600" />已人工确认同人</> : '标记为同人（人工确认）'}
                  </button>
                )}
              </div>
            )
          })}
          {results.length > 200 && <p className="px-3 py-2 text-xs text-gray-400">仅展示前 200 条，共 {results.length} 条，导出看全量</p>}
        </div>
      )}
    </div>
  )
}
