const DATA_VERSION_KEY = 'cdz_data_version'
const UPDATE_BACKUP_KEY = 'cdz_update_backup'
const CURRENT_DATA_VERSION = 'v1'
const ORDERS_KEY = 'cdz_v3_orders_list'
const POWER_MIGRATION_KEY = 'cdz_powerkw_migrated_v1'
const POWER_RE = /(\d+(?:\.\d+)?)\s*(?:kw|千瓦)/i

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

export function migratePowerKw(): void {
  if (localStorage.getItem(POWER_MIGRATION_KEY)) return
  const ordersRaw = localStorage.getItem(ORDERS_KEY)
  if (!ordersRaw) {
    localStorage.setItem(POWER_MIGRATION_KEY, 'true')
    return
  }

  try {
    const orders = JSON.parse(ordersRaw)
    if (!Array.isArray(orders)) return
    let changed = false
    for (const order of orders) {
      const current = order.powerKw?.toString()
      const needsFix = !current || current === 'kW' || current.includes('kWkW')
      if (!needsFix) continue
      const sourceText = [order.serviceType, order.remark, order.brand, order.brandName].filter(Boolean).join(' ')
      const match = sourceText.match(POWER_RE)
      if (match) {
        order.powerKw = match[1]
        changed = true
      }
    }
    if (changed) localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    localStorage.setItem(POWER_MIGRATION_KEY, 'true')
  } catch (error) {
    console.error('migratePowerKw failed:', error)
  }
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
