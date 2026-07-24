import { useNavigate } from 'react-router-dom'
import { useBatchParser } from '../hooks/useBatchParser'
import { useOrderStore } from '@/stores/orderStore'
import { ArrowLeft, FileText, Play, Check, Trash2 } from 'lucide-react'

export default function BatchParser() {
  const navigate = useNavigate()
  const { rawText, setRawText, parsedOrders, blockCount, isParsing, parse, clear, convertToOrders } = useBatchParser()
  const addOrder = useOrderStore((state) => state.addOrder)

  const handleImport = () => {
    const orders = convertToOrders()
    orders.forEach((order) => addOrder(order))
    navigate('/')
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
              onClick={parse}
              disabled={!rawText.trim() || isParsing}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <Play size={16} />
              {isParsing ? '解析中...' : '开始解析'}
            </button>
            <button
              onClick={clear}
              className="flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
        </div>

        {/* 解析结果 */}
        {parsedOrders.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">
                解析结果 ({parsedOrders.length}条)
                {blockCount > parsedOrders.length && (
                  <span className="text-xs text-amber-500 ml-2">(识别{parsedOrders.length}/{blockCount}条)</span>
                )}
              </h2>
              <button
                onClick={handleImport}
                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                <Check size={16} />
                确认导入
              </button>
            </div>
            <div className="space-y-2">
              {parsedOrders.map((po, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}