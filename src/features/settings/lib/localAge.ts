// P0-253-3 本地加解密工具：age v1 X25519 文件格式（与 age/rage CLI 互通，C2SP age.md）
// 加密只需公钥；解密需私钥临时读入内存即焚；全程断网可用；不留明文临时文件
// 不含变更监听、不含私仓上传（任务书明令）
import { x25519 } from '@noble/curves/ed25519.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { hkdf } from '@noble/hashes/hkdf.js'
import { hmac } from '@noble/hashes/hmac.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bech32, bech32m, base64 } from '@scure/base'

const CHUNK_SIZE = 64 * 1024
const FILE_KEY_SIZE = 16
const PAYLOAD_NONCE_SIZE = 16
const INFO_WRAP = 'age-encryption.org/v1/X25519'
const INFO_HEADER = 'header'
const INFO_PAYLOAD = 'payload'
const INTRO = 'age-encryption.org/v1'

const te = new TextEncoder()
const td = new TextDecoder()

function zeros(n: number): Uint8Array { return new Uint8Array(n) }
function utf8(s: string): Uint8Array { return te.encode(s) }
function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0); out.set(b, a.length)
  return out
}
function isAllZero(b: Uint8Array): boolean { return b.every((x) => x === 0) }

// ---- bech32 密钥解析（与 P0-253-1 格式互通；独立实现避免回改已交付文件） ----
function fromWords(words: number[]): Uint8Array {
  const out: number[] = []
  let acc = 0
  let bits = 0
  for (const w of words) {
    acc = (acc << 5) | w
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((acc >>> bits) & 0xff)
    }
  }
  return new Uint8Array(out)
}

export function parsePublicKey(age1Key: string): Uint8Array {
  const d = bech32.decode(age1Key.trim())
  if (d.prefix !== 'age') throw new Error('公钥前缀必须是 age1')
  const bytes = fromWords(Array.from(d.words))
  if (bytes.length !== 32) throw new Error('公钥长度非法')
  return bytes
}

export function parseSecretKey(secretKey: string): Uint8Array {
  const d = bech32m.decode(secretKey.trim().toLowerCase())
  if (d.prefix !== 'age-secret-key-') throw new Error('私钥前缀必须是 AGE-SECRET-KEY-1')
  const bytes = fromWords(Array.from(d.words))
  if (bytes.length !== 32) throw new Error('私钥长度非法')
  return bytes
}

export function secretKeyToPublicKey(secretKeyBytes: Uint8Array): Uint8Array {
  return x25519.getPublicKey(secretKeyBytes)
}

// ---- canonical base64（RFC 4648 标准字母表、无填充、拒绝非规范输入） ----
export function b64encode(bytes: Uint8Array): string {
  return base64.encode(bytes).replace(/=+$/, '')
}

export function b64decode(s: string): Uint8Array {
  if (s.length % 4 === 1 || !/^[A-Za-z0-9+/]*$/.test(s)) throw new Error('base64 非规范编码')
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4)
  return base64.decode(padded)
}

function wrapB64(s: string, width = 64): string {
  const lines: string[] = []
  for (let i = 0; i < s.length; i += width) lines.push(s.slice(i, i + width))
  return lines.join('\n')
}

// ---- 载荷分块 nonce：11 字节大端块计数（自 0）+ 末字节 0x01=最后块 / 0x00=其余 ----
function chunkNonce(counter: number, isFinal: boolean): Uint8Array {
  const n = new Uint8Array(12)
  let c = counter
  for (let i = 10; i >= 0; i--) {
    n[i] = c & 0xff
    c = Math.floor(c / 256)
  }
  n[11] = isFinal ? 0x01 : 0x00
  return n
}

function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n))
}

