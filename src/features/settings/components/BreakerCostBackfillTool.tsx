import { useState } from 'react'
import { runBreakerCostBackfillFix, type BreakerCostReport } from '@/shared/dataFix/breakerCostBackfillFix'

/** P0-197-R1：漏保成本回填工具（设置页入口） */
export default function BreakerCostBackfillTool() {
  const [report, setReport] = useState<BreakerCostReport | null>(null)
  const run = () => {
    if (!confirm('将扫描已完成单，对漏保成本口径不一致的单重算材料成本差额。\n执行前全量备份到 localStorage，确认继续？')) return
    setReport(runBreakerCostBackfillFix())
  }
  return (
    <div className="px-4 py-3 space-y-2">
      <button onClick={run} className="w-full bg-orange-600 text-white rounded-xl py-2.5 text-sm font-medium">
        漏保成本回填修正（P0-197-R1）
      </button>
      {report && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
          计划 {report.total} 单 / 已修正 {report.fixed} 单 · 备份键 {report.backupKey}
        </p>
      )}
    </div>
  )
}
