/**
 * PWA离线存储（IndexedDB封装）
 * - 与现有 localStorage 并存，不冲突
 * - 用于缓存订单/材料/设置数据，支持离线查看
 */

const DB_NAME = 'cdz_v3_db'
const DB_VERSION = 1

const STORE_ORDERS = 'orders'
const STORE_MATERIALS = 'materials'
const STORE_SETTINGS = 'settings'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        db.createObjectStore(STORE_ORDERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_MATERIALS)) {
        db.createObjectStore(STORE_MATERIALS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
    }
  })
}

// ─── 订单 ───
export async function saveOrdersToDB(orders: any[]) {
  const db = await openDB()
  const tx = db.transaction(STORE_ORDERS, 'readwrite')
  const store = tx.objectStore(STORE_ORDERS)
  orders.forEach((o) => store.put(o))
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getOrdersFromDB(): Promise<any[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_ORDERS, 'readonly')
  const store = tx.objectStore(STORE_ORDERS)
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function clearOrdersDB() {
  const db = await openDB()
  const tx = db.transaction(STORE_ORDERS, 'readwrite')
  tx.objectStore(STORE_ORDERS).clear()
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── 材料 ───
export async function saveMaterialsToDB(materials: any[]) {
  const db = await openDB()
  const tx = db.transaction(STORE_MATERIALS, 'readwrite')
  const store = tx.objectStore(STORE_MATERIALS)
  materials.forEach((m) => store.put(m))
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMaterialsFromDB(): Promise<any[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_MATERIALS, 'readonly')
  const store = tx.objectStore(STORE_MATERIALS)
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── 设置 ───
export async function saveSettingsToDB(key: string, value: any) {
  const db = await openDB()
  const tx = db.transaction(STORE_SETTINGS, 'readwrite')
  const store = tx.objectStore(STORE_SETTINGS)
  store.put({ key, value })
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getSettingsFromDB(key: string): Promise<any> {
  const db = await openDB()
  const tx = db.transaction(STORE_SETTINGS, 'readonly')
  const store = tx.objectStore(STORE_SETTINGS)
  return new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result?.value)
    request.onerror = () => reject(request.error)
  })
}
