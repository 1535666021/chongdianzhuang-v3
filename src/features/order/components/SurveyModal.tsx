import { useState, useMemo, useEffect } from 'react'
import type { Order } from '@/types'
import { useSurvey } from '../hooks/useSurvey'
import { getShortName } from '../utils/surveyUtils'
import { addonMaterialsData, costMaterials } from '@/constants/materialData'
import { useSettingsStore } from '@/stores/settingsStore'
import { useOrderStore } from '@/stores/orderStore'
import { Save, X, Copy, FileText } from 'lucide-react'
import { getMaterialFrequency, sortMaterialsByFrequency } from '@/features/material/hooks/useMaterialFrequency'
import { Stepper } from '@/shared/components/Stepper'
import { BottomSheetSelect } from '@/shared/components/BottomSheetSelect'
import { useToast } from '@/shared/hooks/useToast'
import { formatCurrency } from '@/shared/utils/format'
import { calcOverFee, DEFAULT_PACKAGE_METERS } from '@/shared/utils/orderCalc'
import '../../../shared/components/Modal.css'

interface SurveyModalProps {
  order: Order
  onClose: () => void
}

const POWER_OPTIONS = ['国网取电', '物业配电', '自家电表', '其他'] as const
const CABLE_SPECS = ['3*6', '3*10', '3*16', '4*6', '4*10', '5*6', '5*10', '5*16', '2*4', '2*6', '其他']
const INSTALL_OPTIONS = ['壁挂安装', '立柱安装', '吊装', '其他'] as const
const METER_STATUS_OPTIONS = ['已安装', '未安装'] as const
const BLUEPRINT_OPTIONS = ['是', '否'] as const
const RESULT_OPTIONS = ['勘测完成', '符合安装', '不符合安装', '需整改', '待定'] as const

