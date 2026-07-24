import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RoutePath } from './route'
import App from '@/App'
import OrderList from '@/features/order/pages/OrderList'
import OrderDetail from '@/features/order/pages/OrderDetail'
import OrderForm from '@/features/order/pages/OrderForm'
import BatchParser from '@/features/batchParser/pages/BatchParser'

// 懒加载页面（后续实现）
const MaterialsPage = () => <div>材料占位</div>
const StatsPage = () => <div>统计占位</div>
const SettingsPage = () => <div>设置占位</div>

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/chongdianzhuang-v3/">
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="order/new" element={<OrderForm />} />
          <Route path="order/edit/:id" element={<OrderForm />} />
          <Route path="batch-parser" element={<BatchParser />} />
          <Route path={RoutePath.MATERIALS} element={<MaterialsPage />} />
          <Route path={RoutePath.STATS} element={<StatsPage />} />
          <Route path={RoutePath.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
