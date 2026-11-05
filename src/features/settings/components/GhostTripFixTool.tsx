import { useMemo, useState } from 'react'
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { planGhostTripFix, runGhostTripFix, GHOST_TRIP_RUN_AT_KEY, type GhostTripReport } from '@/shared/dataFix/tripSubsidyGhostFix'
import { useOrderStore } from '@/stores/orderStore'
import ConfirmModal from '@/features/order/components/ConfirmModal'

/** P0-239：幽灵补助存量纠正工具（plan 预览 → run 执行，RULES §9） */
export default function GhostTripFixTool() {
  const orders = useOrderStore((s) => s.orders)
  const [report, setReport] = useState<GhostTripReport | null>(null)
  const [running, setRunning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const runAt = Number(localStorage.getItem(GHOST_TRIP_RUN_AT_KEY) || 0)
  const plan = useMemo(() => planGhostTripFix(orders), [orders])

  const handleRun = () => { if (running || plan.total === 0) return; setConfirming(true) }
  const handleConfirm = () => {
    setConfirming(false)
    setRunning(true)
    try { setReport(runGhostTripFix()) } finally { setRunning(false) }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl bg-orange-50 p-3 text-xs leading-5 text-orange-800">
        <p className="font-bold">幽灵补助存量纠正（P0-239）</p>
        <p>· 范围：已完成未删除单中「未点出差胶囊但补助存值 &gt; 0」的幽灵单（判定唯一化前的历史遗留）</p>
        <p>· 动作：补助归 0 + 按新口径（胶囊字段唯一判定）重算实际利润与对账利润</p>
        <p>· 平台费只列核对清单不动手（不出差单应=付费×10%；付费 0 单应=0）</p>
        <p>· 执行前自动备份（时间戳键）；幂等——修过的单不再命中，重跑即空</p>
      </div>
      <p className="text-xs text-gray-500">待纠正幽灵单 {plan.total} 单</p>
      <button
        type="button"
        onClick={handleRun}
        disabled={running || plan.total === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-medium text-white disabled:bg-gray-300"
      >
        <ShieldCheck size={16} />
        {running ? '纠正中…' : runAt ? `重新纠正（上次 ${new Date(runAt).toLocaleString()}）` : '开始幽灵补助纠正'}
      </button>
      {plan.total > 0 && (
        <div className="rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
          <button type="button" onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1 text-blue-600">
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 待纠正清单（{plan.total}）
          </button>
          {showDetails && plan.items.map((it) => <p key={it.order.id}>· {it.summary}</p>)}
        </div>
      )}
      {report && (
        <div className="rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">
          <p className="font-bold">✅ 纠正完成（已备份，可回滚）</p>
          <p>归 0 并重算 {report.fixed} 单（备份键 {report.backupKey || '无——空跑'}）</p>
          {report.feeMismatches.length > 0 && (
            <p className="mt-1 text-amber-700">平台费核对异常 {report.feeMismatches.length} 单（只报告不动手）：
              {report.feeMismatches.map((m) => `${m.customerName} 存 ${m.stored}/应 ${m.expected}`).join('；')}
            </p>
          )}
        </div>
      )}
      {confirming && (
        <ConfirmModal
          title="确认纠正幽灵补助"
          message={`将对 ${plan.total} 单归 0 补助并按新口径重算利润，执行前已自动备份。确定执行？`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
