import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBatchParser, type PreviewEntry } from '../hooks/useBatchParser'
import { useOrderStore } from '@/stores/orderStore'
import { ArrowLeft, FileText, Play, Check, Trash2 } from 'lucide-react'

const MATCHED_BY_LABEL = { orderNo: '单号', phone: '电话', name: '姓名' } as const

/** 状态徽标：新增 / 重复跳过（注明与哪条既有单重复）/ 批内重复 */
function StatusBadge({ entry }: { entry: PreviewEntry }) {
  if (entry.status === 'new') {
    return <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">新增</span>
  }
  if (entry.status === 'existing-dup' && entry.existingMatch) {
    const { matchedBy, existing } = entry.existingMatch
    const text = matchedBy === 'orderNo'
      ? `重复：单号 ${existing.orderNo} 与既有单相同`
      : `重复：与既有单「${existing.customerName || '未识别姓名'} ${existing.phone || ''}」${MATCHED_BY_LABEL[matchedBy]}相同`
    return <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{text}</span>
  }
  if (entry.status === 'batch-dup' && entry.batchMatch) {
    const { firstIndex, matchedBy } = entry.batchMatch
    return (
      <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
        批内重复：与第 {firstIndex + 1} 条{MATCHED_BY_LABEL[matchedBy]}相同
      </span>
    )
  }
  return null
}

export default function BatchParser() {
  const navigate = useNavigate()
  const {
    rawText, setRawText, previewEntries, checked, checkedCount,
    blockCount, isParsing, parse, clear, toggleChecked, getCheckedOrders,
  } = useBatchParser()
  const importOrders = useOrderStore((state) => state.importOrders)
  const [importSummary, setImportSummary] = useState('')

  const handleParse = () => {
    setImportSummary('')
    parse()
  }

  const handleClear = () => {
    setImportSummary('')
    clear()
  }

  const handleImport = () => {
    const orders = getCheckedOrders()
    if (orders.length === 0) return
    const res = importOrders(orders)
    // skipped 联动：预览未勾选（重复默认跳过）+ 库内同id跳过
    const skippedTotal = res.skipped + (previewEntries.length - orders.length)
    setImportSummary(`导入完成：新增 ${res.added} 条，更新 ${res.updated} 条，跳过 ${skippedTotal} 条`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部栏 */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">批量解析</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 输入区 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">粘贴微信群订单文本</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-40 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none resize-none"
            placeholder="请粘贴微信群中的订单信息，每行一条...

示例：
姓名：张三 电话：13800138000 地址：巢湖市XX小区
姓名：李四 电话：13900139000 地址：合肥市XX路"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || isParsing}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <Play size={16} />
              {isParsing ? '解析中...' : '开始解析'}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
        </div>

        {/* 导入结果提示 */}
        {importSummary && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-sm">
            {importSummary}
          </div>
        )}

        {/* 解析结果 */}
        {previewEntries.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">
                解析结果 ({previewEntries.length}条)
                {blockCount > previewEntries.length && (
                  <span className="text-xs text-amber-500 ml-2">(识别{previewEntries.length}/{blockCount}条)</span>
                )}
              </h2>
              <button
                onClick={handleImport}
                disabled={checkedCount === 0}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                <Check size={16} />
                确认导入 ({checkedCount}条)
              </button>
            </div>
            <div className="space-y-2">
              {previewEntries.map((entry, idx) => {
                const po = entry.order
                const isDup = entry.status !== 'new'
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm flex gap-2 ${isDup ? 'bg-amber-50/60 border border-amber-100' : 'bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked[idx] ?? false}
                      onChange={() => toggleChecked(idx)}
                      className="mt-1 shrink-0 accent-green-600"
                      title={isDup ? '重复项默认跳过，勾选可强制导入' : ''}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium">{po.customerName || '未识别姓名'}</span>
                        <span className="text-gray-500">{po.phone || '未识别电话'}</span>
                      </div>
                      <div className="text-gray-600 mt-1">{po.address || '未识别地址'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        平台: {po.platformName || '其他'} | 品牌: {po.brandName || '未识别'} | 功率: {po.powerKw || '未识别'}kW | 米数: {po.packageMeters || '未识别'}m
                      </div>
                      {po.remark && (
                        <div className="text-xs text-gray-400 mt-1">备注: {po.remark}</div>
                      )}
                      <div className="mt-1.5">
                        <StatusBadge entry={entry} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
