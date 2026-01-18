import { create } from 'zustand'

const VIEW_MODE_KEY = 'rendium-view-mode'

function getStoredViewMode(): 'grid' | 'list' | 'detailed' {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    if (stored === 'grid' || stored === 'list' || stored === 'detailed') {
      return stored
    }
  }
  return 'grid'
}

function setStoredViewMode(mode: 'grid' | 'list' | 'detailed') {
  if (typeof window !== 'undefined') {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }
}

interface UIStore {
  searchQuery: string
  activeFolder: string | null
  viewMode: 'grid' | 'list' | 'detailed'
  
  setSearchQuery: (query: string) => void
  setActiveFolder: (folderId: string | null) => void
  setViewMode: (mode: 'grid' | 'list' | 'detailed') => void
}

export const useUIStore = create<UIStore>((set) => ({
  searchQuery: '',
  activeFolder: null,
  viewMode: getStoredViewMode(),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolder: (folderId) => set({ activeFolder: folderId }),
  setViewMode: (mode) => {
    setStoredViewMode(mode)
    set({ viewMode: mode })
  },
}))