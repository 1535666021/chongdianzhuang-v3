import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Undo2 } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'

/** P0-199-R1：重复隔离箱——铁重录入单静默存放于此（主页零污染）。
 * 逐条/批量处理：移入主页（dupQuarantine=false）或删除（软删+备份）。
 */
export default function DupQuarantinePage() {
  const navigate = useNavigate()
  const { orders, updateOrder, deleteOrder } = useOrderStore()
  const boxed = useMemo(() => orders.filter((o) => o.dupQuarantine), [orders])
  const backup = (list: typeof boxed) => {
    localStorage.setItem(`cdz_v3_quarantine_backup_${Date.now()}`, JSON.stringify(list))
  }
  const release = (id: string) => updateOrder(id, { dupQuarantine: false })
  const remove = (id: string) => {
    const it = boxed.find((o) => o.id === id)
    if (!it) return
    if (!confirm(`删除该重复单（软删+备份）？\n${it.orderNo}｜${it.customerName || ''}｜${it.phone || ''}`)) return
    backup([it])
    deleteOrder(id)
  }
  const removeAll = () => {
    if (boxed.length === 0) return
    if (!confirm(`全部删除隔离箱 ${boxed.length} 条（软删+备份）？`)) return
    backup(boxed)
    boxed.forEach((o) => deleteOrder(o.id))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center gap-2">
        <button onClick={() => navigate('/settings')} aria-label="返回"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-gray-800">重复隔离箱{boxed.length > 0 && <span className="ml-2 text-sm text-red-600">（{boxed.length}）</span>}</h1>
        {boxed.length > 0 && (
          <button onClick={removeAll} className="ml-auto text-xs text-red-600 flex items-center gap-1"><Trash2 size={14} /> 全部删除</button>
        )}
      </div>
      <div className="px-4 py-3 space-y-3">
        {boxed.length === 0 && <p className="text-center text-sm text-gray-400 py-10">暂无重复单</p>}
        {boxed.map((o) => (
          <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-sm font-medium text-gray-800">{o.orderNo}｜{o.customerName || '—'}｜{o.phone || '—'}</p>
            <p className="text-xs text-gray-500 mt-1">与【{o.status === '已完成' ? '已完成' : '已预约'}】单 {o.orderNo} 重复{o.status === '已完成' ? `（完工 ${o.actualInstallDate || o.completeDate || '—'}）` : `（预约 ${o.appointmentDate || '—'}）`}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => release(o.id)} className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"><Undo2 size={12} /> 是二桩，移入主页</button>
              <button onClick={() => remove(o.id)} className="flex-1 border border-red-300 text-red-600 rounded-lg py-1.5 text-xs flex items-center justify-center gap-1"><Trash2 size={12} /> 删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
