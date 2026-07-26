import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import type { SurveyFormData, SurveyMaterialItem } from '../types/survey'

interface SurveyFormProps {
  form: SurveyFormData
  onUpdate: (updates: Partial<SurveyFormData>) => void
  onAddMaterial: () => void
  onUpdateMaterial: (index: number, updates: Partial<SurveyMaterialItem>) => void
  onRemoveMaterial: (index: number) => void
}

const METER_LOCATIONS = ['楼道', '车库', '户外', '其他'] as const
const DIFFICULTIES = ['简单', '一般', '复杂', '极难'] as const

export function SurveyForm({
  form,
  onUpdate,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
}: SurveyFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-secondary mb-1">勘察日期</label>
        <input
          type="date"
          className="input w-full"
          value={form.surveyDate}
          onChange={(e) => onUpdate({ surveyDate: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">电表位置</label>
        <div className="flex flex-wrap gap-2">
          {METER_LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`btn btn--sm ${form.meterLocation === loc ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => onUpdate({ meterLocation: loc })}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">线路走向</label>
        <input
          type="text"
          className="input w-full"
          placeholder="如：从电表箱沿墙面走线至车位"
          value={form.cableRoute}
          onChange={(e) => onUpdate({ cableRoute: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">施工难度</label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn--sm ${form.difficulty === d ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => onUpdate({ difficulty: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

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

      <div>
        <label className="block text-sm text-secondary mb-1">现场照片描述</label>
        <input
          type="text"
          className="input w-full"
          placeholder="如：电表箱位置、走线路径、障碍物等"
          value={form.photosDesc}
          onChange={(e) => onUpdate({ photosDesc: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">勘察备注</label>
        <textarea
          className="input w-full h-24 resize-none"
          placeholder="其他需要注意的事项..."
          value={form.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
        />
      </div>
    </div>
  )
}
