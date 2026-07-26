import { useState } from 'react'
import { Navigation, Copy, Check } from 'lucide-react'
import { AMAP_NAV_URL } from '@/constants/map'

interface NavigateButtonProps {
  lat: number
  lng: number
  address: string
}

/**
 * 导航按钮组件
 * - 点击调起高德地图APP/网页导航
 * - fallback：复制地址到剪贴板
 */
export default function NavigateButton({ lat, lng, address }: NavigateButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleNavigate = () => {
    const url = AMAP_NAV_URL(lat, lng, address)
    // 尝试调起APP
    window.location.href = url

    // 3秒后如果还在当前页，说明APP未安装，提示复制地址
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        handleCopy()
      }
    }, 3000)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: 创建临时textarea复制
      const ta = document.createElement('textarea')
      ta.value = address
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleNavigate}
        className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm active:bg-green-600"
      >
        <Navigation size={14} />
        导航
      </button>
      <button
        onClick={handleCopy}
        className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
          copied
            ? 'bg-green-50 border-green-200 text-green-600'
            : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? '已复制' : '复制地址'}
      </button>
    </div>
  )
}
