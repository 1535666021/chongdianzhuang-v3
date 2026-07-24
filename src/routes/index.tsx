import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RoutePath } from './route'
import App from '@/App'

// 懒加载页面（阶段2实现）
const HomePage = () => <div>首页占位</div>
const OrdersPage = () => <div>订单占位</div>
const MaterialsPage = () => <div>材料占位</div>
const StatsPage = () => <div>统计占位</div>
const SettingsPage = () => <div>设置占位</div>

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/chongdianzhuang-v3/">
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path={RoutePath.ORDERS} element={<OrdersPage />} />
          <Route path={RoutePath.MATERIALS} element={<MaterialsPage />} />
          <Route path={RoutePath.STATS} element={<StatsPage />} />
          <Route path={RoutePath.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
