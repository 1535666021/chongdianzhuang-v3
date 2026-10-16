import { useState } from 'react'
import { X, Upload, Copy, Hand, Trash2, ChevronRight } from 'lucide-react'
import { APP_VERSION } from '@/constants/common'
import './OnboardingGuide.css'

/** P0-146：首次功能引导——按版本号只做一次（净装/存量升级均弹一次当前版本） */
const ONBOARDING_VERSION = `onboard-v${APP_VERSION}`
const SEEN_KEY = 'cdz_onboarding_seen'

const STEPS = [
  { icon: Upload, title: '导入订单', desc: '设置 → 数据导入，从老系统一键迁移订单数据' },
  { icon: Copy, title: '点按复制', desc: '点姓名/电话/地址直接复制，长按也有更多操作' },
  { icon: Hand, title: '左滑快捷', desc: '订单卡左滑露出拨号 / 改约 / 删除' },
  { icon: Trash2, title: '回收站兜底', desc: '删除先进回收站，3秒内可撤销误删' },
] as const

export default function OnboardingGuide() {
  const [step, setStep] = useState<number>(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === ONBOARDING_VERSION ? -1 : 0
    } catch {
      return -1
    }
  })
  const finish = () => {
    try { localStorage.setItem(SEEN_KEY, ONBOARDING_VERSION) } catch { /* 静默 */ }
    setStep(-1)
  }
  if (step < 0 || step >= STEPS.length) return null
  const S = STEPS[step]
  const isLast = step === STEPS.length - 1
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button type="button" className="onboarding-skip" onClick={finish}><X size={16} /> 跳过</button>
        <div className="onboarding-icon"><S.icon size={40} /></div>
        <h2 className="onboarding-title">{S.title}</h2>
        <p className="onboarding-desc">{S.desc}</p>
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'onboarding-dot onboarding-dot--active' : 'onboarding-dot'} />
          ))}
        </div>
        <button type="button" className="onboarding-next" onClick={() => (isLast ? finish() : setStep(step + 1))}>
          {isLast ? '开始使用' : '下一步'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
