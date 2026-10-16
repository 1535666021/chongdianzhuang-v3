import { useEffect, useRef, useState } from 'react'
import type { GeoLocation } from '../types/map'
import { AMAP_JSAPI_URL } from '@/constants/map'

interface OrderMapProps {
  location: GeoLocation
  amapKey: string
  zoom?: number
}

/**
 * 订单地图组件
 * - 动态加载高德JS API
 * - 显示地图+标记
 * - 支持缩放/拖拽
 * - 加载中/错误状态
 */
export default function OrderMap({ location, amapKey, zoom = 15 }: OrderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (!amapKey || amapKey === 'YOUR_AMAP_KEY') {
      setError('请先配置高德地图Key')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // 检查高德API是否已加载
    const win = window as any
    if (win.AMap && win.AMap.Map) {
      initMap()
      return
    }

    // 动态加载高德JS API
    const script = document.createElement('script')
    script.src = AMAP_JSAPI_URL(amapKey)
    script.onload = () => {
      // 等待AMap初始化完成
      const check = setInterval(() => {
        if (win.AMap && win.AMap.Map) {
          clearInterval(check)
          initMap()
        }
      }, 100)
      // 10秒超时
      setTimeout(() => clearInterval(check), 10000)
    }
    script.onerror = () => {
      setError('高德地图API加载失败')
      setLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [amapKey])

  // 位置变化时更新标记
  useEffect(() => {
    if (mapRef.current && location) {
      const win = window as any
      const pos = new win.AMap.LngLat(location.lng, location.lat)
      mapRef.current.setCenter(pos)
      mapRef.current.setZoom(zoom)

      // 清除旧标记，添加新标记
      mapRef.current.clearMap()
      const marker = new win.AMap.Marker({
        position: pos,
        title: location.address,
      })
      mapRef.current.add(marker)
    }
  }, [location, zoom])

  function initMap() {
    if (!containerRef.current) return
    const win = window as any
    try {
      const map = new win.AMap.Map(containerRef.current, {
        zoom,
        center: [location.lng, location.lat],
      })
      const marker = new win.AMap.Marker({
        position: [location.lng, location.lat],
        title: location.address,
      })
      map.add(marker)
      mapRef.current = map
      setLoading(false)
    } catch (err) {
      setError('地图初始化失败')
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-500">
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 240 }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">地图加载中...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
