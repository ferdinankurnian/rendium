"use client"

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Sidebar } from './sidebar-container'
import { RightSidebar } from './right-sidebar'
import { useUIStore } from '@/store/bookmark-store'
import { usePathname } from 'next/navigation'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const folders = useQuery(api.folders.list) || []
  const pathname = usePathname()
  
  const { setActiveFolder } = useUIStore()
  
  const isTrashView = pathname === '/trash'
  const setTrashView = () => {}

  // Derive active folder from URL so direct navigation + back/forward works
  const folderMatch = pathname.match(/^\/folder\/([^/?]+)/)
  const activeFolderFromUrl = folderMatch ? folderMatch[1] : null
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden relative">
        <Sidebar
          activeFolder={activeFolderFromUrl}
          setActiveFolder={setActiveFolder}
          folders={folders}
          isTrashView={isTrashView}
          setTrashView={setTrashView}
        />
        
        <main className="flex-1 overflow-y-auto px-4 md:pl-72 xl:pr-88">
          <div className="max-w-7xl mx-auto py-4">
            {children}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
