import { useState, useRef } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { parseV7Backup } from '@/features/order/repository/legacyImporter'
import { Upload, Download, FileJson, AlertCircle, CheckCircle } from 'lucide-react'

export default function BackupImport() {
  const [preview, setPreview] = useState<{
    total: number
    summary: Record<string, number>
    failed: { reason: string; index: number }[]
    orders: ReturnType<typeof parseV7Backup>['success']
  } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    added: number
    skipped: number
    updated: number
    total: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const existingCount = useOrderStore((s) => s.orders.length)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '')

      // 调试：解析原始JSON，显示桶结构和前几条订单的status
      let debug = ''
      try {
        const rawObj = JSON.parse(text)
        const keys = Object.keys(rawObj)
        debug += `顶层字段: ${keys.join(', ')}\n`

        // 检查每个桶
        const bucketChecks = ['orders', 'completedOrders', 'trashOrders', 'trash', 'deletedOrders']
        for (const key of bucketChecks) {
          const arr = rawObj[key]
          if (Array.isArray(arr)) {
            debug += `\n【${key}】共 ${arr.length} 条\n`
            // 显示前3条的status和appointment信息
            for (let i = 0; i < Math.min(3, arr.length); i++) {
              const item = arr[i]
              const status = item?.status || '无status'
              const name = item?.name || item?.customerName || '无名'
              const apptDate = item?.appointmentDate || (item?.appointment?.appointmentDate) || '无'
              const apptTime = item?.appointmentTime || (item?.appointment?.timeSlot) || (item?.appointment?.time) || '无'
              debug += `  [${i}] status=${status} name=${name} appointmentDate=${apptDate} time=${apptTime}\n`
            }
            if (arr.length > 3) debug += `  ... 共 ${arr.length} 条\n`
          }
        }

        // ===== R8：字段结构探测（只显示字段名，不显示任何值，隐私合规） =====
        const allBuckets = [...bucketChecks, 'appointmentOrders', 'appointedOrders', 'scheduledOrders']
        let probed = 0
        for (const key of allBuckets) {
          const arr = rawObj[key]
          if (Array.isArray(arr) && arr.length > 0 && probed < 2) {
            const first = arr[0]
            if (first && typeof first === 'object') {
              debug += `\n【字段结构·${key}[0]】${Object.keys(first).join(', ')}\n`
              const moneyObj = first.profitData || first.finance || first.settlement || first.costData
              if (moneyObj && typeof moneyObj === 'object') {
                debug += `  └ 金额子对象字段: ${Object.keys(moneyObj).join(', ')}\n`
              } else {
                debug += `  └ 无profitData/finance/settlement金额子对象\n`
              }
              probed++
            }
          }
        }
      } catch (err) {
        debug = `JSON解析失败: ${err}`
      }
      setDebugInfo(debug)

      const parsed = parseV7Backup(text)
      setPreview({
        total: parsed.success.length,
        summary: parsed.summary,
        failed: parsed.failed,
        orders: parsed.success,
      })
      setResult(null)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!preview || preview.total === 0) return
    setImporting(true)

    const { importOrders } = useOrderStore.getState()
    const { added, skipped, updated } = importOrders(preview.orders)

    setResult({ added, skipped, updated, total: preview.total })
    setImporting(false)
    setPreview(null)
    setDebugInfo('')
  }

  /** 数据导出：v3统一标准格式（字段名固定，杜绝老字段混乱） */
  const handleExport = () => {
    const orders = useOrderStore.getState().orders
    const summary: Record<string, number> = {}
    for (const s of ['待办', '已预约', '已完成', '回收站']) {
      summary[s] = orders.filter((o) => o.status === s).length
    }
    const payload = {
      format: 'cdz-v3-backup',
      formatVersion: 1,
      exportDate: new Date().toISOString(),
      count: orders.length,
      summary,
      orders,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cdz_v3_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCancel = () => {
    setPreview(null)
    setResult(null)
    setDebugInfo('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">数据导入</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* 文件选择 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">从老系统导入备份</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm flex items-center justify-center gap-2 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Upload size={18} />
            选择备份文件（.json / .txt）
          </button>
          <p className="text-xs text-gray-400 mt-2">
            支持老系统导出的 v7 格式备份文件，也支持v3标准格式备份
          </p>
        </div>

        {/* 调试信息 */}
        {debugInfo && (
          <div className="bg-gray-100 rounded-lg border border-gray-300 p-3">
            <h3 className="text-xs font-medium text-gray-500 mb-1">调试信息（供开发排查）</h3>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all font-mono">
              {debugInfo}
            </pre>
          </div>
        )}

        {/* 预览 */}
        {preview && (
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileJson size={18} className="text-blue-600" />
              <h3 className="font-medium text-sm">识别结果</h3>
            </div>

            <div className="text-sm text-gray-700 mb-3">
              识别到 <span className="font-semibold text-blue-600">{preview.total}</span> 条订单
              {existingCount > 0 && (
                <span className="text-orange-500 ml-1">
                  （当前已有 {existingCount} 条，重复将自动跳过；金额缺失的老单将自动补全）
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {Object.entries(preview.summary).map(([status, count]) => (
                <div key={status} className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-lg font-semibold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-500">{status}</div>
                </div>
              ))}
            </div>

            {preview.failed.length > 0 && (
              <div className="mb-3 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle size={14} />
                  <span>解析失败 {preview.failed.length} 条</span>
                </div>
                {preview.failed.slice(0, 3).map((f, i) => (
                  <div key={i} className="truncate">· {f.reason}</div>
                ))}
                {preview.failed.length > 3 && (
                  <div>... 共 {preview.failed.length} 条</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={importing || preview.total === 0}
                className="flex-1 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        )}

        {/* 导入结果 */}
        {result && (
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} className="text-green-600" />
              <h3 className="font-medium text-sm">导入完成</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">成功导入</span>
                <span className="font-semibold text-green-600">{result.added} 条</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">金额补全更新</span>
                <span className="font-semibold text-blue-600">{result.updated} 条</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">重复跳过</span>
                <span className="font-semibold text-orange-500">{result.skipped} 条</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">总计识别</span>
                <span className="font-semibold">{result.total} 条</span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="mt-3 w-full py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              完成
            </button>
          </div>
        )}

        {/* 数据导出：统一v3标准格式 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">数据导出（统一格式备份）</h2>
          <button
            onClick={handleExport}
            disabled={existingCount === 0}
            className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 text-sm flex items-center justify-center gap-2 hover:border-green-500 transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            导出全部订单（{existingCount} 条 · v3标准格式）
          </button>
          <p className="text-xs text-gray-400 mt-2">
            导出为v3统一字段格式，可用于备份/迁移，重新导入时自动识别
          </p>
        </div>

        {/* 版本号 */}
        <div className="text-center text-xs text-gray-400 py-4">
          版本: {import.meta.env.VITE_APP_VERSION || 'dev'}
        </div>
      </main>
    </div>
  )
}
