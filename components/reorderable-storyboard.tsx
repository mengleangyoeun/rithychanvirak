'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, GripVertical, Plus, Upload as UploadIcon } from 'lucide-react'
import Image from 'next/image'
import { CloudinaryBulkUpload } from './cloudinary-bulk-upload'

interface StoryboardImage {
  id?: string
  image_id: string
  image_url: string
  name: string
}

interface ReorderableStoryboardProps {
  images: StoryboardImage[]
  onChange: (images: StoryboardImage[]) => void
  maxImages?: number
}

export function ReorderableStoryboard({ images, onChange, maxImages = 20 }: ReorderableStoryboardProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    setDraggedIndex(index)
    onChange(newImages)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleUpload = (newImages: Array<{ image_id: string; image_url: string; name: string }>) => {
    const remainingSlots = maxImages - images.length
    const imagesToAdd = newImages.slice(0, remainingSlots).map(img => ({
      image_id: img.image_id,
      image_url: img.image_url,
      name: img.name,
    }))
    const combined = [...images, ...imagesToAdd]
    onChange(combined)
    setShowUpload(false)
  }

  if (showUpload) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Add More Storyboard Images</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(false)}
          >
            Cancel
          </Button>
        </div>
        <CloudinaryBulkUpload
          onUploadComplete={handleUpload}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {images.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {images.length} image{images.length > 1 ? 's' : ''} • Drag to reorder
            </p>
            {images.length < maxImages && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUpload(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 border rounded-lg p-3 max-h-96 overflow-y-auto">
            {images.map((image, index) => (
              <div
                key={`${image.image_url}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative aspect-square group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                  draggedIndex === index ? 'border-primary scale-105 shadow-lg' : 'border-transparent'
                }`}
              >
                <Image
                  src={image.image_url}
                  alt={image.name}
                  fill
                  className="object-cover"
                />

                {/* Drag handle */}
                <div className="absolute top-1 left-1 bg-background/90 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>

                {/* Order number */}
                <div className="absolute bottom-1 left-1 bg-background/90 text-foreground text-xs px-2 py-0.5 rounded font-medium">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <UploadIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">Upload Storyboard Images</p>
          <p className="text-xs text-muted-foreground">Behind-the-scenes photos or video stills</p>
        </button>
      )}
    </div>
  )
}
