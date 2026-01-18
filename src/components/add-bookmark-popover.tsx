"use client"

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2 } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const bookmarkSchema = z.object({
  title: z.string().optional(),
  url: z.string().url('Invalid URL'),
  description: z.string().optional(),
  folderId: z.string().optional(),
})

type BookmarkFormValues = z.infer<typeof bookmarkSchema>

interface AddBookmarkPopoverProps {
  initialFolderId?: string
}

export function AddBookmarkPopover({ initialFolderId }: AddBookmarkPopoverProps) {
  const [open, setOpen] = useState(false)
  const [ogImage, setOgImage] = useState<string | undefined>()
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  
  const folders = useQuery(api.folders.list) || []
  const createBookmark = useMutation(api.bookmarks.create)
  
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      folderId: initialFolderId || 'none',
    }
  })

  useEffect(() => {
    if (initialFolderId) {
      setValue('folderId', initialFolderId)
    } else {
      setValue('folderId', 'none')
    }
  }, [initialFolderId, setValue])
  
  const urlValue = watch('url')
  const isButtonDisabled = !urlValue?.trim() || isSubmitting

  const fetchMetadata = async (url: string) => {
    if (isFetchingMetadata) return
    setIsFetchingMetadata(true)
    try {
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.title && !watch('title')) setValue('title', data.title)
        if (data.description) setValue('description', data.description)
        if (data.ogImage) setOgImage(data.ogImage)
      }
    } catch (error) {
      console.error('Metadata fetch failed:', error)
    } finally {
      setIsFetchingMetadata(false)
    }
  }
  
  const onSubmit = async (data: BookmarkFormValues) => {
    try {
      await createBookmark({
        title: data.title || new URL(data.url).hostname,
        url: data.url,
        description: data.description || "",
        ogImage: ogImage,
        folderId: (data.folderId && data.folderId !== "none") ? data.folderId as Id<'folders'> : undefined,
        pinned: false,
      })
      reset({
        title: '',
        url: '',
        description: '',
        folderId: initialFolderId || 'none'
      })
      setOgImage(undefined)
      setOpen(false)
    } catch (error) {
      console.error('Failed to add bookmark:', error)
    }
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Bookmark</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold leading-none">Add Bookmark</h3>
            <p className="text-sm text-muted-foreground">Save a new link to your collection</p>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                {...register('url', {
                  onChange: (e) => {
                    const url = e.target.value
                    if (url && url.startsWith('http') && url.includes('.')) {
                      fetchMetadata(url)
                    }
                  }
                })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="title">Title (Optional)</Label>
              <div className="relative">
                <Input
                  id="title"
                  placeholder={isFetchingMetadata ? "Fetching title..." : "Page Title"}
                  {...register('title')}
                />
                {isFetchingMetadata && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Folder</Label>
              <Controller
                name="folderId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { reset({ title: '', url: '', description: '', folderId: initialFolderId || 'none' }); setOgImage(undefined); setOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isButtonDisabled}>
              Add Bookmark
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}