import { useMemo } from 'react'
import { CollapsePanel } from '@/shared/components/CollapsePanel'
import { formatCurrency } from '@/shared/utils/format'
import { calcMaterialCost, calcPlatformFee, calcActualProfitByPolicy, calcTripSubsidy, isBreakerMaterial } from '@/shared/utils/orderCalc'
import type { SurveyMaterialItem } from '../types/survey'
import './SurveyProfitPreview.css'

interface SurveyProfitPreviewProps {
  estimatedCost: number
  cableCost: number
  materials: SurveyMaterialItem[]
  serviceFee: number
  /** P0-188-R1：收入侧标签动态化（勘测费/勘察费/维修费/安装费） */
  feeLabel?: string
  /** P0-188-R1：成本侧统一出口结果（含 unmatched 未绑定名单） */
  fullCostResult?: { total: number; unmatched: string[] }
  platformRate: number
  /** P0-100：吉利品牌单漏保厂家提供，预估材料成本剔除漏保行（客户价照列） */
  geelyExemptBreaker?: boolean
}

export function SurveyProfitPreview({
  estimatedCost,
  materials,
  serviceFee,
  feeLabel = '安装费',
  fullCostResult,
  platformRate,
  geelyExemptBreaker = false,
}: SurveyProfitPreviewProps) {
  const { customerReceivable, platformFee, materialCost, profit } = useMemo(() => {
    const costMaterials = geelyExemptBreaker ? materials.filter((m) => !isBreakerMaterial(m.name)) : materials
    const costResult = calcMaterialCost(costMaterials)
    const receivable = estimatedCost
    const fee = calcPlatformFee(estimatedCost, platformRate)
    return {
      customerReceivable: receivable,
      platformFee: fee,
      // P0-188-R1：优先统一出口（凡使用即有成本），旧路径兜底
      materialCost: fullCostResult ? fullCostResult.total : costResult.total,
      // P0-177-R3：勘测预览与完工/卡片/统计同出口（数值等价：fee取abs）
      profit: calcActualProfitByPolicy({
        customerPrice: receivable,
        // P0-188-R1：优先统一出口（凡使用即有成本），旧路径兜底
      materialCost: fullCostResult ? fullCostResult.total : costResult.total,
        platformFee: fee,
        serviceFee,
        tripSubsidy: 0,
        laborCost: 0,
      }),
    }
  }, [estimatedCost, materials, platformRate, serviceFee, geelyExemptBreaker])

  return (
    <CollapsePanel
      title={<span>费用预估 {formatCurrency(estimatedCost)}</span>}
      accentColor="blue"
      className="survey-profit-preview"
    >
      <div className="survey-profit-preview__content">
        <div className="survey-profit-preview__row">
          <span>预估增项</span><strong>{formatCurrency(estimatedCost)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>{feeLabel}</span><strong>{formatCurrency(serviceFee)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>客户应收</span><strong>{formatCurrency(customerReceivable)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>平台费用</span><strong>-{formatCurrency(platformFee)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>预估材料成本</span><strong>-{formatCurrency(materialCost)}</strong>
        </div>
        {fullCostResult && fullCostResult.unmatched.length > 0 && (
          <div className="survey-profit-preview__row" style={{ color: '#ea580c' }}>
            <span>⚠ {fullCostResult.unmatched.join('、')}未绑定成本价，预估偏低</span>
          </div>
        )}
        <div className={`survey-profit-preview__profit ${profit >= 0 ? 'is-positive' : 'is-negative'}`}>
          <span>预计利润</span><strong>{formatCurrency(profit)}</strong>
        </div>
      </div>
    </CollapsePanel>
  )
}

// P0-180：勘测弹窗最底部「利润预估」结论区（费用预估=成本侧在上，本区=结论侧）
// 军令状铁律：展示只读 orderCalc 唯一出口（calcActualProfitByPolicy），禁页面自算；
// 材料成本=本弹窗预估费用 totalEstimatedCost（与"费用预估"卡同源，增删材料/改数量实时联动）；
// 出差单：扣点免（fee=0）+补助行照列；应收为0结论行显"待填应收"占位，明细照列。
interface SurveyProfitConclusionProps {
  /** P0-188-R1：收入侧标签动态化 */
  feeLabel?: string
  /** 客户应收（实收覆盖后的 finalFee 口径） */
  receivable: number
  /** 预估材料成本（=本弹窗预估费用 totalEstimatedCost，与费用预估卡同源） */
  estimatedCost: number
  serviceFee: number
  platformRate: number
  /** 出差单：平台扣点免、出差补助照列 */
  isBusinessTrip?: boolean
}

export function SurveyProfitConclusion({
  feeLabel = '安装费',
  receivable,
  estimatedCost,
  serviceFee,
  platformRate,
  isBusinessTrip = false,
}: SurveyProfitConclusionProps) {
  // P0-180：材料成本=弹窗预估费用（费用预估卡显示值），与 form 材料/电缆/超米同源，
  // 弹窗内增删材料/改数量→totalEstimatedCost重算→本区实时联动；不在此二次计算（禁自算）
  const materialCost = estimatedCost
  const platformFee = isBusinessTrip ? 0 : calcPlatformFee(receivable, platformRate)
  const tripSubsidy = isBusinessTrip ? calcTripSubsidy(true) : 0
  const profit = calcActualProfitByPolicy({
    customerPrice: receivable,
    materialCost,
    platformFee,
    serviceFee,
    tripSubsidy,
    laborCost: 0,
  })

  return (
    <div className="survey-profit-conclusion">
      <div className="survey-profit-conclusion__head">
        {receivable > 0 ? (
          <strong className={profit >= 0 ? 'is-positive' : 'is-negative'}>
            {profit >= 0 ? `预计赚 ${formatCurrency(profit)}` : `预计赔 ${formatCurrency(Math.abs(profit))}`}
          </strong>
        ) : (
          <strong className="is-pending">待填应收</strong>
        )}
        <span className="survey-profit-conclusion__note">勘测口径，完工以核算为准</span>
      </div>
      <div className="survey-profit-conclusion__detail">
        <div className="survey-profit-conclusion__row"><span>客户应收</span><strong>{formatCurrency(receivable)}</strong></div>
        <div className="survey-profit-conclusion__row"><span>平台扣点{isBusinessTrip ? '（出差免）' : ''}</span><strong>-{formatCurrency(platformFee)}</strong></div>
        <div className="survey-profit-conclusion__row"><span>{feeLabel}</span><strong>+{formatCurrency(serviceFee)}</strong></div>
        <div className="survey-profit-conclusion__row"><span>预估材料成本</span><strong>-{formatCurrency(materialCost)}</strong></div>
        {isBusinessTrip && <div className="survey-profit-conclusion__row"><span>出差补助</span><strong>+{formatCurrency(tripSubsidy)}</strong></div>}
        <div className="survey-profit-conclusion__row survey-profit-conclusion__total"><span>= 利润</span><strong>{formatCurrency(profit)}</strong></div>
      </div>
    </div>
  )
}