export default function SurveyModal({ order, onClose }: SurveyModalProps) {
  const {
    form, effectiveBrand, brandList, brandAddons,
    selectedBrand, setSelectedBrand,
    updateForm, toggleAddon, removeAddon, updateQuantity, totalEstimatedCost, save,
  } = useSurvey(order)

  const [showDropdown, setShowDropdown] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [surveyNote, setSurveyNote] = useState(order.surveyNote || '')
  const toast = useToast()
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const engineerName = useSettingsStore((s) => s.engineerName)
  const engineerPhone = useSettingsStore((s) => s.engineerPhone)
  const sortedBrandAddons = useMemo(
    () => sortMaterialsByFrequency(brandAddons, getMaterialFrequency()), [brandAddons])
  const needsBrandSelect = !order.brandName && !selectedBrand

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  const getDisplayPrice = (name: string, fallback: number) => {
    const addon = addonMaterialsData.find((m) => m.name === name)
    if (addon) return addon.settlementPrice
    const cost = costMaterials.find((m) => m.name === name)
    if (cost) return cost.settlementPrice
    return fallback
  }

  const isCableMat = (name: string) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    return mat && (mat.categoryCode === 'CABLE' || /电缆敷设 | 线缆敷设/.test(mat.name))
  }

  const calcCableDisplayFee = (name: string, distance: number) => {
    const mat = addonMaterialsData.find((a) => a.name === name)
    if (!mat) return 0
    return calcOverFee(distance, mat.freeQuota || DEFAULT_PACKAGE_METERS, mat.settlementPrice).overFee
  }

  const handleSave = () => {
    save()
    updateOrder(order.id, { surveyNote })
    onClose()
  }

  const reportText = useMemo(() => {
    const lines: string[] = []
    lines.push(`勘测完成时间：${new Date().toISOString().slice(0, 10)}`)
    lines.push(`勘测详情：${form.installMethod}`)
    lines.push(`勘测工程师及电话：${engineerName || ''} / ${engineerPhone || ''}`)
    lines.push(`用电方式：${form.powerSource}`)
    lines.push(`电表状态：${form.meterStatus}`)
    lines.push(`布线距离：${form.cableDistance || 0} 米`)
    if (form.estimatedMaterials.length > 0) {
      lines.push('')
      lines.push(`预计增项辅材明细：`)
      for (const m of form.estimatedMaterials) {
        const mat = addonMaterialsData.find((a) => a.name === m.name)
        const short = mat ? getShortName(mat.name, mat.category) : m.name
        const subtotal = m.unitPrice * m.quantity
        lines.push(`${short} ${m.quantity}${m.unit} × ¥${m.unitPrice} = ¥${subtotal.toFixed(2)}`)
      }
      lines.push('')
      lines.push(`预计增项合计：¥${totalEstimatedCost.toFixed(2)}元（以实际使用为准）`)
    }
    lines.push(`物业需要施工方案图：${form.needBlueprint}`)
    lines.push(`勘测结果：${form.surveyResult}`)
    lines.push(`（电缆上有准确的米标刻度）`)
    lines.push(`勘测备注：${form.locationInfo || ''}`)
    lines.push(`以上勘测情况请您回复"确认"，谢谢`)
    return lines.join('\n')
  }, [form, engineerName, engineerPhone, totalEstimatedCost])

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setShowReport(false)
      toast.toast.success('报告已复制')
    } catch {
      setShowReport(false)
      toast.toast.error('复制失败')
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">🔧 勘测记录</h2>
            <button onClick={onClose} className="modal-close">
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            {/* 📦 预估材料 */}
            <div className="modal-section">
              <h3 className="modal-section__title">📦 预估材料</h3>
              {needsBrandSelect ? (
                <select
                  value={selectedBrand || ''}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="modal-select"
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
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm"
                      style={{ borderRadius: '8px', borderColor: 'var(--color-border)' }}
                    >
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {showDropdown ? '收起列表' : '点击选择辅材'}
                        <span style={{ color: 'var(--color-text-aux)', marginLeft: '4px' }}>
                          ({brandAddons.length}种可选)
                        </span>
                      </span>
                      <span style={{ color: 'var(--color-text-aux)', fontSize: '12px' }}>
                        {showDropdown ? '▲' : '▼'}
                      </span>
                    </button>
                    {showDropdown && (
                      <div className="modal-dropdown">
                        {brandAddons.length === 0 ? (
                          <div className="modal-dropdown-empty">该品牌暂无材料</div>
                        ) : (
                          sortedBrandAddons.map((mat) => {
                            const checked = form.estimatedMaterials.some((m) => m.name === mat.name)
                            return (
                              <label
                                key={mat.id}
                                className="modal-dropdown-item"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  className="w-4 h-4 rounded"
                                  style={{ accentColor: 'var(--color-primary)' }}
                                  onChange={() => {
                                    const isAdding = !form.estimatedMaterials.some((em) => em.name === mat.name)
                                    toggleAddon(mat)
                                    if (isAdding) {
                                      setShowDropdown(false)
                                      const cableMatch = mat.name.match(/(3\*6|3\*10|3\*16|3x6|3x10|3x16|3X6|3X10|3X16|3×6|3×10|3×16|5\*6|5\*10|5\*16|2\*4|2\*6)/)
                                      if (cableMatch) {
                                        updateForm({ cableSpec: cableMatch[0] })
                                      }
                                    }
                                  }}
                                />
                                <span style={{ color: 'var(--color-text-primary)' }}>
                                  {getShortName(mat.name, mat.category)}
                                </span>
                                <span style={{ color: 'var(--color-text-aux)', fontSize: '12px' }}>¥{mat.settlementPrice}</span>
                              </label>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                  {form.estimatedMaterials.length > 0 && (
                    <div className="modal-material-list">
                      {form.estimatedMaterials.map((m) => {
                        const isCable = isCableMat(m.name)
                        const displayFee = isCable
                          ? calcCableDisplayFee(m.name, m.quantity)
                          : (m.quantity || 0) * m.unitPrice
                        return (
                          <div
                            key={m.name}
                            className="modal-material-item"
                          >
                            <span className="modal-material-name">
                              {getShortName(m.name, addonMaterialsData.find(a=>a.name===m.name)?.category || '其他')}
                            </span>
                            <span className="modal-material-price">¥{m.unitPrice}/m</span>
                            <input
                              type="number"
                              min={addonMaterialsData.find((a) => a.name === m.name)?.categoryCode === 'CABLE' ? 0 : 1}
                              value={String(m.quantity)}
                              onChange={(e) => updateQuantity(m.name, Number(e.target.value))}
                              className="modal-material-qty"
                            />
                            <span className="modal-material-total" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '80px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                ¥{displayFee.toFixed(2)}
                              </span>
                              {isCable && (
                                <span style={{ fontSize: '10px', color: 'var(--color-text-aux)', marginTop: '2px' }}>
                                  超米费
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAddon(m.name)}
                              className="modal-material-remove"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 🔌 线缆信息 */}
            <div className="modal-section">
              <h3 className="modal-section__title">🔌 线缆信息</h3>
              <div className="modal-section__grid">
                <div>
                  <label className="modal-label">取电方式</label>
                  <select
                    value={form.powerSource}
                    onChange={(e) => updateForm({ powerSource: e.target.value as any })}
                    className="modal-select"
                  >
                    {POWER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="modal-label">线缆规格</label>
                  <select
                    value={form.cableSpec}
                    onChange={(e) => updateForm({ cableSpec: e.target.value })}
                    className="modal-select"
                  >
                    <option value="">请选择</option>
                    {CABLE_SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="modal-label">电缆距离 (米)</label>
                  <input
                    type="number"
                    value={form.cableDistance || ''}
                    onChange={(e) => updateForm({ cableDistance: Number(e.target.value) })}
                    className="modal-input"
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="modal-label">预估费用 (元)</label>
                  <input
                    type="text"
                    value={formatCurrency(totalEstimatedCost)}
                    onChange={(e) => updateForm({ estimatedCableCost: Number(e.target.value.replace(/[^0-9.]/g, '')) })}
                    className="modal-input"
                    min={0}
                    placeholder="¥0.00"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* 🔧 勘测详情 */}
            <div className="modal-section">
              <h3 className="modal-section__title">🔧 勘测详情</h3>
              <div className="modal-section__grid">
                <div>
                  <label className="modal-label">安装方式</label>
                  <select
                    value={form.installMethod}
                    onChange={(e) => updateForm({ installMethod: e.target.value as any })}
                    className="modal-select"
                  >
                    {INSTALL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="modal-label">电表状态</label>
                  <select
                    value={form.meterStatus}
                    onChange={(e) => updateForm({ meterStatus: e.target.value as any })}
                    className="modal-select"
                  >
                    {METER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="modal-label">物业需要方案图</label>
                  <select
                    value={form.needBlueprint}
                    onChange={(e) => updateForm({ needBlueprint: e.target.value as any })}
                    className="modal-select"
                  >
                    {BLUEPRINT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="modal-label">勘测结果</label>
                  <select
                    value={form.surveyResult}
                    onChange={(e) => updateForm({ surveyResult: e.target.value as any })}
                    className="modal-select"
                  >
                    {RESULT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 📍 位置信息 */}
            <div className="modal-section">
              <h3 className="modal-section__title">📍 位置信息</h3>
              <textarea
                value={form.locationInfo}
                onChange={(e) => updateForm({ locationInfo: e.target.value })}
                className="modal-textarea"
                placeholder="输入位置描述..."
              />
            </div>

            {/* 📝 勘测备注 */}
            <div className="modal-section">
              <h3 className="modal-section__title">📝 备注</h3>
              <textarea
                value={surveyNote}
                onChange={(e) => setSurveyNote(e.target.value)}
                className="modal-textarea"
                placeholder="勘测备注（允许为空）"
                style={{ minHeight: '64px' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="modal-btn modal-btn--secondary">取消</button>
            <button
              onClick={() => setShowReport(true)}
              className="modal-btn modal-btn--secondary"
              style={{ color: 'var(--color-info)', borderColor: 'var(--color-info-border)' }}
            >
              生成报告
            </button>
            <button onClick={handleSave} className="modal-btn modal-btn--primary">确认</button>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">勘测报告</h3>
              <button onClick={() => setShowReport(false)} className="modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <pre className="modal-report-content">
                {reportText}
              </pre>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCopyReport}
                className="modal-btn modal-btn--primary"
              >
                <Copy size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                一键复制
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
