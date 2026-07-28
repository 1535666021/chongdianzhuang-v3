import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, PackageOpen } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import { UsageForm } from '../components/UsageForm'
import type { MaterialUsageRecord } from '@/types'

export default function MaterialList() {
  const navigate = useNavigate()
  const { usageRecords, deleteUsageRecord } = useMaterial()
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<MaterialUsageRecord | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, { records: MaterialUsageRecord[]; total: number }> = {}
    for (const r of usageRecords) {
      const month = r.date.slice(0, 7)
      if (!groups[month]) {
        groups[month] = { records: [], total: 0 }
      }
      groups[month].records.push(r)
      groups[month].total += r.total
    }
    const entries = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
    return entries.map(([month, data]) => ({
      month,
      label: formatMonth(month),
      ...data,
      total: Math.round(data.total * 100) / 100,
    }))
  }, [usageRecords])

  const handleEdit = (record: MaterialUsageRecord) => {
    setEditRecord(record)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditRecord(undefined)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditRecord(undefined)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteUsageRecord(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h1 className="font-semibold text-lg">材料领用</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg"
          >
            <PackageOpen size={14} /> 库存
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg"
          >
            <Plus size={16} /> 新增领用
          </button>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {groupedByMonth.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <PackageOpen size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">暂无领用记录</p>
            <p className="text-xs text-gray-300 mt-1">点击右上角"新增领用"添加</p>
          </div>
        )}

        {groupedByMonth.map(({ month, label, records, total }) => (
          <div key={month}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-semibold text-gray-700">{label}</span>
              <span className="text-sm font-bold text-orange-600">月合计 ¥{total.toFixed(2)}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {records.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                    i < records.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span className="text-xs text-gray-400 w-14 shrink-0">{r.date.slice(5)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-800">{r.name}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      {r.quantity}{r.unit} x ¥{r.costPrice}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700 shrink-0">¥{r.total.toFixed(2)}</span>
                  <button onClick={() => handleEdit(r)} className="p-1 text-gray-400 hover:text-blue-500 shrink-0">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => setDeleteId(r.id)} className="p-1 text-gray-400 hover:text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <UsageForm record={editRecord} onClose={handleCloseForm} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-5 mx-4 w-72">
            <p className="text-sm text-gray-700 mb-4">确定删除这条领用记录吗？</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg">取消</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}
