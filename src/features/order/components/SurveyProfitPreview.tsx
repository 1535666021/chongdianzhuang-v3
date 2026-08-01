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
  materials,
  serviceFee,
  platformRate,
}: SurveyProfitPreviewProps) {
  const { customerReceivable, platformFee, materialCost, profit } = useMemo(() => {
    const costResult = calcMaterialCost(materials)
    const receivable = estimatedCost + serviceFee
    const fee = calcPlatformFee(estimatedCost, platformRate)
    return {
      customerReceivable: receivable,
      platformFee: fee,
      materialCost: costResult.total,
      profit: calcProfit(receivable, costResult.total, fee),
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
          <span>平台费用</span><strong>-{formatCurrency(platformFee)}</strong>
        </div>
        <div className="survey-profit-preview__row">
          <span>预估材料成本</span><strong>-{formatCurrency(materialCost)}</strong>
        </div>
        <div className={`survey-profit-preview__profit ${profit >= 0 ? 'is-positive' : 'is-negative'}`}>
          <span>预计利润</span><strong>{formatCurrency(profit)}</strong>
        </div>
      </div>
    </CollapsePanel>
  )
}
