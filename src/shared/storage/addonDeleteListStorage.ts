const DELETED_KEY = 'cdz_addon_deleted_ids_v1'

/** P0-129：增项底表"删除名单"——被删材料id列表（底表常量零改动，resolver读取时过滤） */
export function getDeletedAddonIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addDeletedAddonId(id: string): void {
  const list = getDeletedAddonIds()
  if (!list.includes(id)) {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...list, id]))
  }
}

/** 恢复（预留：误删回滚用） */
export function removeDeletedAddonId(id: string): void {
  localStorage.setItem(DELETED_KEY, JSON.stringify(getDeletedAddonIds().filter((x) => x !== id)))
}
