"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Sidebar } from './sidebar-container'
import { RightSidebar } from './right-sidebar'
import { useUIStore } from '@/store/bookmark-store'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, Settings } from 'lucide-react'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const folders = useQuery(api.folders.list) || []
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { setActiveFolder } = useUIStore()

  const isTrashView = pathname === '/trash'
  const isSettingsPage = pathname === '/settings'
  const setTrashView = () => {}

  // Derive active folder from URL so direct navigation + back/forward works
  const folderMatch = pathname.match(/^\/folder\/([^/?]+)/)
  const activeFolderFromUrl = folderMatch ? folderMatch[1] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-40 px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Image
            src="/rendium.png"
            alt="Rendium"
            width={24}
            height={24}
            priority
          />
          <span className="font-semibold">Rendium</span>
        </div>

        <Link href="/settings">
          <Button
            variant={isSettingsPage ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="flex h-screen overflow-hidden relative">
        <Sidebar
          activeFolder={activeFolderFromUrl}
          setActiveFolder={setActiveFolder}
          folders={folders}
          isTrashView={isTrashView}
          setTrashView={setTrashView}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto pt-14 md:pt-0 px-4 md:px-6 md:pl-72 lg:pr-80 xl:pr-[22rem]">
          <div className="max-w-7xl mx-auto py-4">
            {children}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  )
}
