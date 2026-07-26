/**
 * 高德地图配置常量
 * 注意：真实Key由甲方在设置页输入，保存到 settingsStore
 * 仓库中只用占位符，禁止提交真实Key
 */

export const AMAP_KEY_PLACEHOLDER = 'YOUR_AMAP_KEY'

export const AMAP_DEFAULT_ZOOM = 15

export const AMAP_DEFAULT_CENTER = {
  lat: 31.6,
  lng: 117.9,
}

/** 高德JS API加载地址 */
export const AMAP_JSAPI_URL = (key: string) =>
  `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Geocoder`

/** 高德导航URI（调起APP或网页） */
export const AMAP_NAV_URL = (lat: number, lng: number, address: string) =>
  `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(address)}&mode=car&callnative=1`
