import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cdz_v3_version'

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev'
    const lastVersion = localStorage.getItem(STORAGE_KEY)
    if (!lastVersion) {
      localStorage.setItem(STORAGE_KEY, currentVersion)
      return
    }
    if (lastVersion !== currentVersion) {
      setHasUpdate(true)
    }
  }, [])

  const handleUpdate = () => {
    const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev'
    localStorage.setItem(STORAGE_KEY, currentVersion)
    window.location.reload()
  }

  return { hasUpdate, handleUpdate }
}
