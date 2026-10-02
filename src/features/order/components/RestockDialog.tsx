import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Order } from '@/types'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { buildRestockShipmentText, restockTargets, powerOf } from '../restock'
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
  // P0-122：工程师信息（话术变量{{engineerName}}/{{engineerPhone}}同源storage键）
  const engineerName = useSettingsStore((s) => s.engineerName)
  const engineerPhone = useSettingsStore((s) => s.engineerPhone)

  const [materials, setMaterials] = useState<RestockMaterialRow[]>([])
  const [manualName, setManualName] = useState('')
  const [manualQty, setManualQty] = useState('1')
  const [previewText, setPreviewText] = useState('')
  const [previewDirty, setPreviewDirty] = useState(false)

  // P0-133-R2：有效状态口径（helper共用，仅待办+需补桩）
  const targets = useMemo(() => restockTargets(orders), [orders]);

  // P0-133-R2：功率缺失醒目提醒统计
  // P0-135：吉利系空功率默认7kW，不再计入未填黄条
  const missingPowerCount = targets.filter((o) => !powerOf(o)).length
  const shipmentText = buildRestockShipmentText(new Date(), targets, materials, engineerAddress || '', { name: engineerName, phone: engineerPhone })

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
          {/* P0-133-R2：功率缺失醒目提醒（黄底横幅） */}
          {missingPowerCount > 0 && (
            <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2.5 text-sm font-medium text-yellow-800">
              ⚠️ 有 {missingPowerCount} 单功率未填，请先在订单卡补选功率后再发仓库
            </div>
          )}

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
