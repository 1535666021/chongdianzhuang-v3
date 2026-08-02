import { useEffect, useState } from 'react'
import { backupLocalData } from '@/shared/storage/dataMigration'

declare const __APP_VERSION__: string

const CHECK_DATE_KEY = 'cdz_version_check_date'
const VERSION_URL = `${import.meta.env.BASE_URL}version.json`

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    const checkVersion = async () => {
      const today = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(CHECK_DATE_KEY) === today) return
      try {
        const response = await fetch(VERSION_URL, { cache: 'no-store' })
        if (!response.ok) return
        const { version } = await response.json() as { version?: string }
        localStorage.setItem(CHECK_DATE_KEY, today)
        if (version && version !== __APP_VERSION__) setHasUpdate(true)
        navigator.serviceWorker?.getRegistration().then((registration) => registration?.update())
      } catch {
        // 离线时保留当前缓存，并在下次可联网时再次检测。
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void checkVersion() }
    void checkVersion()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const handleUpdate = async () => {
    backupLocalData()
    const reload = () => window.location.reload()
    if (!('serviceWorker' in navigator)) return reload()
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update()
    const worker = registration?.waiting || registration?.installing
    worker?.postMessage({ type: 'SKIP_WAITING' })
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
    window.setTimeout(reload, 1000)
  }

  return { hasUpdate, handleUpdate }
}
