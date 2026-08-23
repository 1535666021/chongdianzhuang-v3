import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildRestockShipmentText, isInstallOrder } from '../restock'
import type { RestockMaterialRow } from '../restock'
import { toast } from '@/shared/hooks/useToast'
import '../../../shared/components/Modal.css'

interface RestockDialogProps {
  open: boolean
  onClose: () => void
}

export default function RestockDialog({ open, onClose }: RestockDialogProps) {
  const orders = useOrderStore((s) => s.orders)
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const engineerAddress = useSettingsStore((s) => s.engineerAddress)

  const [materials, setMaterials] = useState<RestockMaterialRow[]>([])
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState('1')
  const [previewText, setPreviewText] = useState('')
  const [previewDirty, setPreviewDirty] = useState(false)

  const targets = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.restockStatus === 'needed' &&
          o.status !== '回收站' &&
          o.status !== '已完成' &&
          isInstallOrder(o),
      ),
    [orders],
  )

  const shipmentText = buildRestockShipmentText(new Date(), targets, materials, engineerAddress || '')

  useEffect(() => {
    if (!open) {
      setPreviewDirty(false)
      setManualName('')
      setManualQty('1')
      return
    }
    if (!previewDirty) setPreviewText(shipmentText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shipmentText, previewDirty])

  const materialOptions = useMemo(() => {
    const names = new Set<string>()
    for (const order of orders) {
      for (const m of order.materials || []) {
        if (m.name?.trim()) names.add(m.name.trim())
      }
    }
    return [...names]
  }, [orders])

  const patchMaterial = (index: number, patch: Partial<RestockMaterialRow>) =>
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  const removeMaterial = (index: number) =>
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  const handlePick = (name: string) => {
    if (!name) return
    setMaterials((prev) => [...prev, { name, quantity: '1' }])
  }
  const handleManualAdd = () => {
    const name = manualName.trim()
    if (!name) {
      toast.error('请输入辅材名称')
      return
    }
    setMaterials((prev) => [...prev, { name, quantity: manualQty.trim() || '1' }])
    setManualName('')
    setManualQty('1')
  }

  const handleCopy = async () => {
    const ids = targets.map((o) => o.id)
    try {
      await navigator.clipboard.writeText(previewText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = previewText
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ids.forEach((id) => updateOrder(id, { restockStatus: 'done' }))
    setMaterials([])
    setManualName('')
    setManualQty('1')
    setPreviewDirty(false)
    toast.success(`发货单已复制，${ids.length} 单已标记「已补桩」`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">一键补桩</h2>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-gray-600 mb-2">
            本次纳入 {targets.length} 单需补桩安装单，复制后全部标记「已补桩」。
          </p>

          <textarea
            className="modal-textarea restock-preview"
            value={previewText}
            aria-label="发货单预览，可直接编辑"
            onChange={(e) => { setPreviewText(e.target.value); setPreviewDirty(true) }}
          />

          <div className="text-sm font-medium mt-3 mb-2">辅材（可整区不填）</div>
          <div className="space-y-2">
            <select className="modal-input" value="" onChange={(e) => handlePick(e.target.value)}>
              <option value="">从订单材料选择添加…</option>
              {materialOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                className="modal-input flex-1"
                placeholder="手动输入辅材名称"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
              <input
                className="modal-input restock-qty"
                placeholder="数量"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
              />
              <button type="button" className="modal-btn modal-btn--primary modal-btn--sm" onClick={handleManualAdd}>添加</button>
            </div>

            {materials.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="modal-input flex-1"
                  placeholder="辅材名称"
                  value={item.name}
                  onChange={(e) => patchMaterial(index, { name: e.target.value })}
                />
                <input
                  className="modal-input restock-qty"
                  placeholder="数量"
                  value={item.quantity}
                  onChange={(e) => patchMaterial(index, { quantity: e.target.value })}
                />
                <button type="button" className="modal-btn modal-btn--secondary modal-btn--sm" onClick={() => removeMaterial(index)}>删</button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn--secondary">取消</button>
          <button type="button" className="modal-btn modal-btn--primary" disabled={targets.length === 0} onClick={handleCopy}>
            一键复制
          </button>
        </div>
      </div>
    </div>
  )
}
