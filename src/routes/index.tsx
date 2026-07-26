import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { RoutePath } from './route'
import App from '@/App'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import OrderList from '@/features/order/pages/OrderList'
import OrderDetail from '@/features/order/pages/OrderDetail'
import OrderForm from '@/features/order/pages/OrderForm'
import BatchParser from '@/features/batchParser/pages/BatchParser'

const MaterialList = lazy(() => import('@/features/material/pages/MaterialList'))
const Statistics = lazy(() => import('@/features/statistics/pages/Statistics'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))
const FinancePage = lazy(() => import('@/features/finance/pages/FinancePage'))
const OrderComplete = lazy(() => import('@/features/order/pages/OrderComplete'))
const OrderSurvey = lazy(() => import('@/features/order/pages/OrderSurvey'))
const BackupImport = lazy(() => import('@/features/settings/components/BackupImport'))
const InventoryPage = lazy(() => import('@/features/material/pages/InventoryPage'))

function LoadingFallback() {
  return <div className="p-4 text-center text-gray-400">加载中...</div>
}

export default function AppRoutes() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<OrderList key="todo" fixedStatus="待办" allowTrash />} />
            <Route path={RoutePath.SCHEDULED} element={<OrderList key="scheduled" fixedStatus="已预约" />} />
            <Route path={RoutePath.COMPLETED} element={<OrderList key="completed" fixedStatus="已完成" />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="order/new" element={<OrderForm />} />
            <Route path="order/edit/:id" element={<OrderForm />} />
            <Route
              path="order/complete/:id"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <OrderComplete />
                </Suspense>
              }
            />
            <Route
              path="order/survey/:id"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <OrderSurvey />
                </Suspense>
              }
            />
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
              path="/inventory"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <InventoryPage />
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
      </ErrorBoundary>
    </HashRouter>
  )
}
