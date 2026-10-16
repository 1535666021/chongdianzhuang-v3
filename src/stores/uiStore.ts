import { create } from 'zustand'

interface UIState {
  activeTab: string
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  modal: { type: string; data?: any } | null
  setActiveTab: (tab: string) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
  openModal: (type: string, data?: any) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'orders',
  toast: null,
  modal: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: null }),
}))
