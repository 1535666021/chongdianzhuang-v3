import type { StorageAdapter } from './adapter'

export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private prefix: string

  constructor(prefix: string = '') {
    this.prefix = prefix
  }

  private key(k: string): string {
    return this.prefix + k
  }

  get(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.key(key))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  set(key: string, value: T): void {
    localStorage.setItem(this.key(key), JSON.stringify(value))
  }

  remove(key: string): void {
    localStorage.removeItem(this.key(key))
  }

  clear(): void {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(this.prefix)) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  }
}
