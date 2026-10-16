import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/shared/storage/dataMigration'
import { healMissingAppointments } from '@/features/appointment/repository'
import AppRoutes from '@/routes'
import './index.css'

// P0-099：启动日志输出版本号 + 构建时间
console.log(`[充电桩订单助手] 版本 ${__APP_VERSION__} · 构建时间 ${__APP_BUILD_TIME__}`)

// P0-160：存量自愈——扫描「已预约无日期」脏单，走预约模块规范化降级待办（幂等，无脏单零写入）
healMissingAppointments()

// 注册 Service Worker（PWA离线支持）
// 注意：必须用相对路径 './sw.js'，GitHub Pages子目录部署下根路径'/sw.js'会404
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
