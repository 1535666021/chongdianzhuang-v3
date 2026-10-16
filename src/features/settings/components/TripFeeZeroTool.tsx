import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { runTripFeeZeroFix, getTripFeeZeroFixRunAt, type TripFeeZeroReport } from '@/shared/dataFix/tripFeeZeroFix'

/** P0-184⑦：存量出差单扣点归0（一次性修正器入口） */
export default function TripFeeZeroTool() {
  const [report, setReport] = useState<TripFeeZeroReport | null>(null)
  const [running, setRunning] = useState(false)
  const runAt = getTripFeeZeroFixRunAt()

  const handleRun = () => {
    if (running) return
    setRunning(true)
    try {
      setReport(runTripFeeZeroFix())
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wrench size={16} className="text-amber-500" />
        <h3 className="font-semibold text-gray-800">出差单扣点归0（一次性）</h3>
      </div>
      <p className="text-sm text-gray-600">
        扫描已完成单：出差单（含9-10月窗口期启发式判定）platformFee≠0 的批量归0。执行前自动备份（固定前缀+时间戳），幂等可重跑。
      </p>
      {runAt && <p className="text-xs text-gray-400">上次执行：{new Date(runAt).toLocaleString()}</p>}
      <button type="button" disabled={running} onClick={handleRun}
        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-50">
        {running ? '执行中...' : '立即修正'}
      </button>
      {report && (
        <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
          <p>修正条数：<strong>{report.fixed}</strong> / 计划 {report.total} 条</p>
          <p>跳过（已归0）：{report.skippedAlreadyZero} 条</p>
          <p>备份：{report.backedUp ? '已备份' : '未备份'}（{report.backupKey}）</p>
        </div>
      )}
    </div>
  )
}
