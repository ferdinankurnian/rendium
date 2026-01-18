"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  color: z.string().optional(),
})

type FolderFormValues = z.infer<typeof folderSchema>

export function AddFolderPopover() {
  const createFolder = useMutation(api.folders.create)
  const [open, setOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState('')
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
  })
  
  const onSubmit = async (data: FolderFormValues) => {
    try {
      await createFolder({
        name: data.name,
        color: selectedColor,
      })
      reset()
      setSelectedColor('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to add folder:', error)
    }
  }
  
  const handleClose = () => {
    reset()
    setSelectedColor('')
    setOpen(false)
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
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Add Folder</h3>
            <p className="text-sm text-muted-foreground">
              Create a new folder to organize your bookmarks
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Folder Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Work, Reading, Personal"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
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
                      onClick={() => {
                        setSelectedColor(color.value)
                        setValue('color', color.value)
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  Create Folder
                </Button>
              </div>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  )
}
