import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Trash2 } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import { detectDuplicates, backupAndCleanupIron, type DuplicateGroup } from '@/features/order/utils/orderGuard'

/** P0-196-R2：订单查重扫描结果页。铁重（A单号/B VIN）可自动清理（全量备份后执行）；
 * 疑重（C 电话+地址）仅提示+去处理，禁自动动。数据全程本地。
 */
export default function DupCheckPage() {
  const navigate = useNavigate()
  const { orders, deleteOrder } = useOrderStore()
  const [scan, setScan] = useState<ReturnType<typeof detectDuplicates> | null>(null)
  const [lastResult, setLastResult] = useState<string>('')

  const ironCount = useMemo(() => (scan ? scan.ironA.length + scan.ironB.length : 0), [scan])

  // P0-199-R1：隔离单视为不存在（detectDuplicates 纯函数零改动，由调用方过滤）
  const runScan = () => setScan(detectDuplicates(orders.filter((o) => !o.dupQuarantine)))

  const cleanupIron = () => {
    if (!scan) return
    const allIron = [...scan.ironA, ...scan.ironB]
    if (allIron.length === 0) return
    const totalRemove = allIron.reduce((s, g) => s + g.removeIds.length, 0)
    // P0-196-R2：确认弹窗→全量备份→执行→反馈
    if (!confirm(`铁重 ${allIron.length} 组，将清理 ${totalRemove} 单（保留字段更全/创建更早者）。\n执行前将全量备份到 localStorage，确认继续？`)) return
    const { backupKey, removed } = backupAndCleanupIron(orders, allIron.flatMap((g) => g.removeIds))
    allIron.flatMap((g) => g.removeIds).forEach((id) => deleteOrder(id))
    setLastResult(`已清理 ${removed} 单（备份键 ${backupKey}）`)
    setScan(null)
  }

  const GroupBlock = ({ title, groups, tone }: { title: string; groups: DuplicateGroup[]; tone: 'red' | 'orange' }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <h3 className={`text-sm font-semibold ${tone === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
        {title}（{groups.length} 组）
      </h3>
      {groups.length === 0 && <p className="text-xs text-gray-400 mt-1">无重复</p>}
      <div className="mt-2 space-y-2">
        {groups.map((g) => (
          <div key={g.key} className="text-xs border border-gray-100 rounded-lg p-2">
            <p className="text-gray-500">键：{g.key.slice(0, 24)}{g.key.length > 24 ? '…' : ''}</p>
            {g.orders.map((o) => (
              <p key={o.id} className={o.id === g.keep.id ? 'text-green-700' : 'text-gray-400 line-through'}>
                {o.id === g.keep.id ? '保留 ' : '清理 '}{o.orderNo}｜{o.customerName || '—'}｜{o.phone}｜{o.status}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-2">
        <button onClick={() => navigate('/settings')} aria-label="返回"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldCheck size={18} /> 订单查重</h1>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <button onClick={runScan} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium">扫描全部订单（{orders.length} 单）</button>
          {ironCount > 0 && (
            <button onClick={cleanupIron} className="flex items-center gap-1 bg-red-600 text-white rounded-xl px-3 text-sm">
              <Trash2 size={14} /> 清理铁重
            </button>
          )}
        </div>
        {lastResult && <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2">{lastResult}</p>}
        {scan && (
          <>
            <GroupBlock title="铁A·单号重复" groups={scan.ironA} tone="red" />
            <GroupBlock title="铁B·VIN 重复" groups={scan.ironB} tone="red" />
            <GroupBlock title="疑C·电话+地址重复" groups={scan.suspectC} tone="orange" />
            {scan.suspectC.length > 0 && (
              <button onClick={() => navigate('/scheduled')} className="w-full text-xs text-blue-600 underline">疑重区仅提示 → 去处理（已预约页核对）</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
