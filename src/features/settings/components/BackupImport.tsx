import { useState, useRef } from 'react'
import { useOrderStore } from '@/stores/orderStore'
import { parseV7Backup } from '@/features/order/repository/legacyImporter'
import { Upload, FileJson, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function BackupImport() {
  const [preview, setPreview] = useState<{
    total: number
    summary: Record<string, number>
    failed: { reason: string; index: number }[]
    orders: ReturnType<typeof parseV7Backup>['success']
  } | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    added: number
    skipped: number
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
    const { added, skipped } = importOrders(preview.orders)

    setResult({ added, skipped, total: preview.total })
    setImporting(false)
    setPreview(null)
  }

  const handleCancel = () => {
    setPreview(null)
    setResult(null)
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
            支持老系统导出的 v7 格式备份文件
          </p>
        </div>

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
                  （当前已有 {existingCount} 条，重复将自动跳过）
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
      </main>
    </div>
  )
}
