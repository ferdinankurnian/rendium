"use client"

import { useState } from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"

interface FolderItemProps {
  folder: Doc<"folders">
  isActive: boolean
  onClick: () => void
}

export function FolderItem({ folder, isActive, onClick }: FolderItemProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [newName, setNewName] = useState(folder.name)
  const [selectedColor, setSelectedColor] = useState(folder.color || '')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const updateFolder = useMutation(api.folders.update)
  const removeFolder = useMutation(api.folders.remove)
  
  const handleUpdate = async () => {
    if (!newName.trim()) return
    
    try {
      await updateFolder({ 
        id: folder._id, 
        name: newName.trim(),
        color: selectedColor 
      })
      setIsPopoverOpen(false)
    } catch (error) {
      console.error("Failed to update folder:", error)
    }
  }

  const handleClose = () => {
    setNewName(folder.name)
    setSelectedColor(folder.color || '')
    setIsPopoverOpen(false)
  }
  
  const handleDelete = async () => {
    try {
      await removeFolder({ id: folder._id })
    } catch (error) {
      console.error("Failed to delete folder:", error)
    }
  }

  const colors = [
    { value: '', label: 'Default', bg: 'bg-gray-200', border: 'border-gray-300', darkBg: 'dark:bg-gray-700', darkBorder: 'dark:border-gray-600' },
    { value: 'red', label: 'Red', bg: 'bg-red-500', border: 'border-red-500' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', border: 'border-orange-500' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', border: 'border-yellow-500' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', border: 'border-pink-500' },
  ]

  const colorMap = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <ContextMenu>
          <PopoverAnchor asChild>
            <ContextMenuTrigger>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1 group relative"
                onClick={onClick}
              >
                <div className="flex items-center gap-2 mr-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      folder.color && colorMap[folder.color as keyof typeof colorMap] ? colorMap[folder.color as keyof typeof colorMap] : 'bg-gray-400'
                    }`}
                  />
                </div>
                <span className="truncate flex-1 text-left">{folder.name}</span>
              </Button>
            </ContextMenuTrigger>
          </PopoverAnchor>
          <ContextMenuContent 
            className="w-48" 
            onCloseAutoFocus={(e) => {
              if (isPopoverOpen) e.preventDefault()
            }}
          >
            <ContextMenuItem onSelect={() => {
              setTimeout(() => {
                setIsPopoverOpen(true)
              }, 100)
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Folder
            </ContextMenuItem>
            <ContextMenuItem className="text-destructive" onSelect={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <PopoverContent 
          className="w-80" 
          align="start" 
          side="right" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Prevent accidental closing while interacting with the form
            if (e.target instanceof Element && e.target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault()
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Edit Folder</h3>
              <p className="text-sm text-muted-foreground">
                Update folder name and color
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Folder Name</Label>
                <Input
                  id="edit-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Work, Reading, Personal"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color Tag</Label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color.value || 'default'}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 ${color.bg} ${color.border} ${color.darkBg} ${color.darkBorder} hover:scale-110 transition-transform ${
                        selectedColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      title={color.label}
                      onClick={() => setSelectedColor(color.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="flex-1">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{folder.name}&quot;? The bookmarks inside won&apos;t be deleted, they will just become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}