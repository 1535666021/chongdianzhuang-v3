import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RoutePath } from './route'
import App from '@/App'
import OrderList from '@/features/order/pages/OrderList'
import OrderDetail from '@/features/order/pages/OrderDetail'
import OrderForm from '@/features/order/pages/OrderForm'
import BatchParser from '@/features/batchParser/pages/BatchParser'

const MaterialList = lazy(() => import('@/features/material/pages/MaterialList'))
const Statistics = lazy(() => import('@/features/statistics/pages/Statistics'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const FinancePage = lazy(() => import('@/features/finance/pages/FinancePage'))
const BackupImport = lazy(() => import('@/features/settings/components/BackupImport'))

function LoadingFallback() {
  return <div className="p-4 text-center text-gray-400">加载中...</div>
}

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<OrderList />} />
          <Route path={RoutePath.SCHEDULED} element={<OrderList fixedStatus="已预约" />} />
          <Route path={RoutePath.COMPLETED} element={<OrderList fixedStatus="已完成" />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="order/new" element={<OrderForm />} />
          <Route path="order/edit/:id" element={<OrderForm />} />
          <Route path="batch-parser" element={<BatchParser />} />
          <Route
            path={RoutePath.MATERIALS}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <MaterialList />
              </Suspense>
            }
          />
          <Route
            path={RoutePath.STATS}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Statistics />
              </Suspense>
            }
          />
          <Route
            path="/finance"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FinancePage />
              </Suspense>
            }
          />
          <Route
            path={RoutePath.SETTINGS}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="settings/backup"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <BackupImport />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
