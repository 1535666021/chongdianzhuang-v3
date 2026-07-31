import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, User, Phone, Calendar, FileText, Ruler, Copy, MessageCircle } from 'lucide-react'
import { useCompletion } from '../hooks/useCompletion'
import { MaterialPicker } from '../components/MaterialPicker'
import { ProfitPreview } from '../components/ProfitPreview'
import { useOrderStore } from '@/stores/orderStore'
import { useSettingsStore } from '@/stores/settingsStore'
import CostBindModal from '@/features/material/components/CostBindModal'
import { scriptStorage } from '@/shared/storage/scriptStorage'
import { buildScriptVarsFromCompletionForm, renderScript } from '../hooks/useScript'
import { useState, useEffect } from 'react'
import { useToast } from '@/shared/hooks/useToast'
import { InfoSection, InfoItem } from '@/shared/components/InfoSection'
import { CollapsePanel } from '@/shared/components/CollapsePanel'
import '../../../shared/components/OrderComplete.css'

export default function OrderComplete() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { order, form, profit, packageMeters, setPackageMeters, packageBreakdown, updateForm, addMaterial, updateMaterial, removeMaterial, updateFixedAux, save, pendingCostBind, handleCostBound, handleCostBindClose } = useCompletion(id || '')
  const updateOrder = useOrderStore((s) => s.updateOrder)
  const settings = useSettingsStore()
  const toast = useToast()
  const [copiedScript, setCopiedScript] = useState(false)
  const [engineerPhone, setEngineerPhone] = useState(settings.engineerPhone || '')

  useEffect(() => {
    if (!form.installer && settings.engineerName) {
      updateForm({ installer: settings.engineerName })
    }
    if (!engineerPhone && settings.engineerPhone) {
      setEngineerPhone(settings.engineerPhone)
    }
  }, [])

  if (!order) return null
  if (!order.survey) return <div className="order-complete-page"><p className="order-complete__hint">该订单尚未勘测，请先完成勘测</p></div>

  const handleSave = () => {
    updateOrder(order.id, { completionNotes: form.notes })
    if (save()) {
      navigate('/completed')
    }
  }

  const handleGenerateScript = () => {
    const brandName = order.brandName || '通用'
    const all = scriptStorage.getAll()
    const template = all.find(t => t.brand === brandName && t.scene === '安装完成') || all.find(t => t.id === 'default-install-complete')
    if (template) {
      const vars = buildScriptVarsFromCompletionForm(
        { ...form, customerReceivable: profit.customerReceivable, actualProfit: profit.actualProfit },
        order,
        { engineerName: settings.engineerName || '谢责强', engineerPhone: engineerPhone || '' }
      )
      const text = renderScript(template.content, vars)
      navigator.clipboard.writeText(text)
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 1500)
      toast.toast.success('话术已复制')
    }
  }

  return (
    <>
      <div className="order-complete-page">
        <div className="order-complete__header">
          <button onClick={() => navigate(-1)} className="order-complete__back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="order-complete__title">标记完成</h1>
        </div>

        <div className="order-complete__content">
          {/* 订单基本信息 */}
          <InfoSection title="订单信息">
            <InfoItem label="客户" value={order.customerName} />
            <InfoItem 
              label="平台" 
              value={`${order.platform}${order.platformName ? ` (${order.platformName})` : ''}`} 
            />
            {order.brandName && (
              <InfoItem 
                label="品牌" 
                value={`${order.brandName}${order.powerKw ? ` ${order.powerKw}kW` : ''}`} 
              />
            )}
            <InfoItem label="地址" value={order.address} />
          </InfoSection>

          {/* 表单区 */}
          <div className="order-complete__section">
            <h3 className="order-complete__section-title">完成信息</h3>
            
            <div className="order-complete__form-item">
              <label className="order-complete__label">
                <Calendar size={12} />
                完成日期
              </label>
              <input
                type="date"
                value={form.completeDate}
                onChange={(e) => updateForm({ completeDate: e.target.value })}
                className="order-complete__input"
              />
            </div>

            <div className="order-complete__form-item">
              <label className="order-complete__label">
                <User size={12} />
                安装工
              </label>
              <input
                type="text"
                value={form.installer}
                onChange={(e) => updateForm({ installer: e.target.value })}
                placeholder="输入安装工姓名"
                className="order-complete__input"
              />
            </div>

            <div className="order-complete__form-item">
              <label className="order-complete__label">
                <Phone size={12} />
                安装工电话
              </label>
              <input
                type="tel"
                value={engineerPhone}
                onChange={(e) => setEngineerPhone(e.target.value)}
                placeholder="输入安装工电话"
                className="order-complete__input"
              />
            </div>

            <div className="order-complete__form-item">
              <label className="order-complete__label">
                <Ruler size={12} />
                套餐米数（电缆/PVC免费额）
              </label>
              <input
                type="number"
                value={packageMeters}
                onChange={(e) => setPackageMeters(parseFloat(e.target.value) || 0)}
                placeholder="默认 30 米"
                className="order-complete__input"
              />
              <p className="order-complete__hint">
                电缆和 PVC 在{packageMeters}米内不计费
              </p>
            </div>

            <div className="order-complete__form-item">
              <label className="order-complete__label">
                <FileText size={12} />
                备注
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => updateForm({ notes: e.target.value })}
                placeholder="完工备注（会带入话术，允许为空）"
                rows={2}
                className="order-complete__textarea"
              />
            </div>
          </div>

          {/* 勘测信息 */}
          {order.survey && (
            <CollapsePanel title="勘测信息">
              <div className="order-complete__survey-grid">
                <div>
                  <span className="order-complete__survey-label">取电方式</span>
                  <p className="order-complete__survey-value">{order.survey.powerSource || '-'}</p>
                </div>
                <div>
                  <span className="order-complete__survey-label">线缆规格</span>
                  <p className="order-complete__survey-value">{order.survey.cableSpec || '-'}</p>
                </div>
                <div>
                  <span className="order-complete__survey-label">电缆距离</span>
                  <p className="order-complete__survey-value">{order.survey.cableDistance || 0}米</p>
                </div>
                <div>
                  <span className="order-complete__survey-label">安装方式</span>
                  <p className="order-complete__survey-value">{order.survey.installMethod || '-'}</p>
                </div>
                <div>
                  <span className="order-complete__survey-label">电表状态</span>
                  <p className="order-complete__survey-value">{order.survey.meterStatus || '-'}</p>
                </div>
                <div>
                  <span className="order-complete__survey-label">勘测结果</span>
                  <p className="order-complete__survey-value">{order.survey.surveyResult || '-'}</p>
                </div>
              </div>
            </CollapsePanel>
          )}

          {/* 材料区 */}
          <div className="order-complete__section">
            <MaterialPicker
              materials={form.materials}
              fixedAux={form.fixedAux}
              onAdd={addMaterial}
              onUpdate={updateMaterial}
              onRemove={removeMaterial}
              onUpdateFixedAux={updateFixedAux}
            />
          </div>

          {/* 套餐明细 */}
          {packageBreakdown.freeAmount > 0 && (
            <div className="order-complete__package">
              <h3 className="order-complete__package-title">套餐优惠</h3>
              <div className="order-complete__package-list">
                {packageBreakdown.items.filter((i) => i.freeQuantity > 0).map((item) => (
                  <div key={item.materialName} className="order-complete__package-item">
                    <span className="order-complete__package-name">{item.materialName}</span>
                    <span className="order-complete__package-amount">
                      免费{item.freeQuantity}米 / 超{item.overQuantity}米
                    </span>
                  </div>
                ))}
                <div className="order-complete__package-total">
                  <span className="order-complete__package-total-label">合计优惠</span>
                  <span className="order-complete__package-total-amount">
                    ¥{packageBreakdown.freeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 利润区 */}
          <ProfitPreview data={profit} />

          {/* 话术生成 */}
          <button
            onClick={handleGenerateScript}
            className={`order-complete__btn order-complete__btn--script ${copiedScript ? 'copied' : ''}`}
          >
            {copiedScript ? (
              <>
                <CheckCircle size={16} /> 话术已复制
              </>
            ) : (
              <>
                <MessageCircle size={16} /> 生成完工话术
              </>
            )}
          </button>

          {/* 确认按钮 */}
          <button onClick={handleSave} className="order-complete__btn order-complete__btn--primary">
            <CheckCircle size={18} />
            确认完成
          </button>
        </div>
      </div>

      {pendingCostBind && (
        <CostBindModal
          materialName={pendingCostBind}
          onClose={handleCostBindClose}
          onBound={handleCostBound}
        />
      )}
    </>
  )
}
