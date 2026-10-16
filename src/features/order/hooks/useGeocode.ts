import { useState, useCallback, useRef } from 'react'
import type { GeoLocation } from '../types/map'

const GEOCACHE_KEY = 'cdz_geocode_cache'

interface GeocodeCache {
  [address: string]: GeoLocation
}

function readCache(): GeocodeCache {
  try {
    const raw = localStorage.getItem(GEOCACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCache(cache: GeocodeCache) {
  try {
    localStorage.setItem(GEOCACHE_KEY, JSON.stringify(cache))
  } catch {
    // 忽略存储失败
  }
}

/**
 * 地址解析Hook
 * - 优先读取本地缓存（localStorage）
 * - 缓存未命中时调用高德地理编码API
 * - 支持手动解析和批量预热
 */
export function useGeocode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<GeocodeCache>(readCache())

  const geocode = useCallback(async (
    address: string,
    amapKey: string
  ): Promise<GeoLocation | null> => {
    if (!address.trim()) {
      setError('地址为空')
      return null
    }

    // 1. 查缓存
    const cached = cacheRef.current[address.trim()]
    if (cached) {
      setError(null)
      return cached
    }

    // 2. 检查Key
    if (!amapKey || amapKey === 'YOUR_AMAP_KEY') {
      setError('请先配置高德地图Key')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${amapKey}&output=JSON`
      const res = await fetch(url)
      const data = await res.json()

      if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
        setError(data.info || '地址解析失败')
        return null
      }

      const geo = data.geocodes[0]
      const [lng, lat] = geo.location.split(',').map(Number)

      const result: GeoLocation = {
        lat,
        lng,
        address: address.trim(),
        formattedAddress: geo.formatted_address,
      }

      // 写入缓存
      cacheRef.current[address.trim()] = result
      writeCache(cacheRef.current)

      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 批量预热缓存（从订单列表批量解析） */
  const warmCache = useCallback(async (addresses: string[], amapKey: string) => {
    const promises = addresses.map(addr => geocode(addr, amapKey))
    await Promise.all(promises)
  }, [geocode])

  return { geocode, warmCache, loading, error }
}
