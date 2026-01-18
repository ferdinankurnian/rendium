"use client"

import { BookOpen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddFolderPopover } from '@/components/add-folder-popover'
import { FolderItem } from '@/components/folder-item'
import { Doc } from '@/convex/_generated/dataModel'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarContentProps {
  activeFolder: string | null
  setActiveFolder: (folderId: string | null) => void
  folders: Doc<"folders">[]
  isTrashView: boolean
  setTrashView: (isTrash: boolean) => void
}

export function SidebarContent({
  activeFolder,
  setActiveFolder,
  folders,
  isTrashView,
  setTrashView,
}: SidebarContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const isAllBookmarksPage = pathname === '/'
  const isTrashPage = pathname === '/trash'
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        <Button
          variant={isAllBookmarksPage ? 'secondary' : 'ghost'}
          className="w-full justify-start mb-1"
          onClick={() => {
            setActiveFolder(null)
            router.push('/')
          }}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          All Bookmarks
        </Button>
        <Button
            variant={isTrashPage ? 'secondary' : 'ghost'}
            className={`w-full justify-start ${isTrashPage ? 'text-destructive' : ''}`}
            onClick={() => {
              setActiveFolder(null)
              setTrashView(!isTrashView)
              router.push('/trash')
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Trash
          </Button>
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-sm font-semibold text-muted-foreground">Folders</span>
            <AddFolderPopover />
          </div>
          {folders.map((folder) => (
            <FolderItem
              key={folder._id}
              folder={folder}
              isActive={!isTrashView && activeFolder === folder._id}
              onClick={() => {
                setActiveFolder(folder._id)
                router.push(`/folder/${folder._id}?n=${encodeURIComponent(folder.name)}`)
              }}
            />
          ))}
          {folders.length === 0 && (
            <p className="text-sm text-muted-foreground px-2">No folders yet</p>
          )}
        </div>
      
      </div>
    </div>
  )
}
