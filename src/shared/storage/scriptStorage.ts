import type { ScriptTemplate } from '@/constants/scripts'
import { DEFAULT_SCRIPT_TEMPLATES } from '@/constants/scripts'

const STORAGE_KEY = 'cdz_scripts_v1'

function readAll(): ScriptTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCRIPT_TEMPLATES))
      return [...DEFAULT_SCRIPT_TEMPLATES]
    }
    return JSON.parse(raw) as ScriptTemplate[]
  } catch {
    return [...DEFAULT_SCRIPT_TEMPLATES]
  }
}

function writeAll(list: ScriptTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

let idCounter = Date.now()

function generateId(): string {
  return 'script_' + String(++idCounter)
}

export const scriptStorage = {
  getAll(): ScriptTemplate[] {
    return readAll()
  },

  getByBrand(brand: string): ScriptTemplate[] {
    return readAll().filter((t) => t.brand === brand || t.brand === '通用')
  },

  getByScene(scene: string): ScriptTemplate[] {
    return readAll().filter((t) => t.scene === scene)
  },

  add(template: Omit<ScriptTemplate, 'id'>): ScriptTemplate {
    const list = readAll()
    const newItem: ScriptTemplate = {
      ...template,
      id: generateId(),
      variables: template.variables || [],
    }
    list.push(newItem)
    writeAll(list)
    return newItem
  },

  update(id: string, partial: Partial<ScriptTemplate>): void {
    const list = readAll()
    const idx = list.findIndex((t) => t.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial }
      writeAll(list)
    }
  },

  remove(id: string): void {
    const list = readAll()
    writeAll(list.filter((t) => t.id !== id))
  },

  resetToDefaults(): void {
    writeAll([...DEFAULT_SCRIPT_TEMPLATES])
  },
}
