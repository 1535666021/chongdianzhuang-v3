import { create } from 'zustand'

interface ParserState {
  config: Record<string, string>
  lastResult: string | null
  setConfig: (config: Record<string, string>) => void
  setLastResult: (result: string | null) => void
}

export const useParserStore = create<ParserState>((set) => ({
  config: {},
  lastResult: null,
  setConfig: (config) => set({ config }),
  setLastResult: (result) => set({ lastResult: result }),
}))
