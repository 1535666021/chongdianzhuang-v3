import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { orderRepairRepository } from './features/order/repair/repository'
import { purgeExpiredRecycleBin } from './features/order/utils/recycleBin'
import { useOrderStore } from '@/stores/orderStore'
import { ROUTES } from '@/routes/route'
import { RefreshCw } from 'lucide-react'
import { useVersionCheck } from '@/shared/hooks/useVersionCheck'
import { useOfflineStatus } from '@/shared/hooks/useOfflineStatus'
import { OfflineIndicator } from '@/shared/components/OfflineIndicator'
import { useToast, ToastContainer, toast } from '@/shared/hooks/useToast'
import { addKnownPlatform, getKnownPlatforms } from '@/shared/storage/platformStorage'
import { migrateData, migratePowerKw } from '@/shared/storage/dataMigration'
import { runBrandBackfillOnce } from '@/shared/dataFix/backfillBrand'
import { runAppointmentRangeMigration } from '@/shared/dataFix/migrateAppointmentRange'
import { runBreakerRowSelfCheck } from '@/shared/dataFix/breakerRowSelfCheckFix'
import OnboardingGuide from '@/shared/components/OnboardingGuide'
import BottomTabBar from '@/shared/components/BottomTabBar'

// 导出全局 toast
export { toast }

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasUpdate, handleUpdate, checkNow } = useVersionCheck()
  const isOffline = useOfflineStatus()
  const orders = useOrderStore((s) => s.orders)
  const setOrders = useOrderStore((s) => s.setOrders)
  const { toast: appToast, toasts, removeToast } = useToast()

  useEffect(() => {
    migrateData()
    const migratedOrders = migratePowerKw()
    if (migratedOrders) setOrders(migratedOrders)
    runBrandBackfillOnce() // P0-102：品牌识别一次性回溯（标记幂等）
    runAppointmentRangeMigration() // P0-142-R3：预约区间化一次性迁移（标记幂等）
    orderRepairRepository.repairGroupNoticeNames() // P0-123：群公告错单姓名自修复（标记幂等，仅群公告来源）
    orderRepairRepository.repairMistakenBrands() // P0-136：桩名称品牌错单自愈（标记幂等，brand串位/空/未知）
    orderRepairRepository.repairWailianContacts() // P0-138：外联单车主姓名优先+双联系人补录（标记幂等）
    purgeExpiredRecycleBin() // P0-139-R1：回收站到期自动彻底删除（30天，报告console）
    orderRepairRepository.repairWanlianFlowOrders() // P0-140-R3：万联流式错单自动更正（_flowRepaired幂等）
    runBreakerRowSelfCheck() // P0-210 G3：已完成单漏保器行存量纠偏（纯比对幂等零写入；写前备份；只纠漏保器行）
  }, [setOrders])

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

      {/* 版本更新提示 */}
      {hasUpdate && (
        <button
          type="button"
          onClick={handleUpdate}
          style={{ background: 'var(--color-success)', borderRadius: 'var(--radius-md)', bottom: 'calc(64px + env(safe-area-inset-bottom))', color: 'white', left: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', position: 'fixed', right: 'var(--space-md)', zIndex: 'var(--z-modal)' }}
        >
          <RefreshCw size={14} />
          <span>发现新版本，点击更新</span>
        </button>
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
