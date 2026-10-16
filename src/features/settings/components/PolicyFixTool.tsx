import { useMemo, useState } from 'react'
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import {
  PLATFORM_FEE_RATE, TRIP_SUBSIDY_PER_UNIT, INSTALL_FEE_TIERS, INSTALL_FEE_DEFAULT,
  POLICY_FIX_RANGE, POLICY_FIX_BACKUP_KEY, POLICY_FIX_VERSION, POLICY_FIX_TRIP_END,
} from '@/constants/policy'
import { runPolicyFix, getPolicyFixRunAt, type PolicyFixReport } from '@/shared/dataFix/policyFix'
import { useOrderStore } from '@/stores/orderStore'
import ConfirmModal from '@/features/order/components/ConfirmModal'
import { isInPolicyFixScope } from '@/shared/dataFix/policyFix'

export default function PolicyFixTool() {
  const orders = useOrderStore((s) => s.orders)
  const [report, setReport] = useState<PolicyFixReport | null>(null)
  const [running, setRunning] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const runAt = getPolicyFixRunAt()
  const inScope = useMemo(() => orders.filter(isInPolicyFixScope), [orders])
  const fixedCount = inScope.filter((o) => o.policyFixVersion === POLICY_FIX_VERSION).length
  // R4：置灰条件=当前版本全部已执行；版本不匹配（旧版已修单）→恢复可点"重新执行(r3归一)"
  const pendingCount = inScope.length - fixedCount
  const allFixed = inScope.length > 0 && pendingCount === 0

  // R5：守卫与按钮disabled完全一致（删runAt拦截，修真机点击无反应）；
  // 原生window.confirm在微信内置浏览器被屏蔽→改应用内ConfirmModal
  const [confirming, setConfirming] = useState(false)
  const confirmMessage = runAt && pendingCount > 0
    ? `将对 ${inScope.length} 单（2026-09-01~10-31 已完成）按现行政策重算，执行前自动备份（时间戳键，不覆盖旧备份）。注意：检测到 ${pendingCount} 单为旧版修正口径（正数扣点/漏保盒误删/窗口外未判出差），将全量按 ${POLICY_FIX_VERSION} 归一重跑；已是 ${POLICY_FIX_VERSION} 的 ${fixedCount} 单自动跳过。`
    : `将对 ${inScope.length} 单（2026-09-01~10-31 已完成）按现行政策重算，执行前自动备份（时间戳键，不覆盖旧备份）。`

  const handleRun = () => {
    if (running || allFixed) return
    setConfirming(true)
  }
  const handleConfirm = () => {
    setConfirming(false)
    setRunning(true)
    try {
      const result = runPolicyFix()
      setReport(result)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
        <p className="font-bold">政策包（{POLICY_FIX_RANGE.start} ~ {POLICY_FIX_RANGE.end} 已完成单适用）</p>
        <p>· 出差单免扣点 + 补助 ¥{TRIP_SUBSIDY_PER_UNIT}/台（出差判定：现扣点=0）</p>
        <p>· 安装费分档：{Object.entries(INSTALL_FEE_TIERS).map(([m, v]) => `${m}米=¥${v}`).join(' / ')} / 自定义归¥{INSTALL_FEE_DEFAULT}</p>
        <p>· 普通单扣点 {PLATFORM_FEE_RATE * 100}%（20%作废，负数存储）</p>
        <p>· 漏保矩阵（仅漏保器）：领克全不含 / 五菱3.5kW不含 / 其余含；漏保盒每单必含</p>
        <p>· 出差判定：完成日期 2026-09-01~{POLICY_FIX_TRIP_END} 内已完成单全部视为出差；窗口外按扣点=0 启发式</p>
        <p>· 扣点负号约定：存储为负数，读取统一取绝对值</p>
        <p>· 双口径（R6）：对账=【出差单】安装费+出差补助（客户付费线下收不进公司账）；【普通单】付费−扣点+安装费+出差补助；实际=付费−扣点+安装费+补助−材料−工资</p>
      </div>
      <p className="text-xs text-gray-500">范围内共 {inScope.length} 单（已按现行版本 {POLICY_FIX_VERSION} 修正 {fixedCount} 单 / 待归一 {pendingCount} 单）</p>
      <button
        type="button"
        onClick={handleRun}
        disabled={running || allFixed}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-medium text-white disabled:bg-gray-300"
      >
        <Wrench size={16} />
        {allFixed ? `已执行（${POLICY_FIX_VERSION}，${runAt ? new Date(runAt).toLocaleString() : '-'}）` : running ? '执行中…' : runAt ? `重新执行（${POLICY_FIX_VERSION}归一）` : '9-10月旧账自动修正'}
      </button>
      {report && (
        <div className="rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">
          <p className="font-bold">✅ 修正完成（已备份，可回滚）</p>
          <p>本次归一 {report.total} 单 / 已是 {POLICY_FIX_VERSION} 跳过 {report.skippedVersion} 单（备份键 {report.backupKey}）：补出差标记 {report.tripMarked} / 调安装费 {report.installFeeAdjusted} / 移除漏保器 {report.breakerRemoved} / 补漏保器 {report.breakerAdded} / 补漏保盒 {report.breakerBoxAdded} / 无价跳过 {report.breakerSkippedNoPrice} / 仅对齐 {report.rateAlignedOnly}</p>
          <button type="button" onClick={() => setShowDetails(!showDetails)} className="mt-1 flex items-center gap-1 text-blue-600">
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 明细（{report.details.length}）
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
          title={runAt ? '重新执行政策归一' : '9-10月旧账自动修正'}
          message={confirmMessage}
          confirmText="确定执行"
          cancelText="取消"
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
