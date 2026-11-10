import { useOutletContext } from 'react-router-dom'
import { useOrderStore } from '@/stores/orderStore'
import { runSubBrandFix } from '@/shared/dataFix/subBrandFix'

/**
 * P0-246-R2（甲方二次裁示「直接修就行，不需要留记录」）：子品牌归正——一键直修。
 * 设置页一个「品牌归正」钮 → 点击直接修 → toast 报「已修正 N 单」；
 * 无 plan 预览确认页、无修正记录页；保留备份（cdz_v3_subbrand_backup_<ts>）+幂等（重跑即空）。
 */
export default function SubBrandFixTool() {
  const orders = useOrderStore((s) => s.orders)
  const { toast } = useOutletContext<{ toast: { success: (m: string) => void; error: (m: string) => void } }>()

  const doFix = () => {
    const r = runSubBrandFix(orders)
    if (r.total === 0) {
      toast.success('无需修正（0 单命中，幂等）')
      return
    }
    toast.success(`已修正 ${r.fixed} 单（执行前已备份 ${r.backupKey}）`)
  }

  return (
    <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', marginTop: '12px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>品牌归正（P0-246）</h3>
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-aux)' }}>
        历史错标单（母品牌+子品牌词车型/文本）一键归正为子品牌词。执行前自动备份，可重跑（重跑即空）。
      </p>
      <button type="button" className="modal-confirm" onClick={doFix}>品牌归正</button>
    </div>
  )
}
