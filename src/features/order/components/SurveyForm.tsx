import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import type { SurveyFormData, SurveyMaterialItem } from '../types/survey'

interface SurveyFormProps {
  form: SurveyFormData
  onUpdate: (updates: Partial<SurveyFormData>) => void
  onAddMaterial: () => void
  onUpdateMaterial: (index: number, updates: Partial<SurveyMaterialItem>) => void
  onRemoveMaterial: (index: number) => void
}

const POWER_OPTIONS = ['国网取电', '物业配电', '自家电表', '其他'] as const
const CABLE_SPECS = ['3*6', '3*10', '4*6', '4*10', '5*6', '5*10', '2*4', '2*6', '其他']
const INSTALL_OPTIONS = ['壁挂安装', '立柱安装', '吊装', '其他'] as const
const METER_STATUS_OPTIONS = ['已安装', '未安装'] as const
const BLUEPRINT_OPTIONS = ['是', '否'] as const
const RESULT_OPTIONS = ['勘测完成', '符合安装', '不符合安装', '需整改', '待定'] as const

export function SurveyForm({
  form,
  onUpdate,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
}: SurveyFormProps) {
  return (
    <div className="space-y-4">
      {/* 🔌 线缆信息 */}
      <div className="card">
        <div className="card__title">🔌 线缆信息</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-secondary mb-1">取电方式</label>
            <select
              className="input w-full"
              value={form.powerSource}
              onChange={(e) => onUpdate({ powerSource: e.target.value as any })}
            >
              {POWER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">线缆规格</label>
            <select
              className="input w-full"
              value={form.cableSpec}
              onChange={(e) => onUpdate({ cableSpec: e.target.value })}
            >
              <option value="">请选择</option>
              {CABLE_SPECS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">电缆距离(米)</label>
            <input
              type="number"
              className="input w-full"
              value={form.cableDistance || ''}
              onChange={(e) => onUpdate({ cableDistance: Number(e.target.value) })}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">预估费用(元)</label>
            <input
              type="number"
              className="input w-full"
              value={form.estimatedCableCost || ''}
              onChange={(e) => onUpdate({ estimatedCableCost: Number(e.target.value) })}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* 🔧 勘测详情 */}
      <div className="card">
        <div className="card__title">🔧 勘测详情</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-secondary mb-1">安装方式</label>
            <select
              className="input w-full"
              value={form.installMethod}
              onChange={(e) => onUpdate({ installMethod: e.target.value as any })}
            >
              {INSTALL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">电表状态</label>
            <select
              className="input w-full"
              value={form.meterStatus}
              onChange={(e) => onUpdate({ meterStatus: e.target.value as any })}
            >
              {METER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">物业需要方案图</label>
            <select
              className="input w-full"
              value={form.needBlueprint}
              onChange={(e) => onUpdate({ needBlueprint: e.target.value as any })}
            >
              {BLUEPRINT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-secondary mb-1">勘测结果</label>
            <select
              className="input w-full"
              value={form.surveyResult}
              onChange={(e) => onUpdate({ surveyResult: e.target.value as any })}
            >
              {RESULT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 📦 预估材料 */}
      <div className="card">
        <div className="card__title flex items-center gap-2">
          <ClipboardList size={16} />
          预估材料
        </div>
        <div className="space-y-2">
          {form.estimatedMaterials.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="input flex-1 text-sm"
                placeholder="材料名称"
                value={m.name}
                onChange={(e) => onUpdateMaterial(i, { name: e.target.value })}
              />
              <input
                className="input w-20 text-sm"
                placeholder="规格"
                value={m.spec || ''}
                onChange={(e) => onUpdateMaterial(i, { spec: e.target.value })}
              />
              <input
                className="input w-16 text-sm"
                type="number"
                placeholder="数量"
                value={m.quantity}
                onChange={(e) => onUpdateMaterial(i, { quantity: Number(e.target.value) || 0 })}
              />
              <input
                className="input w-16 text-sm"
                placeholder="单位"
                value={m.unit}
                onChange={(e) => onUpdateMaterial(i, { unit: e.target.value })}
              />
              <button
                className="btn btn--sm btn--danger"
                onClick={() => onRemoveMaterial(i)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            className="btn btn--sm btn--outline w-full flex items-center justify-center gap-1"
            onClick={onAddMaterial}
          >
            <Plus size={14} /> 添加材料
          </button>
        </div>
      </div>

      {/* 📍 位置信息 */}
      <div>
        <label className="block text-sm text-secondary mb-1">📍 位置信息</label>
        <textarea
          className="input w-full h-24 resize-none"
          placeholder="输入位置描述..."
          value={form.locationInfo}
          onChange={(e) => onUpdate({ locationInfo: e.target.value })}
        />
      </div>
    </div>
  )
}
