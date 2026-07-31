import { useState, useMemo } from 'react'
import { scriptStorage } from '@/shared/storage/scriptStorage'
import type { ScriptTemplate } from '@/constants/scripts'
import { DEFAULT_SCRIPT_VARIABLES } from '@/constants/scripts'
import { Plus, Edit3, Trash2, RotateCcw, X, Save, AlertTriangle } from 'lucide-react'

const BRANDS = ['通用', '理想', '比亚迪', '小米', '零跑']
const SCENES = ['上门前', '勘测完成', '安装完成']

function preview(text: string) {
  return text.replace(/{{[^}]+}}/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').slice(0, 30) + (text.length > 30 ? '...' : '')
}

interface FormData {
  brand: string
  scene: string
  content: string
  variables: ScriptTemplate['variables']
}

const emptyForm = (): FormData => ({
  brand: '通用',
  scene: '勘测完成',
  content: '',
  variables: [...DEFAULT_SCRIPT_VARIABLES],
})

export default function ScriptManager() {
  const [templates, setTemplates] = useState(() => scriptStorage.getAll())
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [customBrand, setCustomBrand] = useState(false)

  const refresh = () => setTemplates(scriptStorage.getAll())

  const grouped = useMemo(() => {
    const map: Record<string, ScriptTemplate[]> = {}
    for (const t of templates) {
      const b = t.brand || '通用'
      if (!map[b]) map[b] = []
      map[b].push(t)
    }
    return Object.entries(map).sort(([a], [b]) => {
      const ia = BRANDS.indexOf(a)
      const ib = BRANDS.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b)
    })
  }, [templates])

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm())
    setCustomBrand(false)
    setShowForm(true)
  }

  const openEdit = (t: ScriptTemplate) => {
    setEditId(t.id)
    setForm({ brand: t.brand, scene: t.scene, content: t.content, variables: t.variables || [...DEFAULT_SCRIPT_VARIABLES] })
    setCustomBrand(!BRANDS.includes(t.brand))
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.brand || !form.scene) return
    if (editId) {
      scriptStorage.update(editId, form)
    } else {
      scriptStorage.add(form as any)
    }
    setShowForm(false)
    refresh()
  }

  const handleDelete = (id: string) => {
    scriptStorage.remove(id)
    setShowDelete(null)
    refresh()
  }

  const handleReset = () => {
    scriptStorage.resetToDefaults()
    setShowReset(false)
    refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">话术模板管理</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <RotateCcw size={12} />
            恢复默认
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={12} />
            新增
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {grouped.map(([brand, items]) => (
          <div key={brand}>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
              {brand}
            </div>
            {items.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{t.scene}</span>
                    <span className="text-sm text-gray-700 truncate">{preview(t.content)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setShowDelete(t.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">暂无模板，点击"新增"创建</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editId ? '编辑模板' : '新增模板'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">品牌</label>
                  {customBrand ? (
                    <div className="flex gap-1">
                      <input
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                        placeholder="输入品牌名"
                      />
                      <button onClick={() => { setCustomBrand(false); setForm({ ...form, brand: '通用' }) }} className="text-xs text-gray-400">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                    >
                      {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      <option value="_custom_">自定义...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">场景</label>
                  <select
                    value={form.scene}
                    onChange={(e) => setForm({ ...form, scene: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                  >
                    {SCENES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">变量</label>
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_SCRIPT_VARIABLES.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        const tag = `{{${v.name}}}`
                        setForm({ ...form, content: form.content + tag })
                      }}
                      className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">内容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full h-40 p-2 text-sm border border-gray-200 rounded-lg resize-none font-mono"
                  placeholder="输入话术内容，点击上方变量标签插入 {{变量}}"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">
                取消
              </button>
              <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save size={14} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showReset && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReset(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-semibold text-gray-900">恢复默认模板</h3>
            </div>
            <div className="p-4 text-sm text-gray-600">此操作将删除所有自定义模板并恢复为15条默认模板，确定继续？</div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setShowReset(false)} className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleReset} className="flex-1 py-3 text-sm font-medium text-amber-600 border-l border-gray-100 hover:bg-amber-50">确认恢复</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDelete(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-semibold text-gray-900">确认删除</h3>
            </div>
            <div className="p-4 text-sm text-gray-600">确定删除该话术模板吗？此操作不可撤销。</div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setShowDelete(null)} className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={() => handleDelete(showDelete)} className="flex-1 py-3 text-sm font-medium text-red-500 border-l border-gray-100 hover:bg-red-50">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
