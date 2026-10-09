import { useState } from 'react'
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { toast } from '@/shared/hooks/useToast'
import { recycleOrders } from '../utils/recycleBin'

/** P0-139-R1 回收站页：回收单列表/查看原始记录/恢复/彻底删除/清空（均二次确认） */
export default function RecycleBinPage() {
  const navigate = useNavigate()
  const orders = useOrderStore((s) => s.orders)
  const restoreOrder = useOrderStore((s) => s.restoreOrder)
  const purgeOrder = useOrderStore((s) => s.purgeOrder)
  const emptyRecycleBin = useOrderStore((s) => s.emptyRecycleBin)
  const [confirm, setConfirm] = useState<{ type: 'purge' | 'empty'; id?: string } | null>(null)
  const [showRaw, setShowRaw] = useState<string | null>(null)
  const list = recycleOrders(orders)

  const doConfirm = () => {
    if (!confirm) return
    if (confirm.type === 'purge' && confirm.id) { purgeOrder(confirm.id); toast.success('已彻底删除') }
    if (confirm.type === 'empty') { emptyRecycleBin(); toast.success('回收站已清空') }
    setConfirm(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={20} /></button>
        <h1 className="font-semibold text-lg flex-1">回收站（{list.length}）</h1>
        {list.length > 0 && (
          <button onClick={() => setConfirm({ type: 'empty' })} className="text-sm text-red-600 border border-red-200 rounded px-2 py-1">清空回收站</button>
        )}
      </div>
      <div className="p-4 space-y-2">
        {list.length === 0 && <div className="text-center text-gray-400 text-sm py-10">回收站为空</div>}
        {list.map((o) => (
          <div key={o.id} className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{o.customerName || '未填写姓名'} <span className="text-xs text-gray-400">{o.status}</span></div>
                <div className="text-xs text-gray-500">{o.phone || ''} {o.address || ''}</div>
                <div className="text-xs text-gray-400">删除于 {o.deletedAt ? new Date(o.deletedAt).toLocaleDateString() : '（存量）'}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowRaw(showRaw === o.id ? null : o.id)} className="text-xs text-blue-600 px-2 py-1">原始记录</button>
                <button onClick={() => { restoreOrder(o.id); toast.success('已恢复') }} className="text-xs text-green-600 px-2 py-1"><RotateCcw size={12} /></button>
                <button onClick={() => setConfirm({ type: 'purge', id: o.id })} className="text-xs text-red-600 px-2 py-1"><Trash2 size={12} /></button>
              </div>
            </div>
            {showRaw === o.id && o.rawText && (
              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">{o.rawText}</pre>
            )}
          </div>
        ))}
      </div>
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-sm font-medium">{confirm.type === 'empty' ? `确认清空回收站？共${list.length}单，彻底删除后无法恢复。` : '确认彻底删除？删除后无法恢复。'}</div>
            <div className="flex gap-2">
              <button onClick={doConfirm} className="flex-1 rounded-lg py-2 text-sm text-white bg-red-600">确认</button>
              <button onClick={() => setConfirm(null)} className="flex-1 rounded-lg py-2 text-sm bg-gray-100">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
