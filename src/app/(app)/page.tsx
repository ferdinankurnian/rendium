"use client"

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Search, BookOpen, List, LayoutGrid, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useUIStore } from '@/store/bookmark-store'
import { AddBookmarkPopover } from '@/components/add-bookmark-popover'
import { BookmarkItem } from '@/components/bookmark-item'
import { Spinner } from '@/components/ui/spinner'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { searchQuery, setSearchQuery, viewMode, setViewMode } = useUIStore()
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const bookmarks = useQuery(api.bookmarks.list, {})
  const folders = useQuery(api.folders.list) || []
  
  const filtered = bookmarks?.filter(b => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return b.title.toLowerCase().includes(q) || 
           b.url.toLowerCase().includes(q) || 
           b.description?.toLowerCase().includes(q)
  })

  const pinnedBookmarks = filtered?.filter(b => b.pinned) || []
  const unpinnedBookmarks = filtered?.filter(b => !b.pinned) || []
  
  const getFolderName = (folderId?: Id<'folders'>) => {
    if (!folderId) return null
    return folders.find(f => f._id === folderId)?.name
  }

  const activeViewMode = mounted ? viewMode : 'grid'

  const toggleViewMode = () => {
    if (activeViewMode === 'grid') setViewMode('list')
    else if (activeViewMode === 'list') setViewMode('detailed')
    else setViewMode('grid')
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">All Bookmarks</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleViewMode} title="Cycle view mode">
            {activeViewMode === 'grid' && <LayoutGrid className="h-5 w-5" />}
            {activeViewMode === 'list' && <List className="h-5 w-5" />}
            {activeViewMode === 'detailed' && <Rows3 className="h-5 w-5" />}
          </Button>
          <AddBookmarkPopover />
        </div>
      </header>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input type="search" placeholder="Search bookmarks..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      
      {bookmarks === undefined ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pinnedBookmarks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">Pinned</h2>
              <div className={activeViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                {pinnedBookmarks.map((b) => (
                  <BookmarkItem key={b._id} bookmark={b} viewMode={activeViewMode} folderName={getFolderName(b.folderId)} />
                ))}
              </div>
            </div>
          )}
          
          <div className={activeViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {unpinnedBookmarks.length > 0 ? (
              unpinnedBookmarks.map((b) => (
                <BookmarkItem key={b._id} bookmark={b} viewMode={activeViewMode} folderName={getFolderName(b.folderId)} />
              ))
            ) : (
              pinnedBookmarks.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No bookmarks yet. Add your first one or{' '}
                    <Link href="/settings" className="text-primary hover:underline underline-offset-4">
                      import
                    </Link>{' '}
                    from browser!
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}