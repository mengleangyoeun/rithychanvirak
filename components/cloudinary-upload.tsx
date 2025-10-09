'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

interface CloudinaryUploadProps {
  onUploadComplete: (data: {
    image_id: string
    image_url: string
    image_width: number
    image_height: number
  }) => void
  currentImageUrl?: string
  currentImageId?: string
  folder?: string
}

export function CloudinaryUpload({ onUploadComplete, currentImageUrl, currentImageId, folder }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
    if (folder) {
      formData.append('folder', folder)
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json() as Promise<CloudinaryUploadResponse>
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file)

      toast.success('Image uploaded successfully!')

      // Pass data back to parent
      onUploadComplete({
        image_id: result.public_id,
        image_url: result.secure_url,
        image_width: result.width,
        image_height: result.height,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const result = await uploadToCloudinary(file)

      toast.success('Image uploaded successfully!')

      // Pass data back to parent
      onUploadComplete({
        image_id: result.public_id,
        image_url: result.secure_url,
        image_width: result.width,
        image_height: result.height,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border bg-muted">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`relative flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Uploading to Cloudinary...</p>
              </>
            ) : isDragging ? (
              <>
                <Upload className="w-12 h-12 text-primary mb-4 animate-bounce" />
                <p className="text-sm font-medium text-primary mb-1">Drop image here!</p>
                <p className="text-xs text-muted-foreground">Release to upload</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              </>
            )}
          </button>
        </div>
      )}

      {currentImageId && !preview && (
        <p className="text-xs text-muted-foreground">
          Current: {currentImageId}
        </p>
      )}
    </div>
  )
}
