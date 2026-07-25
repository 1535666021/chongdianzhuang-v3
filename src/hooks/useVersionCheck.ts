import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cdz_v3_version'

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    // 读取当前构建版本号（Actions注入的git commit hash）
    const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev'

    // 读取上次保存的版本号
    const lastVersion = localStorage.getItem(STORAGE_KEY)

    // 首次访问：保存版本号，不提示
    if (!lastVersion) {
      localStorage.setItem(STORAGE_KEY, currentVersion)
      return
    }

    // 版本不一致：提示更新
    if (lastVersion !== currentVersion) {
      setHasUpdate(true)
    }
  }, [])

  const handleUpdate = () => {
    // 保存新版本号
    const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev'
    localStorage.setItem(STORAGE_KEY, currentVersion)

    // 强制刷新页面（跳过缓存）
    window.location.reload()
  }

  return { hasUpdate, handleUpdate }
}
