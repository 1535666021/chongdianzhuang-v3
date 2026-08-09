import type { MaterialUsageRecord } from '@/types'

export interface ImportRow {
  name: string
  quantity: number
  unit: string
  costPrice: number
  date: string
  remark?: string
}

export interface ImportError {
  row: number
  message: string
}

export interface ImportResult {
  records: MaterialUsageRecord[]
  errors: ImportError[]
}

const HEADER_MAP: Record<string, string> = {
  '材料名称': 'name',
  '名称': 'name',
  'name': 'name',
  'materialName': 'name',
  '数量': 'quantity',
  'quantity': 'quantity',
  '单位': 'unit',
  'unit': 'unit',
  '单价': 'costPrice',
  '成本单价': 'costPrice',
  'costPrice': 'costPrice',
  '日期': 'date',
  'date': 'date',
  '备注': 'remark',
  'remark': 'remark',
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0) continue
    const row: Record<string, string> = {}
    headers.forEach((h, j) => {
      row[h] = values[j] || ''
    })
    if (Object.values(row).some((v) => v !== '')) rows.push(row)
  }
  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function parseJson(text: string): Record<string, string>[] {
  const data = JSON.parse(text)
  if (Array.isArray(data)) return data
  if (data.records && Array.isArray(data.records)) return data.records
  if (data.data && Array.isArray(data.data)) return data.data
  return []
}

function normalizeRow(row: Record<string, string>): ImportRow | null {
  const mapped: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    const normalized = HEADER_MAP[key]
    if (normalized) mapped[normalized] = value
  }
  if (!mapped.name) return null
  return {
    name: mapped.name,
    quantity: Math.max(0, parseFloat(mapped.quantity) || 0),
    unit: mapped.unit || '个',
    costPrice: Math.max(0, parseFloat(mapped.costPrice) || 0),
    date: mapped.date || '',
    remark: mapped.remark,
  }
}

function validateRow(row: ImportRow, index: number): string[] {
  const msgs: string[] = []
  if (!row.name.trim()) msgs.push(`第${index + 1}行：材料名称不能为空`)
  if (!row.quantity || row.quantity <= 0) msgs.push(`第${index + 1}行：数量必须为正数`)
  if (row.date && isNaN(Date.parse(row.date))) msgs.push(`第${index + 1}行：日期格式无效`)
  return msgs
}

export function parseImportFile(content: string, fileName: string): ImportResult {
  const errors: ImportError[] = []
  let rows: Record<string, string>[] = []

  try {
    if (/\.json$/i.test(fileName)) {
      rows = parseJson(content)
    } else {
      rows = parseCsv(content)
    }
  } catch {
    errors.push({ row: 0, message: '文件格式错误，无法解析' })
    return { records: [], errors }
  }

  if (rows.length === 0) {
    errors.push({ row: 0, message: '未找到有效数据行' })
    return { records: [], errors }
  }

  const records: MaterialUsageRecord[] = []
  const keyIndex = new Map<string, number>()

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeRow(rows[i])
    if (!normalized) {
      errors.push({ row: i + 2, message: `第${i + 2}行：缺少材料名称` })
      continue
    }

    const rowErrors = validateRow(normalized, i)
    for (const msg of rowErrors) {
      errors.push({ row: i + 2, message: msg })
    }
    if (rowErrors.length > 0) continue

    const date = normalized.date || new Date().toISOString().slice(0, 10)
    const key = `${normalized.name}||${date}`
    const existingIdx = keyIndex.get(key)

    if (existingIdx !== undefined) {
      const existing = records[existingIdx]
      existing.quantity += normalized.quantity
      existing.total = Math.round((existing.total + normalized.quantity * normalized.costPrice) * 100) / 100
      existing.merged = true
    } else {
      const quantity = normalized.quantity
      const costPrice = normalized.costPrice
      const total = Math.round(quantity * costPrice * 100) / 100

      keyIndex.set(key, records.length)
      records.push({
        id: `import_${Date.now()}_${records.length}`,
        date,
        name: normalized.name,
        unit: normalized.unit,
        costPrice,
        quantity,
        total,
      })
    }
  }

  return { records, errors }
}