// ---- 加密：只需公钥 ----
export function encryptWithPublicKey(plaintext: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array {
  const fileKey = randomBytes(FILE_KEY_SIZE)
  const ephSecret = x25519.keygen().secretKey
  const ephShare = x25519.getPublicKey(ephSecret)
  const shared = x25519.getSharedSecret(ephSecret, recipientPublicKey)
  if (isAllZero(shared)) throw new Error('共享密钥异常（低阶点）')
  const wrapKey = hkdf(sha256, shared, concat(ephShare, recipientPublicKey), utf8(INFO_WRAP), 32)
  const body = chacha20poly1305(wrapKey, zeros(12)).encrypt(fileKey)

  const headerNoMac = `${INTRO}\n-> X25519 ${b64encode(ephShare)}\n${wrapB64(b64encode(body))}\n`
  const macKey = hkdf(sha256, fileKey, zeros(32), utf8(INFO_HEADER), 32)
  const mac = hmac(sha256, macKey, utf8(headerNoMac))
  const header = `${headerNoMac}--- ${b64encode(mac)}\n`

  const payloadNonce = randomBytes(PAYLOAD_NONCE_SIZE)
  const payloadKey = hkdf(sha256, fileKey, payloadNonce, utf8(INFO_PAYLOAD), 32)
  const chunks: Uint8Array[] = []
  if (plaintext.length === 0) {
    chunks.push(chacha20poly1305(payloadKey, chunkNonce(0, true)).encrypt(plaintext))
  } else {
    let counter = 0
    for (let off = 0; off < plaintext.length; off += CHUNK_SIZE) {
      const end = Math.min(off + CHUNK_SIZE, plaintext.length)
      const isFinal = end === plaintext.length
      chunks.push(chacha20poly1305(payloadKey, chunkNonce(counter, isFinal)).encrypt(plaintext.slice(off, end)))
      counter += 1
    }
  }
  let ctLen = 0
  for (const c of chunks) ctLen += c.length
  const out = new Uint8Array(header.length + PAYLOAD_NONCE_SIZE + ctLen)
  out.set(utf8(header), 0)
  out.set(payloadNonce, header.length)
  let pos = header.length + PAYLOAD_NONCE_SIZE
  for (const c of chunks) { out.set(c, pos); pos += c.length }
  return out
}

// ---- 解密：需私钥；含文件头 MAC 与逐块 AEAD 校验，篡改即报错 ----
export function decryptWithSecretKey(fileBytes: Uint8Array, secretKeyBytes: Uint8Array): Uint8Array {
  // 解析文件头（文本行，直至 "--- " MAC 行）
  let headerEnd = -1
  let macB64 = ''
  const lines: string[] = []
  let pos = 0
  while (pos < fileBytes.length) {
    let nl = fileBytes.indexOf(0x0a, pos)
    if (nl === -1) throw new Error('文件头不完整（缺换行）')
    const line = td.decode(fileBytes.slice(pos, nl))
    lines.push(line)
    pos = nl + 1
    if (line.startsWith('--- ')) {
      macB64 = line.slice(4).trim()
      headerEnd = pos
      break
    }
    if (lines.length > 1000) throw new Error('文件头异常过长')
  }
  if (headerEnd === -1 || lines[0] !== INTRO) throw new Error('非 age v1 文件')
  // 文件头 MAC 覆盖范围：intro 到 "---" 行之前的全部字节
  const headerForMac = fileBytes.slice(0, headerEnd - lines[lines.length - 1].length - 1)

  // 收集 X25519 stanzas
  const stanzas: { arg: string; body: string }[] = []
  let i = 1
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('--- ')) break
    if (!line.startsWith('-> ')) throw new Error('文件头行格式非法')
    const parts = line.slice(3).split(' ')
    const bodyLines: string[] = []
    let j = i + 1
    while (j < lines.length && !lines[j].startsWith('-> ') && !lines[j].startsWith('--- ')) {
      bodyLines.push(lines[j]); j += 1
    }
    if (parts[0] === 'X25519' && parts.length === 2) {
      stanzas.push({ arg: parts[1], body: bodyLines.join('') })
    } // 非 X25519 stanza：吞掉 body 行后忽略（规范要求）
    i = j
  }
  if (stanzas.length === 0) throw new Error('文件头无可用 X25519 接收者')

  const recipient = secretKeyToPublicKey(secretKeyBytes)
  let fileKey: Uint8Array | null = null
  for (const st of stanzas) {
    const ephShare = b64decode(st.arg)
    const body = b64decode(st.body)
    if (ephShare.length !== 32 || body.length !== 32) continue
    const shared = x25519.getSharedSecret(secretKeyBytes, ephShare)
    if (isAllZero(shared)) continue
    const wrapKey = hkdf(sha256, shared, concat(ephShare, recipient), utf8(INFO_WRAP), 32)
    try {
      fileKey = chacha20poly1305(wrapKey, zeros(12)).decrypt(body)
      break
    } catch { /* 不匹配，尝试下一 stanza */ }
  }
  if (!fileKey) throw new Error('此私钥无法解开该文件（无匹配接收者）')

  const macKey = hkdf(sha256, fileKey, zeros(32), utf8(INFO_HEADER), 32)
  const expectMac = hmac(sha256, macKey, headerForMac)
  if (b64encode(expectMac) !== macB64) throw new Error('文件头校验失败（文件被篡改或非本工具产出）')

  const payloadNonce = fileBytes.slice(headerEnd, headerEnd + PAYLOAD_NONCE_SIZE)
  if (payloadNonce.length !== PAYLOAD_NONCE_SIZE) throw new Error('载荷不完整')
  const payloadKey = hkdf(sha256, fileKey, payloadNonce, utf8(INFO_PAYLOAD), 32)
  const ct = fileBytes.slice(headerEnd + PAYLOAD_NONCE_SIZE)
  if (ct.length === 0) throw new Error('载荷为空（缺少最后块）')

  const out: Uint8Array[] = []
  let counter = 0
  let off = 0
  while (off < ct.length) {
    const remaining = ct.length - off
    const isFinal = remaining <= CHUNK_SIZE + 16
    const size = isFinal ? remaining : CHUNK_SIZE + 16
    const chunk = ct.slice(off, off + size)
    try {
      out.push(chacha20poly1305(payloadKey, chunkNonce(counter, isFinal)).decrypt(chunk))
    } catch {
      throw new Error(`第 ${counter} 块校验失败（文件被篡改或截断）`)
    }
    off += size
    counter += 1
  }
  let total = 0
  for (const p of out) total += p.length
  const plain = new Uint8Array(total)
  let p2 = 0
  for (const p of out) { plain.set(p, p2); p2 += p.length }
  return plain
}

// ---- sha256 配套（.sha256 文件与校验） ----
export function sha256Hex(bytes: Uint8Array): string {
  return Array.from(sha256(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildSha256FileContent(hex: string, filename: string): string {
  return `${hex}  ${filename}\n`
}

export function parseSha256File(content: string): { hex: string; filename: string } {
  const m = content.trim().match(/^([0-9a-f]{64})\s+(.+)$/)
  if (!m) throw new Error('.sha256 文件格式非法')
  return { hex: m[1], filename: m[2] }
}
