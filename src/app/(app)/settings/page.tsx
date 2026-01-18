"use client"

import { Moon, Sun, Monitor, Download, Trash2, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/components/theme-provider'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRef, useState } from 'react'
import { Id } from 'convex/values'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{ title: string, message: string } | null>(null)
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)
  const [isClearingAllData, setIsClearingAllData] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  const bookmarks = useQuery(api.bookmarks.list, {}) || []
  const trashBookmarks = useQuery(api.bookmarks.listTrash) || []
  const folders = useQuery(api.folders.list) || []
  
  const createFolder = useMutation(api.folders.create)
  const createBookmark = useMutation(api.bookmarks.create)
  const removePermanently = useMutation(api.bookmarks.remove)
  const removeFolder = useMutation(api.folders.remove)

  const handleExport = () => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`

    // Add Folders and their bookmarks
    folders.forEach(folder => {
      html += `    <DT><H3 ADD_DATE="${Math.floor(folder.createdAt / 1000)}" LAST_MODIFIED="0"${folder.color ? ` COLOR="${folder.color}"` : ''}>${folder.name}</H3>\n`
      html += `    <DL><p>\n`
      
      const folderBookmarks = bookmarks.filter(b => b.folderId === folder._id)
      folderBookmarks.forEach(b => {
        html += `        <DT><A HREF="${b.url}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${b.title}</A>\n`
      })
      
      html += `    </DL><p>\n`
    })

    // Add unassigned bookmarks (including those in folders that no longer exist)
    const validFolderIds = folders.map(f => f._id)
    const unassigned = bookmarks.filter(b => !b.folderId || !validFolderIds.includes(b.folderId))
    
    unassigned.forEach(b => {
      html += `    <DT><A HREF="${b.url}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${b.title}</A>\n`
    })

    html += `</DL><p>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rendium-bookmarks-${new Date().toISOString().split('T')[0]}.html`
    a.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(content, "text/html")
        // Only get DTs that contain an anchor AND do NOT contain an H3 (to avoid folder containers)
        const dts = Array.from(doc.querySelectorAll('dt')).filter(dt => 
          dt.querySelector('a') && !dt.querySelector('h3')
        )
        
        const folderCache: Record<string, string> = {}
        let importCount = 0
        
        for (const dt of dts) {
          const a = dt.querySelector('a')
          if (a) {
            const url = a.getAttribute('href') || ''
            const title = a.textContent || ''
            
            // Find the closest folder name by walking up to the nearest DL's H3
            let folderName = ''
            let folderColor = ''
            let parent = dt.parentElement
            while (parent && parent.tagName !== 'HTML') {
              if (parent.tagName === 'DL') {
                // The H3 for this DL is usually inside the previous DT sibling
                const prev = parent.previousElementSibling
                const h3 = prev?.querySelector('h3') || (prev?.tagName === 'H3' ? prev : null)
                if (h3) {
                  folderName = h3.textContent || ''
                  folderColor = h3.getAttribute('color') || ''
                  break
                }
              }
              parent = parent.parentElement
            }

            let folderId: Id<"folders"> | undefined = undefined
            const systemFolders = ['Bookmarks bar', 'Other bookmarks', 'Mobile bookmarks', 'Bookmarks']
            if (folderName && !systemFolders.includes(folderName)) {
              if (folderCache[folderName]) {
                folderId = folderCache[folderName] as Id<"folders">
              } else {
                folderId = await createFolder({ name: folderName, color: folderColor })
                folderCache[folderName] = folderId
              }
            }

            await createBookmark({
              url,
              title,
              pinned: false,
              folderId: folderId
            })
            importCount++
          }
        }
        setImportStatus({
          title: "Import Successful",
          message: `Successfully imported ${importCount} bookmarks from your HTML file.`
        })
      } catch (err) {
        console.error('Import failed:', err)
        setImportStatus({
          title: "Import Failed",
          message: "Failed to import data. Make sure it is a valid HTML bookmark file."
        })
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true)
    try {
      for (const b of trashBookmarks) {
        await removePermanently({ id: b._id })
      }
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  const handleClearAllData = async () => {
    setIsClearingAllData(true)
    try {
      // Delete all bookmarks (active + trash)
      const allBookmarks = [...bookmarks, ...trashBookmarks]
      for (const b of allBookmarks) {
        await removePermanently({ id: b._id })
      }
      // Delete all folders
      for (const f of folders) {
        await removeFolder({ id: f._id })
      }
    } finally {
      setIsClearingAllData(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}><Sun className="h-4 w-4 mr-2" /> Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}><Moon className="h-4 w-4 mr-2" /> Dark</Button>
            <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}><Monitor className="h-4 w-4 mr-2" /> System</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Data Management</CardTitle>
          <CardDescription>Export your data as HTML or import from a browser bookmark file</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleExport} variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export HTML</Button>
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={isImporting}>
            {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import HTML
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".html"
            className="hidden"
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <h3 className="font-medium">Empty Trash</h3>
              <p className="text-sm text-muted-foreground">Permanently delete {trashBookmarks.length} items</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={trashBookmarks.length === 0 || isEmptyingTrash}>
                  {isEmptyingTrash ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {trashBookmarks.length} items in your trash. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isEmptyingTrash}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleEmptyTrash} 
                    disabled={isEmptyingTrash}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isEmptyingTrash ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Empty Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
            <div className="space-y-0.5">
              <h3 className="font-medium text-destructive">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">Delete all bookmarks and folders permanently</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={isClearingAllData}>
                  {isClearingAllData ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete everything?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will wipe all your bookmarks and folders. You will lose everything permanently. We highly recommend exporting your data first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearingAllData}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearAllData} 
                    disabled={isClearingAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClearingAllData ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!importStatus} onOpenChange={(open) => !open && setImportStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{importStatus?.title}</AlertDialogTitle>
            <AlertDialogDescription>{importStatus?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setImportStatus(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
