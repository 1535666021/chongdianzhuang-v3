import { useSettingsStore } from '@/stores/settingsStore'

/** P0-146：触感反馈——复制/删除/预约成功轻震；设置开关关闭或设备不支持时静默 */
export function hapticVibrate(pattern: number | number[] = 15) {
  try {
    if (!useSettingsStore.getState().hapticsEnabled) return
    navigator.vibrate?.(pattern)
  } catch {
    /* 设备不支持/权限拒绝：静默 */
  }
}
