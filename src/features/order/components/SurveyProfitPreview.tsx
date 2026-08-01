import { useMemo } from 'react'
import { CollapsePanel } from '@/shared/components/CollapsePanel'
import { formatCurrency } from '@/shared/utils/format'
import { calcMaterialCost, calcPlatformFee, calcProfit } from '@/shared/utils/orderCalc'
import type { SurveyMaterialItem } from '../types/survey'
import './SurveyProfitPreview.css'

interface SurveyProfitPreviewProps {
  estimatedCost: number
  cableCost: number
  materials: SurveyMaterialItem[]
  serviceFee: number
  platformRate: number
}

export function SurveyProfitPreview({
  estimatedCost,
  cableCost,
  materials,
  serviceFee,
  platformRate,
}: SurveyProfitPreviewProps) {
  const { customerReceivable, platformFee, materialCost, profit, unmatched } = useMemo(() => {
    const costResult = calcMaterialCost(materials)
    const receivable = estimatedCost + serviceFee
    const fee = calcPlatformFee(receivable, platformRate)
    return {
      customerReceivable: receivable,
      platformFee: fee,
      materialCost: costResult.total,
      profit: calcProfit(receivable, costResult.total, fee),
      unmatched: costResult.unmatched,
    }
  }, [estimatedCost, materials, platformRate, serviceFee])

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
          <span>服务费</span><strong>{formatCurrency(serviceFee)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>客户应收</span><strong>{formatCurrency(customerReceivable)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>电缆超米费</span><strong>{formatCurrency(cableCost)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>平台费用</span><strong>-{formatCurrency(platformFee)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>预估材料成本</span><strong>-{formatCurrency(materialCost)}</strong>
        </div>
        <div className={`survey-profit-preview__profit ${profit >= 0 ? 'is-positive' : 'is-negative'}`}>
          <span>预计利润</span><strong>{formatCurrency(profit)}</strong>
        </div>
        {unmatched.length > 0 && (
          <p className="survey-profit-preview__hint">{unmatched.length} 项材料未匹配成本价</p>
        )}
      </div>
    </CollapsePanel>
  )
}
