import { useState, useMemo } from 'react'
import { useScripts } from '../hooks/useScripts'
import { Copy, Plus, Trash2, Edit3, Check, X, MessageSquare, Sparkles } from 'lucide-react'
import type { ScriptTemplateLocal } from '../types/script'
import { toast } from '@/shared/hooks/useToast'

export function ScriptEditor() {
  const { allTemplates, brands, addTemplate, updateTemplate, deleteTemplate, generateScript, defaultVariables } = useScripts()
  const [selectedBrand, setSelectedBrand] = useState('全部')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ScriptTemplateLocal>>({})
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    if (selectedBrand === '全部') return allTemplates
    return allTemplates.filter((t) => t.brand === selectedBrand)
  }, [allTemplates, selectedBrand])

  const currentTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplate)
  }, [allTemplates, selectedTemplate])

  const generated = useMemo(() => {
    if (!selectedTemplate) return null
    return generateScript(selectedTemplate, variableValues)
  }, [selectedTemplate, variableValues, generateScript])

  const handleCopy = async () => {
    if (generated?.generatedText) {
      try {
        await navigator.clipboard.writeText(generated.generatedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('话术已复制')
      } catch {
        toast.error('复制失败，请检查浏览器权限')
      }
    }
  }

  const handleAdd = () => {
    const newTemplate: ScriptTemplateLocal = {
      id: Date.now().toString(),
      brand: '通用',
      scene: '自定义',
      content: '您好{{customerName}}，我是{{installer}}，电话{{phone}}。\n\n{{notes}}',
      variables: defaultVariables,
    }
    addTemplate(newTemplate)
    setSelectedTemplate(newTemplate.id)
    setIsEditing(true)
    setEditForm(newTemplate)
  }

  const handleSaveEdit = () => {
    if (editForm.id) {
      updateTemplate(editForm.id, editForm)
      setIsEditing(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* 品牌筛选 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedBrand('全部')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${selectedBrand === '全部' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          全部
        </button>
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBrand(b)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium ${selectedBrand === b ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* 模板列表 */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTemplate(t.id)
              setIsEditing(false)
            }}
            className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${
              selectedTemplate === t.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-800">{t.brand}</span>
                <span className="text-xs text-gray-400 ml-2">{t.scene}</span>
                {t.isDefault && <span className="text-[10px] text-blue-500 ml-1">默认</span>}
              </div>
              {!t.isDefault && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                      setEditForm({ ...t })
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTemplate(t.id)
                      if (selectedTemplate === t.id) setSelectedTemplate(null)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"
      >
        <Plus size={14} /> 新增模板
      </button>

      {/* 编辑区 */}
      {isEditing && editForm.id && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">编辑模板</h3>
          <input
            type="text"
            value={editForm.brand || ''}
            onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
            placeholder="品牌"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            value={editForm.scene || ''}
            onChange={(e) => setEditForm({ ...editForm, scene: e.target.value })}
            placeholder="场景"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
          <textarea
            value={editForm.content || ''}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            placeholder="模板内容（使用 {{变量名}} 占位）"
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="flex-1 py-2 bg-blue-500 text-white text-xs rounded-lg flex items-center justify-center gap-1">
              <Check size={12} /> 保存
            </button>
            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg flex items-center justify-center gap-1">
              <X size={12} /> 取消
            </button>
          </div>
        </div>
      )}

      {/* 变量输入区 */}
      {currentTemplate && !isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Sparkles size={14} className="text-blue-500" />
            变量填充
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {defaultVariables.map((v) => (
              <div key={v.name}>
                <label className="text-[10px] text-gray-400">{v.label}</label>
                <input
                  type="text"
                  value={variableValues[v.name] || ''}
                  onChange={(e) => setVariableValues({ ...variableValues, [v.name]: e.target.value })}
                  placeholder={v.defaultValue}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 预览区 */}
      {generated && !isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <MessageSquare size={14} className="text-green-500" />
              生成结果
            </h3>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${copied ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {generated.generatedText}
          </div>
        </div>
      )}
    </div>
  )
}
