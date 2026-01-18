"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Pin, Trash2, Link as LinkIcon, Copy, Check, RotateCcw, XCircle, ExternalLink, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from "@/components/ui/context-menu"

interface BookmarkItemProps {
  bookmark: {
    _id: Id<'bookmarks'>
    title: string
    url: string
    description?: string
    ogImage?: string
    pinned: boolean
    folderId?: Id<'folders'>
  }
  viewMode: 'grid' | 'list' | 'detailed'
  folderName?: string | null
  isTrashView?: boolean
}

export function BookmarkItem({ bookmark, viewMode, folderName, isTrashView = false }: BookmarkItemProps) {
  const [copied, setCopied] = useState(false)
  const togglePin = useMutation(api.bookmarks.togglePin)
  const moveToTrash = useMutation(api.bookmarks.moveToTrash)
  const restoreFromTrash = useMutation(api.bookmarks.restoreFromTrash)
  const removePermanently = useMutation(api.bookmarks.remove)
  const moveToFolder = useMutation(api.bookmarks.moveToFolder)
  const folders = useQuery(api.folders.list) || []
  
  const domain = new URL(bookmark.url).hostname
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

  const handleCardClick = () => {
    if (!isTrashView) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  const onActionClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleCopy = (e?: React.MouseEvent | React.BaseSyntheticEvent) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(bookmark.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ActionButtons = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1 ${className}`} onClick={onActionClick}>
      {isTrashView ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => restoreFromTrash({ id: bookmark._id })}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restore</TooltipContent>
          </Tooltip>
          
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete permanently</TooltipContent>
            </Tooltip>
            <AlertDialogContent onClick={onActionClick}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. This bookmark will be gone forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => removePermanently({ id: bookmark._id })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy URL"}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin({ id: bookmark._id, pinned: !bookmark.pinned })}>
                <Pin className={`h-4 w-4 ${bookmark.pinned ? 'fill-current text-primary' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{bookmark.pinned ? "Unpin" : "Pin"}</TooltipContent>
          </Tooltip>
          
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Move to Trash</TooltipContent>
            </Tooltip>
            <AlertDialogContent onClick={onActionClick}>
              <AlertDialogHeader>
                <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
                <AlertDialogDescription>You can still restore it later from the Trash folder.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => moveToTrash({ id: bookmark._id })}>Move</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )

  const cardStyle = `group relative transition-all duration-200 ${
    isTrashView ? 'opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100' : ''
  }`

  const renderBaseContent = () => {
    if (viewMode === 'grid') {
      return (
        <Card 
          className={`${cardStyle} h-full flex flex-col overflow-hidden gap-4 p-0 ${!isTrashView ? 'cursor-pointer hover:shadow-lg' : ''}`}
          onClick={handleCardClick}
        >
          <div className="w-full h-32 overflow-hidden bg-muted relative flex items-center justify-center">
            {bookmark.ogImage ? (
              <Image src={bookmark.ogImage} alt="" fill unoptimized className="object-cover transition-transform" />
            ) : (
              <LinkIcon className="text-muted-foreground/20 size-8" />
            )}
          </div>
          <CardContent className="p-4 pt-0 space-y-2">
            <CardTitle className="text-sm truncate flex-1 mr-2 flex items-center gap-2">
              <Image src={faviconUrl} alt="" width={16} height={16} unoptimized className="flex-shrink-0" />
              <span>{bookmark.title}</span>
            </CardTitle>
            {bookmark.description && <CardDescription className="line-clamp-2 text-xs mt-1">{bookmark.description}</CardDescription>}
            <p className="text-[11px] text-muted-foreground truncate">{domain}</p>
            {folderName && <Badge variant="outline" className="mt-2 text-[9px] h-4">{folderName}</Badge>}
          </CardContent>
          <ActionButtons className="absolute top-3 right-3 rounded-lg bg-background/90 backdrop-blur-sm border shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
        </Card>
      )
    }

    if (viewMode === 'detailed') {
      return (
        <div 
          className={`${cardStyle} flex flex-col sm:flex-row gap-4 p-3 rounded-xl border bg-card hover:bg-accent/50 ${!isTrashView ? 'cursor-pointer' : ''}`}
          onClick={handleCardClick}
        >
          <div className="w-full sm:w-40 h-24 sm:h-32 rounded-lg overflow-hidden bg-muted border flex-shrink-0 relative flex items-center justify-center">
            {bookmark.ogImage ? (
              <Image src={bookmark.ogImage} alt="" fill unoptimized className="object-cover transition-transform" />
            ) : (
              <LinkIcon className="text-muted-foreground/20 size-8" />
            )}
          </div>

          <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <Image src={faviconUrl} width={16} height={16} unoptimized alt="" className="flex-shrink-0" />
              <h3 className="font-semibold text-base truncate">{bookmark.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bookmark.description || bookmark.url}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground truncate">{domain}</p>
              {folderName && <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">{folderName}</Badge>}
            </div>
          </div>

          <ActionButtons className="absolute top-3 right-3 rounded-lg bg-background/90 backdrop-blur-sm border shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
        </div>
      )
    }

    return (
      <div 
        className={`${cardStyle} flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 ${!isTrashView ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <Image src={faviconUrl} width={16} height={16} unoptimized alt="" className="flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{bookmark.url}</p>
          </div>
          {folderName && <Badge variant="outline" className="text-[9px] h-4 px-1">{folderName}</Badge>}
        </div>
        
        <ActionButtons className="absolute right-3 rounded-lg bg-background/90 backdrop-blur-sm border shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
      </div>
    )
  }

  return (
    <AlertDialog>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="h-full">
            {renderBaseContent()}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {!isTrashView ? (
            <>
              <ContextMenuItem onClick={handleCardClick}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Link
              </ContextMenuItem>
              <ContextMenuItem onClick={handleCopy}>
                {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy URL"}
              </ContextMenuItem>
              <ContextMenuItem onClick={() => togglePin({ id: bookmark._id, pinned: !bookmark.pinned })}>
                <Pin className={`mr-2 h-4 w-4 ${bookmark.pinned ? 'fill-current text-primary' : ''}`} />
                {bookmark.pinned ? "Unpin" : "Pin"}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Folder className="mr-2 h-4 w-4" />
                  Move to Folder
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48 p-0">
                  <Command>
                    <CommandInput placeholder="Search folders..." autoFocus={true} className="h-9" />
                    <CommandList>
                      <CommandEmpty>No folders found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            moveToFolder({ id: bookmark._id, folderId: undefined })
                          }}
                        >
                          <div className={`mr-2 h-2 w-2 rounded-full bg-gray-400`} />
                          None (Unassigned)
                          {bookmark.folderId === undefined && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                        {folders.map((folder) => (
                          <CommandItem
                            key={folder._id}
                            onSelect={() => {
                              moveToFolder({ id: bookmark._id, folderId: folder._id })
                            }}
                          >
                            <div 
                              className={`mr-2 h-2 w-2 rounded-full ${
                                folder.color === 'red' ? 'bg-red-500' :
                                folder.color === 'orange' ? 'bg-orange-500' :
                                folder.color === 'yellow' ? 'bg-yellow-500' :
                                folder.color === 'green' ? 'bg-green-500' :
                                folder.color === 'blue' ? 'bg-blue-500' :
                                folder.color === 'purple' ? 'bg-purple-500' :
                                folder.color === 'pink' ? 'bg-pink-500' :
                                'bg-gray-400'
                              }`} 
                            />
                            {folder.name}
                            {bookmark.folderId === folder._id && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <AlertDialogTrigger asChild>
                <ContextMenuItem variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to Trash
                </ContextMenuItem>
              </AlertDialogTrigger>
            </>
          ) : (
            <>
              <ContextMenuItem onClick={() => restoreFromTrash({ id: bookmark._id })}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </ContextMenuItem>
              <ContextMenuSeparator />
              <AlertDialogTrigger asChild>
                <ContextMenuItem variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Delete Permanently
                </ContextMenuItem>
              </AlertDialogTrigger>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isTrashView ? "Delete permanently?" : "Move to Trash?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isTrashView 
              ? "This action is irreversible. This bookmark will be gone forever." 
              : "You can still restore it later from the Trash folder."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => isTrashView ? removePermanently({ id: bookmark._id }) : moveToTrash({ id: bookmark._id })}
            className={isTrashView ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isTrashView ? "Delete" : "Move"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}