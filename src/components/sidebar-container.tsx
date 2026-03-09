"use client"

import Image from 'next/image'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useTransition } from 'react'

import { SidebarContent } from './sidebar'
import { Doc } from '@/convex/_generated/dataModel'
import { ThemeToggle } from '@/components/theme-toggle'
import { Spinner } from '@/components/ui/spinner'

interface SidebarProps {
  folders: Doc<"folders">[]
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function Sidebar({
  folders,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isPending, startTransition] = useTransition()

  const isSettingsPage = location.pathname === '/settings'

  const handleSettingsClick = () => {
    startTransition(() => {
      navigate('/settings')
      setMobileOpen(false)
    })
  }

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
            folders={folders}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="mt-auto p-2 flex flex-row justify-between items-center">
            <ThemeToggle />
            <Button
              variant={isSettingsPage ? 'secondary' : 'ghost'}
              size="icon"
              onClick={handleSettingsClick}
              disabled={isPending}
            >
              {isPending ? <Spinner /> : <Settings />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
            folders={folders}
            onNavigate={() => setMobileOpen(false)}
          />
          <div className="mt-auto p-2 flex flex-row justify-between items-center">
            <ThemeToggle />
            <Button
              variant={isSettingsPage ? 'secondary' : 'ghost'}
              size="icon"
              onClick={handleSettingsClick}
              disabled={isPending}
            >
              {isPending ? <Spinner /> : <Settings />}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
