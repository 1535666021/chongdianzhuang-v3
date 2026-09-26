import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { Material } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMaterialStore } from '@/stores/materialStore'
import { toast } from '@/shared/hooks/useToast'
import { getAllCostMaterials, isCustomCostMaterial, CUSTOM_COST_PREFIX } from '@/shared/utils/costMaterialsResolver'
import { removeCostMappingsByCostName } from '@/shared/storage/costMappingStorage'

/**
 * 成本表管理（P0-126补增删）：改价既有逻辑不变（settingsStore覆盖制）；
 * 新增项存materialStore（id=custom_cost_前缀），删除仅新增项开放（底表20项不提供删除，
 * 防破坏既有计算链路），删除时同步清理成本绑定映射(cdz_cost_mapping_v1)中指向该成本名的条目。
 */
export default function CostSheetManager() {
  const setCostPrice = useSettingsStore((s) => s.setCostPrice)
  const materialsVersion = useMaterialStore((s) => s.materials) // 订阅触发重渲染，增删即时生效
  const addMaterial = useMaterialStore((s) => s.addMaterial)
  const deleteMaterial = useMaterialStore((s) => s.deleteMaterial)
  const costMaterials = getAllCostMaterials()
  void materialsVersion
  const [editablePrice, setEditablePrice] = useState<{ id: string; price: string } | null>(null)

  // P0-126：新增表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('其他')
  const [newUnit, setNewUnit] = useState('')
  const [newCostPrice, setNewCostPrice] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const CATEGORY_OPTIONS = ['其他', '电缆', '辅材', '桥架', '保护箱', '立柱', '开孔', '开挖', '基础', '接地', '服务']

  const handleAdd = () => {
    const name = newName.trim()
    const unit = newUnit.trim()
    const price = Number(newCostPrice)
    if (!name) { toast.error('材料名称必填'); return }
    if (!unit) { toast.error('单位必填'); return }
    if (newCostPrice.trim() === '' || !Number.isFinite(price) || price < 0) { toast.error('成本价必填且≥0'); return }
    // 重名拒绝（含底表+已有新增项）
    if (getAllCostMaterials().some((m) => m.name === name)) { toast.error(`已存在同名材料"${name}"，请换名或编辑现有项`); return }
    const material: Material = {
      id: `${CUSTOM_COST_PREFIX}${Date.now()}`,
      name,
      category: newCategory as Material['category'],
      categoryCode: 'OTHER',
      unit,
      costPrice: price,
      settlementPrice: price,
      customerPrice: undefined,
      brand: '',
      freeQuota: 0,
      source: 'cost',
      stock: 0,
      minStock: 0,
      isFixed: false,
    }
    addMaterial(material)
    toast.success(`已新增"${name}"`)
    setNewName(''); setNewUnit(''); setNewCostPrice(''); setShowAddForm(false)
  }

  const handleDeleteConfirm = (m: Material) => {
    deleteMaterial(m.id)
    removeCostMappingsByCostName(m.name)
    toast.success(`已删除"${m.name}"，相关成本绑定映射已同步清理`)
    setConfirmDeleteId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => history.back()} className="p-1"><ArrowLeft size={20} /></button>
        <h1 className="font-semibold text-lg">成本表管理</h1>
      </div>
      <div className="p-4">
        {/* P0-126：新增材料入口 */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-3 py-2 rounded-lg text-sm bg-blue-600 text-white"
        >
          {showAddForm ? '收起新增表单' : '＋ 新增材料'}
        </button>
        {showAddForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-3 space-y-2">
            <input className="modal-input w-full px-3 py-2 bg-gray-100 rounded-lg text-sm" placeholder="材料名称（必填）" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
              <select className="modal-input flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="modal-input w-24 px-3 py-2 bg-gray-100 rounded-lg text-sm" placeholder="单位（必填）" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
            </div>
            <input className="modal-input w-full px-3 py-2 bg-gray-100 rounded-lg text-sm" placeholder="成本价（必填，≥0）" type="number" min={0} value={newCostPrice} onChange={(e) => setNewCostPrice(e.target.value)} />
            <button onClick={handleAdd} className="w-full py-2 rounded-lg text-sm bg-green-600 text-white">确认新增</button>
          </div>
        )}

        <div className="space-y-2">
          {costMaterials.map((material) => (
            <div key={material.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{material.name}</div>
                  <div className="text-sm text-gray-500">{material.category} · {material.unit}</div>
                </div>
                <div className="flex items-center gap-2">
                  {editablePrice?.id === material.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" className="modal-input w-24 px-2 py-1 bg-gray-100 rounded text-sm" value={editablePrice.price} onChange={(e) => setEditablePrice({ id: material.id, price: e.target.value })} autoFocus />
                      <button onClick={() => { const p = Number(editablePrice.price); if (!Number.isFinite(p) || p < 0) { toast.error('价格必须≥0'); return } setCostPrice(material.id, p); setEditablePrice(null) }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">保存</button>
                      <button onClick={() => setEditablePrice(null)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditablePrice({ id: material.id, price: material.costPrice?.toString() || '0' })} className="text-blue-600 font-medium">¥{material.costPrice?.toFixed(2) || '0.00'}</button>
                      {/* P0-126：仅新增项可删除；底表20项不提供删除入口 */}
                      {isCustomCostMaterial(material.id) && (
                        <button onClick={() => setConfirmDeleteId(material.id)} className="text-xs text-red-500 border border-red-200 rounded px-2 py-1">删除</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* P0-126：删除二次确认——知情文案：历史金额实时重算会缺成本价 */}
              {confirmDeleteId === material.id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-700 leading-relaxed">
                    确认删除"{material.name}"？删除后新计算将找不到该材料成本价；已产生的历史金额不受影响（注：利润为实时计算，涉及该材料的旧单重算会缺成本价）。
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDeleteConfirm(material)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">确认删除</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 bg-gray-200 rounded text-sm">取消</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
