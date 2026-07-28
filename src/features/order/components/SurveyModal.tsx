import { useState } from 'react'
import type { Order } from '@/types'
import { useSurvey } from '../hooks/useSurvey'
import { getShortName } from '../utils/surveyUtils'
import { addonMaterialsData, costMaterials } from '@/constants/materialData'
import { Save, X } from 'lucide-react'

interface SurveyModalProps {
  order: Order
  onClose: () => void
}

const POWER_OPTIONS = ['国网取电', '物业配电', '自家电表', '其他'] as const
const CABLE_SPECS = ['3*6', '3*10', '4*6', '4*10', '5*6', '5*10', '2*4', '2*6', '其他']
const INSTALL_OPTIONS = ['壁挂安装', '立柱安装', '吊装', '其他'] as const
const METER_STATUS_OPTIONS = ['已安装', '未安装'] as const
const BLUEPRINT_OPTIONS = ['是', '否'] as const
const RESULT_OPTIONS = ['勘测完成', '符合安装', '不符合安装', '需整改', '待定'] as const

export default function SurveyModal({ order, onClose }: SurveyModalProps) {
  const {
    form, effectiveBrand, brandList, brandAddons,
    selectedBrand, setSelectedBrand,
    updateForm, toggleAddon, removeAddon, updateQuantity, save,
  } = useSurvey(order)

  const [showDropdown, setShowDropdown] = useState(false)
  const needsBrandSelect = !order.brandName && !selectedBrand

  const getDisplayPrice = (name: string, fallback: number) => {
    const addon = addonMaterialsData.find((m) => m.name === name)
    if (addon) return addon.settlementPrice
    const cost = costMaterials.find((m) => m.name === name)
    if (cost) return cost.settlementPrice
    return fallback
  }

  const handleSave = () => {
    save()
    onClose()
  }

  const sectionClass = 'bg-gray-50 rounded-xl p-3'
  const labelClass = 'text-xs text-gray-500 mb-1'
  const selectClass = 'w-full px-2 py-1.5 bg-white rounded-lg text-sm border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700'
  const inputClass = 'w-full px-2 py-1.5 bg-white rounded-lg text-sm border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-lg">🔧</span> 勘测记录
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 📦 预估材料 */}
          <div className={sectionClass}>
            <h3 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
              <span>📦</span> 预估材料
            </h3>
            {needsBrandSelect ? (
              <select
                value={selectedBrand || ''}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className={selectClass}
              >
                <option value="">请选择车辆品牌</option>
                {brandList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            ) : (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
                  >
                    <span className="text-gray-500">
                      {showDropdown ? '收起列表' : '点击选择辅材'}
                      <span className="text-gray-400 ml-1">({brandAddons.length}种可选)</span>
                    </span>
                    <span className="text-gray-400 text-xs">{showDropdown ? '▲' : '▼'}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {brandAddons.length === 0 ? (
                        <div className="p-3 text-sm text-gray-400 text-center">该品牌暂无材料</div>
                      ) : (
                        brandAddons.map((mat) => {
                          const checked = form.estimatedMaterials.some((m) => m.name === mat.name)
                          return (
                            <label
                              key={mat.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                 onChange={() => {
                                    const isAdding = !form.estimatedMaterials.some((em) => em.name === mat.name)
                                    toggleAddon(mat)
                                    if (isAdding) {
                                      setShowDropdown(false)
                                      const cableMatch = mat.name.match(/(3\*6|3\*10|3\*16|5\*6|5\*10|5\*16|2\*4|2\*6)/)
                                      if (cableMatch) {
                                        updateForm({ cableSpec: cableMatch[0] })
                                      }
                                    }
                                  }}
                                className="w-4 h-4 rounded accent-blue-600"
                              />
                              <span className="text-gray-700">{getShortName(mat.name, mat.category)}</span>
                              <span className="text-gray-400 text-xs">{mat.settlementPrice}元</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
                {form.estimatedMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.estimatedMaterials.map((m) => (
                      <span
                        key={m.name}
                        className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                      >
                        {m.name || '未命名'} {getDisplayPrice(m.name, m.unitPrice)}元
                        × <input
                          type="number"
                          min={addonMaterialsData.find((a) => a.name === m.name)?.categoryCode === 'CABLE' ? 0 : 1}
                          value={m.quantity}
                          onChange={(e) => updateQuantity(m.name, Number(e.target.value))}
                          className="w-10 text-center text-xs bg-white border rounded mx-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeAddon(m.name)}
                          className="text-blue-400 hover:text-blue-600 ml-0.5 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 🔌 线缆信息 */}
          <div className={sectionClass}>
            <h3 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
              <span>🔌</span> 线缆信息
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className={labelClass}>取电方式</div>
                <select
                  value={form.powerSource}
                  onChange={(e) => updateForm({ powerSource: e.target.value as any })}
                  className={selectClass}
                >
                  {POWER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div className={labelClass}>线缆规格</div>
                <select
                  value={form.cableSpec}
                  onChange={(e) => updateForm({ cableSpec: e.target.value })}
                  className={selectClass}
                >
                  <option value="">请选择</option>
                  {CABLE_SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className={labelClass}>电缆距离(米)</div>
                <input
                  type="number"
                  value={form.cableDistance || ''}
                  onChange={(e) => updateForm({ cableDistance: Number(e.target.value) })}
                  className={inputClass}
                  min={0}
                  placeholder="0"
                />
              </div>
              <div>
                <div className={labelClass}>预估费用(元)</div>
                <input
                  type="number"
                  value={form.estimatedCableCost || ''}
                  onChange={(e) => updateForm({ estimatedCableCost: Number(e.target.value) })}
                  className={inputClass}
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 🔧 勘测详情 */}
          <div className={sectionClass}>
            <h3 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
              <span>🔧</span> 勘测详情
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className={labelClass}>安装方式</div>
                <select
                  value={form.installMethod}
                  onChange={(e) => updateForm({ installMethod: e.target.value as any })}
                  className={selectClass}
                >
                  {INSTALL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div className={labelClass}>电表状态</div>
                <select
                  value={form.meterStatus}
                  onChange={(e) => updateForm({ meterStatus: e.target.value as any })}
                  className={selectClass}
                >
                  {METER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div className={labelClass}>物业需要方案图</div>
                <select
                  value={form.needBlueprint}
                  onChange={(e) => updateForm({ needBlueprint: e.target.value as any })}
                  className={selectClass}
                >
                  {BLUEPRINT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div className={labelClass}>勘测结果</div>
                <select
                  value={form.surveyResult}
                  onChange={(e) => updateForm({ surveyResult: e.target.value as any })}
                  className={selectClass}
                >
                  {RESULT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 📍 位置信息 */}
          <div className={sectionClass}>
            <h3 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-1">
              <span>📍</span> 位置信息
            </h3>
            <textarea
              value={form.locationInfo}
              onChange={(e) => updateForm({ locationInfo: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 resize-none h-20 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              placeholder="输入位置描述..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
