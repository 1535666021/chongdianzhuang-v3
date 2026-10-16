import { useState, useMemo, useCallback } from 'react'
import { DEFAULT_SCRIPT_TEMPLATES, DEFAULT_SCRIPT_VARIABLES } from '@/constants/scripts'
import type { ScriptTemplateLocal, ScriptVariableValue, GeneratedScript } from '../types/script'

export function useScripts() {
  const [customTemplates, setCustomTemplates] = useState<ScriptTemplateLocal[]>(() => {
    try {
      const saved = localStorage.getItem('cdz_v3_script_templates')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const allTemplates = useMemo<ScriptTemplateLocal[]>(() => {
    const defaults = DEFAULT_SCRIPT_TEMPLATES.map((t) => ({ ...t, isDefault: true }))
    return [...defaults, ...customTemplates]
  }, [customTemplates])

  const brands = useMemo(() => {
    const set = new Set(allTemplates.map((t) => t.brand))
    return Array.from(set)
  }, [allTemplates])

  const scenes = useMemo(() => {
    const set = new Set(allTemplates.map((t) => t.scene))
    return Array.from(set)
  }, [allTemplates])

  const saveCustomTemplates = useCallback((templates: ScriptTemplateLocal[]) => {
    setCustomTemplates(templates)
    localStorage.setItem('cdz_v3_script_templates', JSON.stringify(templates))
  }, [])

  const addTemplate = useCallback((template: ScriptTemplateLocal) => {
    saveCustomTemplates([...customTemplates, template])
  }, [customTemplates, saveCustomTemplates])

  const updateTemplate = useCallback((id: string, updates: Partial<ScriptTemplateLocal>) => {
    saveCustomTemplates(
      customTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [customTemplates, saveCustomTemplates])

  const deleteTemplate = useCallback((id: string) => {
    saveCustomTemplates(customTemplates.filter((t) => t.id !== id))
  }, [customTemplates, saveCustomTemplates])

  const generateScript = useCallback(
    (templateId: string, variableValues: Record<string, string>): GeneratedScript => {
      const template = allTemplates.find((t) => t.id === templateId)
      if (!template) {
        return {
          templateId,
          brand: '',
          scene: '',
          originalContent: '',
          generatedText: '模板不存在',
          variables: [],
          createdAt: Date.now(),
        }
      }

      let text = template.content
      const vars: ScriptVariableValue[] = []

      DEFAULT_SCRIPT_VARIABLES.forEach((v) => {
        const value = variableValues[v.name] || v.defaultValue || ''
        text = text.replace(new RegExp(`{{${v.name}}}`, 'g'), value)
        vars.push({ name: v.name, value })
      })

      return {
        templateId,
        brand: template.brand,
        scene: template.scene,
        originalContent: template.content,
        generatedText: text,
        variables: vars,
        createdAt: Date.now(),
      }
    },
    [allTemplates]
  )

  return {
    allTemplates,
    customTemplates,
    brands,
    scenes,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    generateScript,
    defaultVariables: DEFAULT_SCRIPT_VARIABLES,
  }
}
