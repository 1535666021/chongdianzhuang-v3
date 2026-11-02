import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { orderRepairRepository } from './features/order/repair/repository'
import { purgeExpiredRecycleBin } from './features/order/utils/recycleBin'
import { useOrderStore } from '@/stores/orderStore'
import { ROUTES } from '@/routes/route'
import { useVersionCheck } from '@/shared/hooks/useVersionCheck'
import { useOfflineStatus } from '@/shared/hooks/useOfflineStatus'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'
import { useToast, ToastContainer, toast } from '@/shared/hooks/useToast'
import { backfillCompanyByDoneDate, healMissingAppointments, purgeLegacyAppointmentDates } from '@/features/appointment/repository'
import { addKnownPlatform, getKnownPlatforms } from '@/shared/storage/platformStorage'
import { migrateData, migratePowerKw } from '@/shared/storage/dataMigration'
import { runBrandBackfillOnce } from '@/shared/dataFix/backfillBrand'
import { runAppointmentRangeMigration } from '@/shared/dataFix/migrateAppointmentRange'
import { runBreakerRowSelfCheck } from '@/shared/dataFix/breakerRowSelfCheckFix'
import OnboardingGuide from '@/shared/components/OnboardingGuide'
import BottomTabBar from '@/shared/components/BottomTabBar'

// 导出全局 toast
export { toast }

// P0-217 G1c：启动修复链统一入口——逐 phase try/catch + console.time 计时，末段输出总耗时
async function runStartupMaintenance() {
  const t0 = performance.now()
  const phases: [string, () => void][] = [
    ['migrateData', () => { migrateData() }],
    ['migratePowerKw', () => { const m = migratePowerKw(); if (m) useOrderStore.getState().setOrders(m) }],
    ['purgeLegacyAppointmentDates', () => { purgeLegacyAppointmentDates() }], // P0-229-R1 存量清洗：旧解析器遗留非空 appointmentDate 一律清空（须在 P0-160 自愈之前，先清日期再降级）
    ['backfillCompanyByDoneDate', () => { backfillCompanyByDoneDate() }], // P0-230-R2 重做：京东平台存量单按完工日三段回填（10/1-11/2→到每家、<10/1→本杨、≥11/3 不动），挂于清洗之后
    ['healMissingAppointments', () => healMissingAppointments()], // P0-160 存量自愈（原 main.tsx 顶层，并入统一入口）
    ['runBrandBackfillOnce', () => runBrandBackfillOnce()], // P0-102
    ['runAppointmentRangeMigration', () => runAppointmentRangeMigration()], // P0-142-R3
    ['repairGroupNoticeNames', () => { orderRepairRepository.repairGroupNoticeNames() }], // P0-123
    ['repairMistakenBrands', () => { orderRepairRepository.repairMistakenBrands() }], // P0-136
    ['repairWailianContacts', () => { orderRepairRepository.repairWailianContacts() }], // P0-138
    ['purgeExpiredRecycleBin', () => purgeExpiredRecycleBin()], // P0-139-R1
    ['repairWanlianFlowOrders', () => { orderRepairRepository.repairWanlianFlowOrders() }], // P0-140-R3
    ['runBreakerRowSelfCheck', () => { runBreakerRowSelfCheck() }], // P0-210 G3
  ]
  for (const [name, fn] of phases) {
    console.time(`[启动修复] ${name}`)
    try { fn() } catch (error) { console.warn(`[启动修复] ${name} 失败（已跳过，不影响其他段）`, error) }
    console.timeEnd(`[启动修复] ${name}`)
    await new Promise((r) => setTimeout(r, 0)) // G1e：phase 间让出主线程
  }
  console.log(`[启动修复] 全部完成，总耗时 ${(performance.now() - t0).toFixed(1)}ms`)
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasUpdate, updateInfo, handleUpdate, checkNow } = useVersionCheck()
  // P0-217 G5：更新弹窗「稍后」当日不再弹（记 dismissedVersion+日期）
  const [updateDismissed, setUpdateDismissed] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem('cdz_update_dismissed') || 'null')
      return d?.date === new Date().toISOString().slice(0, 10)
    } catch { return false }
  })
  const dismissUpdate = () => {
    localStorage.setItem('cdz_update_dismissed', JSON.stringify({ date: new Date().toISOString().slice(0, 10) }))
    setUpdateDismissed(true)
  }
  const isOffline = useOfflineStatus()
  const orders = useOrderStore((s) => s.orders)
  const { toast: appToast, toasts, removeToast } = useToast()

  useEffect(() => {
    // P0-217 G1b：修复链整体延后到首屏渲染完成后调度（requestIdleCallback 缺省 setTimeout 兜底，禁裸用）
    const schedule = window.requestIdleCallback?.bind(window) ?? ((cb: () => void) => setTimeout(cb, 0))
    schedule(() => setTimeout(() => { void runStartupMaintenance() }, 0))
  }, [])

  useEffect(() => {
    // P0-223：SW 后台发现新版 HTML 推 NEW_VERSION → 触发既有版本检查（弹窗走 useVersionCheck 原机制）
    const onSwMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | undefined)?.type === 'NEW_VERSION') checkNow()
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage)
  }, [checkNow])

  useEffect(() => {
    const known = getKnownPlatforms()
    orders
      .filter((order) => order.status === '已完成')
      .map((order) => {
        const platformName = order.platformName?.trim()
        return platformName && platformName !== '其他' ? platformName : (order.platform !== '其他' ? order.platform : order.brandName)
      })
      .filter((platform): platform is string => typeof platform === 'string' && platform.length > 0 && !known.includes(platform))
      .forEach(addKnownPlatform)
  }, [orders])

  // 底部气泡：首页=待办数，已预约=已预约数（老系统同款红点提示）
  const badgeMap: Record<string, number> = {
    '待办': orders.filter((o) => o.status === '待办').length,
    '已预约': orders.filter((o) => o.status === '已预约').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-network={isOffline ? 'offline' : 'online'}>
      {/* 离线状态提示 */}
      <OfflineIndicator />

      {/* P0-217 G5：更新弹窗（居中，notes 逐条列出；仅展示+两按钮，不拦截录入流程） */}
      {hasUpdate && updateInfo && !updateDismissed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={dismissUpdate}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', maxWidth: 320, width: '86%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 var(--space-sm)' }}>发现新版本</h3>
            <ul style={{ margin: '0 0 var(--space-md)', paddingLeft: '1.2em', fontSize: 14, color: '#555' }}>
              {updateInfo.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button type="button" onClick={dismissUpdate} style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 'var(--radius-sm)', background: '#fff' }}>稍后</button>
              <button type="button" onClick={handleUpdate} style={{ padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: '#fff' }}>立即更新</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* P0-146：新版本首次启动功能引导（按版本号一次） */}
      <OnboardingGuide />

      <main className="app-main flex-1 overflow-auto">
        <Outlet context={{ checkNow, toast: appToast }} />
      </main>
      {/* P0-173：底部 Tab 栏（抽屉退役；徽章同源=badgeMap；安全区见 .app-tabbar） */}
      <BottomTabBar badgeMap={badgeMap} />
    </div>
  )
}
