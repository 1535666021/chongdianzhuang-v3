export const APP_NAME = '充电桩订单助手'
/** 版本号：构建期注入（CI=短sha，本地=时间戳），见 vite.config.ts define */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
/** 构建时间：构建期注入 */
export const APP_BUILD_TIME = import.meta.env.VITE_APP_BUILD_TIME || ''
export const STORAGE_KEY_PREFIX = 'cdz_v3_'

export const DEFAULT_ENGINEER = {
  name: '谢责强',
  phone: '15395147568',
}
