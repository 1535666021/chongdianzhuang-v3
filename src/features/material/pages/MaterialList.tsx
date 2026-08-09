import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, PackageOpen, Upload } from 'lucide-react'
import { useMaterial } from '../hooks/useMaterial'
import { UsageForm } from '../components/UsageForm'
import { ImportMaterialModal } from '../components/ImportMaterialModal'
import type { MaterialUsageRecord } from '@/types'
import { EmptyState } from '@/shared/components/EmptyState'
import '../../../shared/components/MaterialList.css'

export default function MaterialList() {
  const navigate = useNavigate()
  const { usageRecords, deleteUsageRecord } = useMaterial()
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<MaterialUsageRecord | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

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
    <div className="material-list-page">
      <div className="material-list__header">
        <h1 className="material-list__title">材料领用</h1>
        <div className="material-list__actions">
          <button
            onClick={() => setShowImport(true)}
            className="material-list__btn material-list__btn--inventory"
          >
            <Upload size={14} /> 导入
          </button>
          <button
            onClick={() => navigate('/inventory')}
            className="material-list__btn material-list__btn--inventory"
          >
            <PackageOpen size={14} /> 库存
          </button>
          <button
            onClick={handleAdd}
            className="material-list__btn material-list__btn--add"
          >
            <Plus size={16} /> 新增领用
          </button>
        </div>
      </div>

      <div className="material-list__content">
        {groupedByMonth.length === 0 ? (
          <EmptyState
            type="materials"
            description="点击右上角新增领用添加"
          />
        ) : (
          groupedByMonth.map(({ month, label, records, total }) => (
            <div key={month} className="material-list__group">
              <div className="material-list__group-header">
                <span className="material-list__group-title">{label}</span>
                <span className="material-list__group-total">月合计 ¥{total.toFixed(2)}</span>
              </div>

              <div className="material-list__card">
                {records.map((r, i) => (
                  <div
                    key={r.id}
                    className={`material-list__item ${i < records.length - 1 ? 'material-list__item--border' : ''}`}
                  >
                    <span className="material-list__item-date">{r.date.slice(5)}</span>
                    <div className="material-list__item-info">
                      <span className="material-list__item-name">{r.name}</span>
                      <span className="material-list__item-unit">
                        {r.quantity}{r.unit} x ¥{r.costPrice}
                      </span>
                    </div>
                    <span className="material-list__item-amount">¥{r.total.toFixed(2)}</span>
                    <button onClick={() => handleEdit(r)} className="material-list__item-action">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="material-list__item-action material-list__item-action--delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <UsageForm record={editRecord} onClose={handleCloseForm} />
      )}

      {showImport && (
        <ImportMaterialModal onClose={() => setShowImport(false)} />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <p className="text-sm text-gray-700">确定删除这条领用记录吗？</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteId(null)} className="modal-btn modal-btn--secondary">取消</button>
              <button onClick={handleDelete} className="modal-btn modal-btn--danger">删除</button>
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
