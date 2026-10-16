import { useState } from 'react'
import { RotateCcw, AlertTriangle, Lock, Check } from 'lucide-react'

const FACTORY_PASSWORD = '147568'
const STORAGE_PREFIX = 'cdz_v3_'

export default function RestoreFactory() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input')

  const handleVerify = () => {
    if (password === FACTORY_PASSWORD) {
      setError('')
      setStep('confirm')
    } else {
      setError('密码错误')
      setPassword('')
    }
  }

  const handleReset = () => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keys.push(k)
      }
    }
    keys.forEach((k) => localStorage.removeItem(k))
    setStep('done')
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  if (step === 'done') {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Check size={20} className="text-green-600" />
        </div>
        <p className="text-sm text-gray-700 font-medium">数据已清空</p>
        <p className="text-xs text-gray-400 mt-1">页面即将刷新...</p>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">确定要清空所有数据吗？</p>
            <p className="text-xs text-red-500 mt-1">此操作不可恢复，将删除所有订单、材料、设置等本地数据！</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('input')}
            className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            确认清空
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-500">请输入恢复出厂密码（默认：147568）</p>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="输入密码"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleVerify}
        className="w-full py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1.5"
      >
        <RotateCcw size={14} />
        验证并继续
      </button>
    </div>
  )
}
