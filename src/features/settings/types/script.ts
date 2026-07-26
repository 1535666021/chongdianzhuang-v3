import type { ScriptTemplate, ScriptVariable } from '@/constants/scripts'

export interface ScriptTemplateLocal extends ScriptTemplate {
  isDefault?: boolean
}

export interface ScriptVariableValue {
  name: string
  value: string
}

export interface GeneratedScript {
  templateId: string
  brand: string
  scene: string
  originalContent: string
  generatedText: string
  variables: ScriptVariableValue[]
  createdAt: number
}
