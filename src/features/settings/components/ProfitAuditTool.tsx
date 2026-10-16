import { useMemo, useState } from 'react'
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { runProfitAudit, getProfitAuditRunAt, isInProfitAuditScope, type ProfitAuditReport } from '@/shared/dataFix/profitAuditFix'
import { useOrderStore } from '@/stores/orderStore'
import ConfirmModal from '@/features/order/components/ConfirmModal'

export default function ProfitAuditTool() {
  const orders = useOrderStore((s) => s.orders)
  const [report, setReport] = useState<ProfitAuditReport | null>(null)
  const [running, setRunning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const runAt = getProfitAuditRunAt()
  const inScope = useMemo(() => orders.filter(isInProfitAuditScope), [orders])
  const storedCount = inScope.filter((o) => typeof o.actualProfit === 'number').length

  // 守卫与按钮disabled一致；微信内置浏览器无原生confirm→应用内ConfirmModal
  const handleRun = () => { if (running || inScope.length === 0) return; setConfirming(true) }
  const handleConfirm = () => {
    setConfirming(false)
    setRunning(true)
    try { setReport(runProfitAudit()) } finally { setRunning(false) }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
        <p className="font-bold">利润一致性巡检（P0-177-R1 · 写入端收口配套）</p>
        <p>· 范围：全量已完成单（不限日期）</p>
        <p>· 校验：orderCalc 新政策出口 calcActualProfitByPolicy 重算值 ≈ 存储 actualProfit（容差 ¥0.01）</p>
        <p>· 不一致：按新政策回写 actualProfit + 对账利润 reconciliationProfit，留痕 lastProfitAuditAt</p>
        <p>· 执行前自动备份漂移单（时间戳键，不覆盖旧备份）；幂等，可重复执行</p>
      </div>
      <p className="text-xs text-gray-500">已完成单共 {inScope.length} 单（含存储利润 {storedCount} 单）</p>
      <button
        type="button"
        onClick={handleRun}
        disabled={running || inScope.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-medium text-white disabled:bg-gray-300"
      >
        <ShieldCheck size={16} />
        {running ? '巡检中…' : runAt ? `重新巡检（上次 ${new Date(runAt).toLocaleString()}）` : '开始利润一致性巡检'}
      </button>
      {report && (
        <div className="rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">
          <p className="font-bold">✅ 巡检完成（已备份，可回滚）</p>
          <p>本次漂移回写 {report.drifted} 单 / 一致 {report.consistent} 单 / 无存储值跳过 {report.skippedNoStored} 单（备份键 {report.backupKey}）</p>
          <button type="button" onClick={() => setShowDetails(!showDetails)} className="mt-1 flex items-center gap-1 text-blue-600">
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 回写明细（{report.details.length}）
          </button>
          {showDetails && (
            <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto">
              {report.details.map((d) => <li key={d.orderId} className="border-b border-green-100 pb-1">{d.customerName}：{d.summary}</li>)}
            </ul>
          )}
        </div>
      )}
      {confirming && (
        <ConfirmModal
          title="利润一致性巡检"
          message={`将对全量 ${inScope.length} 个已完成单校验 actualProfit 与新政策出口重算值一致性，不一致单自动备份后回写（容差 ¥0.01）。`}
          confirmText="确定执行"
          cancelText="取消"
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
