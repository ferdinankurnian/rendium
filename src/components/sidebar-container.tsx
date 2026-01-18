"use client"

import Image from 'next/image'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { FolderOpen, Settings } from 'lucide-react'
import { SidebarContent } from './sidebar'
import { Doc } from '@/convex/_generated/dataModel'
import { ThemeToggle } from '@/components/theme-toggle'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarProps {
  activeFolder: string | null
  setActiveFolder: (folderId: string | null) => void
  folders: Doc<"folders">[]
  isTrashView: boolean
  setTrashView: (isTrash: boolean) => void
}

export function Sidebar({
  activeFolder,
  setActiveFolder,
  folders,
  isTrashView,
  setTrashView,
}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isSettingsPage = pathname === '/settings'

  return (
    <>
      {/* Floating Sidebar for Desktop */}
      <div className="hidden md:block">
        <div className="flex flex-col fixed left-4 top-4 bottom-4 w-64 border rounded-lg bg-card shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-2">
            <Image 
              src="/rendium.png" 
              alt="Rendium" 
              width={32}
              height={32}
              priority
            />
          </div>
          <SidebarContent 
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            folders={folders}
            isTrashView={isTrashView}
            setTrashView={setTrashView}
          />
          <div className="mt-auto p-2 flex flex-row justify-between">
            <ThemeToggle />
            <Button 
              variant={isSettingsPage ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => router.push('/settings')}
            >
              <Settings />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <FolderOpen className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 flex items-center gap-2">
            <Image 
              src="/rendium.png" 
              alt="Rendium" 
              width={32}
              height={32}
            />
          </div>
          <SidebarContent 
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            folders={folders}
            isTrashView={isTrashView}
            setTrashView={setTrashView}
          />
          <div className="mt-auto p-2 flex flex-row justify-between">
            <ThemeToggle />
            <Button 
              variant={isSettingsPage ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => router.push('/settings')}
            >
              <Settings />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
