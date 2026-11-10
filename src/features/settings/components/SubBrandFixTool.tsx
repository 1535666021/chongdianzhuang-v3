import { useState } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { planSubBrandFix, runSubBrandFix } from '@/shared/dataFix/subBrandFix'

/**
 * P0-246：子品牌归正存量修正器——设置页入口（甲方裁示 run 生效）。
 * plan=列明细不执行（可反复看）；run=执行前确认框 → 备份+归正+留痕；重跑即空=幂等。
 */
export default function SubBrandFixTool() {
  const orders = useOrderStore((s) => s.orders)
  const [plan, setPlan] = useState<ReturnType<typeof planSubBrandFix> | null>(null)
  const [report, setReport] = useState<string>('')

  const doPlan = () => setPlan(planSubBrandFix(orders))

  const doRun = () => {
    if (!window.confirm(`确认归正 ${plan?.total ?? 0} 条存量子品牌错标单？执行前自动备份，可凭备份键手工恢复。`)) return
    const r = runSubBrandFix(orders)
    setReport(`已归正 ${r.fixed}/${r.total} 条；备份=${r.backedUp ? `已存 ${r.backupKey}` : '无需（0 条）'}；留痕 run_at=${r.runAt}`)
    setPlan(null)
  }

  return (
    <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', marginTop: '12px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>子品牌归正（P0-246）</h3>
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--color-text-aux)' }}>
        历史错标单（母品牌+子品牌词车型/文本）归正为子品牌词 brandName。一次性工具，重跑即空。
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button type="button" className="modal-select" onClick={doPlan}>① 计划（列明细）</button>
        <button type="button" className="modal-confirm" disabled={!plan || plan.total === 0} onClick={doRun}>
          ② 执行（备份+归正+留痕）
        </button>
      </div>
      {plan && (
        <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '12px', marginBottom: '8px' }}>
          {plan.total === 0 ? <div>无需归正（0 条命中，幂等）</div> : plan.items.map((it, i) => <div key={i}>{it.summary}</div>)}
        </div>
      )}
      {report && <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>{report}</div>}
    </div>
  )
}
