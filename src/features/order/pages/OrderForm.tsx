import { useNavigate, useParams } from 'react-router-dom'
import { useOrderForm } from '../hooks/useOrderForm'
import { PLATFORMS, ORDER_STATUSES, INSTALL_TYPES } from '@/constants/order'
import { ArrowLeft, Save, User, Phone, MapPin, Calendar, DollarSign, Zap } from 'lucide-react'
import { formatCurrency } from '@/shared/utils/format'

export default function OrderForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { form, errors, isEdit, updateField, submit } = useOrderForm(id)

  const handleSubmit = () => {
    const result = submit()
    if (result) {
      navigate(isEdit ? `/orders/${id}` : '/')
    }
  }

  const inputClass = (field: string) =>
    `w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'ring-2 ring-red-500' : ''
    }`

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部栏 */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">{isEdit ? '编辑订单' : '新增订单'}</h1>
        <button
          onClick={handleSubmit}
          className="ml-auto flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          <Save size={16} />
          保存
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 客户信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">客户信息</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <User size={14} /> 客户姓名 *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className={inputClass('customerName')}
                placeholder="请输入客户姓名"
              />
              {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <Phone size={14} /> 电话 *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass('phone')}
                placeholder="请输入手机号"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <MapPin size={14} /> 地址 *
              </label>
              <textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputClass('address') + ' resize-none h-16'}
                placeholder="请输入详细地址"
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* 平台与状态 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">订单信息</h2>
          {/* P0-133-R2：子品牌/型号可选输入（表单无品牌输入字段——品牌由解析器产出；独立成行随单入库进汇总） */}
          <div className="mb-3">
            <label className="text-sm text-gray-600 mb-1 block">子品牌/型号（可选）</label>
            <input
              value={form.subBrand || ''}
              onChange={(e) => updateField('subBrand', e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              placeholder="如：银河黑金刚"
            />
          </div>
          {/* P0-155：套餐米数可编辑——读不到留空手填，读错直接改；留空=清字段回落品牌默认。
              用 text+inputMode=decimal 而非 type=number：后者会静默吞掉非法字符（value变空），
              无法实现"非法字符阻断保存并提示"；移动端仍弹数字键盘 */}
          <div className="mb-3">
            <label className="text-sm text-gray-600 mb-1 block">套餐米数（可选）</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.packageMeters}
              onChange={(e) => updateField('packageMeters', e.target.value)}
              className={inputClass('packageMeters')}
              placeholder="留空=按品牌默认(30米)"
            />
            {errors.packageMeters && <p className="text-xs text-red-500 mt-1">{errors.packageMeters}</p>}
          </div>
        {/* P0-165-R7：出差安装开关（人工标记优先于启发式；ON=免扣点+补助30/台） */}
        <div className="mb-3 flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2.5">
          <div>
            <p className="text-sm text-gray-700">出差安装</p>
            <p className="text-xs text-gray-400">出差单：免扣点，对账=安装费+补助30/台</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isBusinessTrip}
            onClick={() => updateField('isBusinessTrip', !form.isBusinessTrip)}
            className={`relative h-6 w-11 rounded-full transition-colors ${form.isBusinessTrip ? 'bg-orange-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.isBusinessTrip ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">平台</label>
              <select
                value={form.platform}
                onChange={(e) => updateField('platform', e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">状态</label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              >
                {ORDER_STATUSES.filter((s) => s !== '回收站').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm text-gray-600 mb-1 block">安装类型</label>
            <select
              value={form.installType}
              onChange={(e) => updateField('installType', e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
            >
              {INSTALL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 预约信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">预约信息</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <Calendar size={14} /> 预约日期
              </label>
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => updateField('appointmentDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">预约时间</label>
              <input
                type="time"
                value={form.appointmentTime}
                onChange={(e) => updateField('appointmentTime', e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
              <Zap size={14} /> 电表状态
            </label>
            <div className="flex gap-3">
              {['未安装', '已安装'].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="meterStatus"
                    checked={form.meterStatus === s}
                    onChange={() => updateField('meterStatus', s as any)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 费用 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">费用信息</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <DollarSign size={14} /> 材料费
              </label>
              <input
                type="number"
                value={form.materialCost}
                onChange={(e) => updateField('materialCost', Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">平台扣点</label>
              <input
                type="number"
                value={form.platformFee}
                onChange={(e) => updateField('platformFee', Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">实际利润</label>
              <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm font-semibold text-blue-600">
                {formatCurrency(form.actualProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* 备注 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">备注</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none resize-none h-20"
            placeholder="请输入备注信息"
          />
        </div>
      </div>
    </div>
  )
}
