const DATA_VERSION_KEY = 'cdz_data_version'
const UPDATE_BACKUP_KEY = 'cdz_update_backup'
const CURRENT_DATA_VERSION = 'v1'
const ORDERS_KEY = 'cdz_v3_orders_list'

type LocalData = Record<string, string>

export function backupLocalData(): void {
  const backup: LocalData = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('cdz_')) {
      const value = localStorage.getItem(key)
      if (value !== null) backup[key] = value
    }
  }
  sessionStorage.setItem(UPDATE_BACKUP_KEY, JSON.stringify(backup))
}

export function migrateData(): void {
  restoreUpdateBackup()
  const storedVersion = localStorage.getItem(DATA_VERSION_KEY) || 'v0'
  if (storedVersion === CURRENT_DATA_VERSION) return
  if (storedVersion === 'v0') migrateV0ToV1()
  localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION)
}

function restoreUpdateBackup(): void {
  try {
    const backup = JSON.parse(sessionStorage.getItem(UPDATE_BACKUP_KEY) || '{}') as LocalData
    Object.entries(backup).forEach(([key, value]) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    })
  } catch {
    // 备份不可读时保留当前本地数据。
  }
}

function migrateV0ToV1(): void {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]')
    if (!Array.isArray(orders)) return
    const migrated = orders.map((order) => ({
      ...order,
      materials: Array.isArray(order.materials) ? order.materials : [],
      updatedAt: order.updatedAt ?? order.createdAt ?? Date.now(),
    }))
    localStorage.setItem(ORDERS_KEY, JSON.stringify(migrated))
  } catch {
    // 格式未知的历史数据保持原样，避免迁移过程覆盖用户数据。
  }
}

migrateData()
