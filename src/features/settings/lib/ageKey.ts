// P0-253-1 备份密钥：本地生成 age 密钥对（X25519 + bech32/bech32m）
// 公钥持久化本机；私钥仅用于一次性下载，绝不写入任何存储
import { x25519 } from '@noble/curves/ed25519.js'
import { bech32, bech32m } from '@scure/base'

export const AGE_PUBKEY_STORAGE_KEY = 'cdz_v3_backup_age_pubkey'

export interface AgeKeyPair {
  publicKey: string // age1...
  secretKey: string // AGE-SECRET-KEY-1...
}

function bytesToWords(bytes: Uint8Array): number[] {
  const words: number[] = []
  let acc = 0
  let bits = 0
  for (const b of bytes) {
    acc = (acc << 8) | b
    bits += 8
    while (bits >= 5) {
      bits -= 5
      words.push((acc >>> bits) & 31)
    }
  }
  if (bits > 0) words.push((acc << (5 - bits)) & 31)
  return words
}

export function generateAgeKeyPair(): AgeKeyPair {
  const kp = x25519.keygen()
  return {
    publicKey: bech32.encode('age', bytesToWords(kp.publicKey)),
    secretKey: bech32m.encode('age-secret-key-', bytesToWords(kp.secretKey)).toUpperCase(),
  }
}

export function loadStoredPublicKey(): string | null {
  return localStorage.getItem(AGE_PUBKEY_STORAGE_KEY)
}

export function persistPublicKey(publicKey: string): void {
  localStorage.setItem(AGE_PUBKEY_STORAGE_KEY, publicKey)
}

// 私钥下载文件内容（附公钥与保管提示，方便日后对账）
export function buildSecretKeyFileContent(pair: AgeKeyPair): string {
  return [
    '# age 备份私钥（充电桩订单助手导出）',
    '# 私钥仅显示这一次，请离线妥善保管；丢失将无法解开备份',
    pair.secretKey,
    `# 对应公钥：${pair.publicKey}`,
    '',
  ].join('\n')
}
