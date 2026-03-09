"use client"

import { BookOpen, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { AddFolderPopover } from '@/components/add-folder-popover'
import { FolderItem } from '@/components/folder-item'
import { Doc } from '@/convex/_generated/dataModel'
import { Spinner } from '@/components/ui/spinner'

interface SidebarContentProps {
  folders: Doc<"folders">[]
  onNavigate?: () => void
}

export function SidebarContent({
  folders,
  onNavigate,
}: SidebarContentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isPending, startTransition] = useTransition()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  const pathname = location.pathname
  const activeFolder = pathname.startsWith('/folder/')
    ? pathname.split('/')[2] ?? null
    : null
  const isAllBookmarksPage = pathname === '/'
  const isTrashPage = pathname === '/trash'
  const isFolderView = pathname.startsWith('/folder/')

  const handleNavigate = (path: string) => {
    if (path === pathname + location.search) {
      onNavigate?.()
      return
    }

    setPendingPath(path)
    startTransition(() => {
      navigate(path)
      onNavigate?.()
    })
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        <Button
          variant={isAllBookmarksPage ? 'secondary' : 'ghost'}
          className="w-full justify-start mb-1"
          disabled={isPending}
          onClick={() => handleNavigate('/')}
        >
          {isPending && pendingPath === '/' ? (
            <Spinner className="mr-2" />
          ) : (
            <BookOpen className="h-4 w-4 mr-2" />
          )}
          All Bookmarks
        </Button>
        <Button
            variant={isTrashPage ? 'secondary' : 'ghost'}
            className={`w-full justify-start ${isTrashPage ? 'text-destructive' : ''}`}
            disabled={isPending}
            onClick={() => handleNavigate('/trash')}
          >
            {isPending && pendingPath === '/trash' ? (
              <Spinner className="mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Trash
          </Button>
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Folders</span>
            <AddFolderPopover />
          </div>
          {folders.map((folder) => {
            const folderPath = `/folder/${folder._id}?n=${encodeURIComponent(folder.name)}`
            return (
              <FolderItem
                key={folder._id}
                folder={folder}
                isActive={isFolderView && activeFolder === folder._id}
                isLoading={isPending && pendingPath === folderPath}
                onClick={() => handleNavigate(folderPath)}
              />
            )
          })}
          {folders.length === 0 && (
            <p className="text-sm text-muted-foreground px-2">No folders yet</p>
          )}
        </div>
      
      </div>
    </div>
  )
}
