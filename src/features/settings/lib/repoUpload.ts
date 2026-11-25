// P0-253-5 私仓上传：设置 owner/repo/token；上传 today-new.age/.sha256；维护 base-current+today-new 两份
// token 仅本机 localStorage 保存、绝不写日志/交付/仓库；断网失败产物保留可重试；不做监听/导入恢复/双向同步
import { TODAY_AGE_KEY, TODAY_SHA_KEY } from './changeQueue'

export const REPO_CFG_KEY = 'cdz_v3_repo_config'
const SYNC_DIR = 'sync'
const BASE_AGE = 'base-current.age'
const BASE_SHA = 'base-current.sha256'
const TODAY_AGE = 'today-new.age'
const TODAY_SHA = 'today-new.sha256'
const MAX_RETRY = 3

export interface RepoConfig {
  owner: string
  repo: string
  token: string
}

export function loadRepoConfig(): RepoConfig | null {
  try {
    const raw = localStorage.getItem(REPO_CFG_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as Partial<RepoConfig>
    if (!c.owner || !c.repo || !c.token) return null
    return { owner: c.owner, repo: c.repo, token: c.token }
  } catch { return null }
}

export function saveRepoConfig(cfg: RepoConfig): void {
  localStorage.setItem(REPO_CFG_KEY, JSON.stringify(cfg))
}

export const OWNER_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$|^[a-zA-Z0-9]$/
export const REPO_PATTERN = /^[a-zA-Z0-9._-]{1,100}$/

// P0-253-5 打回整改：owner/repo 白名单校验（R2535：不匹配则红条拒绝保存/拒绝上传）
export function validateRepoConfig(cfg: RepoConfig): string[] {
  const errors: string[] = []
  if (!OWNER_PATTERN.test(cfg.owner)) errors.push('owner 仅允许字母/数字/连字符且不超过 39 字符')
  if (!REPO_PATTERN.test(cfg.repo)) errors.push('repo 仅允许字母/数字/点/下划线/连字符且不超过 100 字符')
  if (!cfg.token.trim()) errors.push('token 不能为空')
  return errors
}

export interface UploadResult {
  ok: boolean
  error?: string
  uploaded?: string[]
  baseCreated?: boolean
}

type FetchImpl = typeof fetch

// 单文件 PUT（Contents API：先取 sha 再覆盖/新建）；错误分类绝不回显 token
async function putFile(cfg: RepoConfig, path: string, contentBase64: string, fetchImpl: FetchImpl): Promise<void> {
  const api = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`
  let sha: string | undefined
  const head = await fetchImpl(api, { headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github+json' } })
  if (head.status === 200) {
    const j = (await head.json()) as { sha?: string }
    sha = j.sha
  } else if (head.status !== 404) {
    if (head.status === 401 || head.status === 403) throw new Error('私仓 token 无效或权限不足（401/403）')
    if (head.status === 404 && path.startsWith(SYNC_DIR)) { /* 文件不存在=新建 */ } else throw new Error(`私仓不可访问（HTTP ${head.status}）`)
  }
  const body: Record<string, unknown> = {
    message: `sync: ${path.split('/').pop()}`,
    content: contentBase64,
    ...(sha ? { sha } : {}),
  }
  const put = await fetchImpl(api, {
    method: 'PUT',
    headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (put.status === 201 || put.status === 200) return
  if (put.status === 401 || put.status === 403) throw new Error('私仓 token 无效或权限不足（401/403）')
  if (put.status === 404) throw new Error('私仓不存在或无权访问（404）')
  if (put.status === 422) throw new Error('私仓拒绝写入（422，检查分支保护或路径冲突）')
  throw new Error(`私仓写入失败（HTTP ${put.status}）`)
}

// 上传主流程：today 两文件必传；私仓无 base 两文件时顺带建立（=首次基线）
export async function uploadSyncPackage(cfg: RepoConfig, fetchImpl: FetchImpl = fetch): Promise<UploadResult> {
  const cfgErrors = validateRepoConfig(cfg)
  if (cfgErrors.length > 0) return { ok: false, error: cfgErrors.join('；') }
  const age = localStorage.getItem(TODAY_AGE_KEY)
  const shaFile = localStorage.getItem(TODAY_SHA_KEY)
  if (!age || !shaFile) return { ok: false, error: '本机还没有今日密文包，请先在变更队列打包' }

  const uploaded: string[] = []
  let baseCreated = false
  try {
    await putFile(cfg, `${SYNC_DIR}/${TODAY_AGE}`, age, fetchImpl)
    uploaded.push(TODAY_AGE)
    await putFile(cfg, `${SYNC_DIR}/${TODAY_SHA}`, btoa(unescape(encodeURIComponent(shaFile))), fetchImpl)
    uploaded.push(TODAY_SHA)

    // base-current：GET 任一 base 文件判存在，不存在则以当前 today 内容建立基线
    const probe = await fetchImpl(
      `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${SYNC_DIR}/${BASE_AGE}`,
      { headers: { Authorization: `token ${cfg.token}`, Accept: 'application/vnd.github+json' } }
    )
    if (probe.status === 404) {
      await putFile(cfg, `${SYNC_DIR}/${BASE_AGE}`, age, fetchImpl)
      await putFile(cfg, `${SYNC_DIR}/${BASE_SHA}`, btoa(unescape(encodeURIComponent(shaFile))), fetchImpl)
      uploaded.push(BASE_AGE, BASE_SHA)
      baseCreated = true
    } else if (probe.status !== 200) {
      if (probe.status === 401 || probe.status === 403) throw new Error('私仓 token 无效或权限不足（401/403）')
      throw new Error(`私仓不可访问（HTTP ${probe.status}）`)
    }
    lastUpload = { at: new Date().toISOString(), uploaded, baseCreated, error: '' }
    return { ok: true, uploaded, baseCreated }
  } catch (e) {
    // 断网/失败：产物键原样保留（不丢密文），错误文案不含 token
    const msg = e instanceof Error ? e.message : '网络错误，密文已保留，可稍后重试'
    const friendly = /fetch|network|Failed/i.test(msg) ? '网络错误，密文已保留，可稍后重试' : msg
    lastUpload = { at: new Date().toISOString(), uploaded, baseCreated, error: friendly }
    return { ok: false, error: friendly, uploaded, baseCreated }
  }
}

interface LastUpload { at: string; uploaded: string[]; baseCreated: boolean; error: string }
let lastUpload: LastUpload | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryCount = 0

export function getLastUpload(): LastUpload | null { return lastUpload }
export function getRetryCount(): number { return retryCount }

// 断网自动重试：30s→60s→120s，最多 3 次；任何成功或人工上传即归零
export function scheduleRetryWithBackoff(cfg: RepoConfig): void {
  if (retryTimer) clearTimeout(retryTimer)
  if (retryCount >= MAX_RETRY) return
  const delay = 30_000 * 2 ** retryCount
  retryCount += 1
  retryTimer = setTimeout(() => {
    void uploadSyncPackage(cfg).then((r) => {
      if (r.ok) { retryCount = 0; if (retryTimer) clearTimeout(retryTimer); retryTimer = null }
      else scheduleRetryWithBackoff(cfg)
    })
  }, delay)
}

export function cancelRetry(): void {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryCount = 0
}
