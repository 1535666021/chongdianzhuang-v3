const STORAGE_KEY = 'cdz_known_platforms_v1'

function normalize(platforms: string[]): string[] {
  return [...new Set(platforms.map((platform) => platform.trim()).filter(Boolean))]
}

export function getKnownPlatforms(): string[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? normalize(JSON.parse(value)) : []
  } catch {
    return []
  }
}

export function setKnownPlatforms(platforms: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(platforms)))
}

export function addKnownPlatform(platform: string): void {
  const value = platform.trim()
  if (value) setKnownPlatforms([...getKnownPlatforms(), value])
}
