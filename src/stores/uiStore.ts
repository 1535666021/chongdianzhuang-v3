import { create } from 'zustand'

interface UIState {
  activeTab: string
  /** P0-220：公司维度切换（统计/财务/对账），默认全部，持久化记住上次选择 */
  currentCompany: import('@/shared/utils/company').CompanyKey
  setCurrentCompany: (c: import('@/shared/utils/company').CompanyKey) => void
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  modal: { type: string; data?: any } | null
  setActiveTab: (tab: string) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
  openModal: (type: string, data?: any) => void
  closeModal: () => void
}

const COMPANY_KEY = 'cdz_current_company_v1'
const loadCompany = (): import('@/shared/utils/company').CompanyKey => {
  const v = localStorage.getItem(COMPANY_KEY)
  return v === 'benyang' || v === 'daomei' ? v : 'all'
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'orders',
  currentCompany: loadCompany(),
  setCurrentCompany: (c) => {
    localStorage.setItem(COMPANY_KEY, c)
    set({ currentCompany: c })
  },
  toast: null,
  modal: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: null }),
}))
