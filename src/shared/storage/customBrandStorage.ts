const STORAGE_KEY = 'cdz_custom_brands_v1'

function normalize(brands: string[]): string[] {
  return [...new Set(brands.map((brand) => brand.trim()).filter(Boolean))]
}

/** P0-240：读取自定义品牌库（手动输入的品牌，全系统下拉复用） */
export function getCustomBrands(): string[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? normalize(JSON.parse(value)) : []
  } catch {
    return []
  }
}

export function setCustomBrands(brands: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(brands)))
}

/** P0-240：写入自定义品牌库（去空格、去重、禁空） */
export function addCustomBrand(brand: string): void {
  const value = brand.trim()
  if (value) setCustomBrands([...getCustomBrands(), value])
}

/** P0-240：从自定义库删除——仅下拉里不再出现，存量单品牌字段不动（R-11.2） */
export function removeCustomBrand(brand: string): void {
  setCustomBrands(getCustomBrands().filter((b) => b !== brand))
}
