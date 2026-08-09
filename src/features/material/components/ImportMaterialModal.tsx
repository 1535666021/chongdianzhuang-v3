import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { parseImportFile, type ImportError, type ImportResult } from '@/shared/utils/importMaterial'
import { useMaterialStore } from '@/stores/materialStore'
import type { MaterialUsageRecord } from '@/types'

interface Props {
  onClose: () => void
}

export function ImportMaterialModal({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importUsageFromLegacy = useMaterialStore((s) => s.importUsageFromLegacy)

  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setResult(parseImportFile(content, file.name))
      setLoading(false)
    }
    reader.onerror = () => {
      setResult({ records: [], errors: [{ row: 0, message: '文件读取失败' }] })
      setLoading(false)
    }
    reader.readAsText(file)
  }, [])

  const handleImport = useCallback((records: MaterialUsageRecord[]) => {
    importUsageFromLegacy(records)
    setImportedCount(records.length)
    setImported(true)
  }, [importUsageFromLegacy])

  const recordCount = result?.records.length ?? 0
  const errorCount = result?.errors.filter((e: ImportError) => e.row > 0).length ?? 0
  const formatErrorCount = result?.errors.filter((e: ImportError) => e.row === 0).length ?? 0
  const hasValidRecords = recordCount > 0

  if (imported) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">导入完成</h3>
          <p className="text-sm text-gray-500">成功导入 {importedCount} 条领用记录</p>
          <button onClick={onClose} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg text-sm">确定</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[10001] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800">导入材料领用</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded flex items-start gap-1.5">
            <FileText size={14} className="shrink-0 mt-0.5" />
            <span>支持 CSV 或 JSON 文件。CSV 表头示例：材料名称,数量,单位,单价,日期</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-6 text-center text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? '解析中...' : '点击选择文件（.csv / .json）'}
          </button>
        </div>

        {result && (
          <div className="border-t border-gray-100 flex-1 overflow-y-auto">
            {formatErrorCount > 0 && (
              <div className="p-3 bg-red-50 text-red-600 text-xs flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{result.errors[0].message}</span>
              </div>
            )}

            {hasValidRecords && (
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-2">
                  预览 {recordCount} 条记录
                  {errorCount > 0 && <span className="text-red-500 ml-1">（{errorCount} 条无效）</span>}
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-2 py-1.5 text-gray-600">材料名称</th>
                        <th className="text-left px-2 py-1.5 text-gray-600">日期</th>
                        <th className="text-right px-2 py-1.5 text-gray-600">数量</th>
                        <th className="text-left px-2 py-1.5 text-gray-600">单位</th>
                        <th className="text-right px-2 py-1.5 text-gray-600">单价</th>
                        <th className="text-right px-2 py-1.5 text-gray-600">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.records.map((r) => (
                        <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-800">
                            {r.name}
                            {r.merged && <span className="ml-1 text-xs text-blue-500">已合并</span>}
                          </td>
                          <td className="px-2 py-1 text-gray-500">{r.date}</td>
                          <td className="px-2 py-1 text-right">{r.quantity}</td>
                          <td className="px-2 py-1 text-gray-500">{r.unit}</td>
                          <td className="px-2 py-1 text-right">{r.costPrice > 0 ? `¥${r.costPrice}` : '-'}</td>
                          <td className="px-2 py-1 text-right font-medium">¥{r.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!hasValidRecords && formatErrorCount === 0 && !loading && (
              <div className="p-6 text-center text-sm text-gray-400">未解析到有效数据</div>
            )}
          </div>
        )}

        {hasValidRecords && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => handleImport(result!.records)}
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-600"
            >
              确认导入 {recordCount} 条记录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
