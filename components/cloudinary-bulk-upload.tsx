'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import exifr from 'exifr'

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
}

interface UploadedImage {
  image_id: string
  image_url: string
  image_width: number
  image_height: number
  preview: string
  name: string
  camera?: string
  lens?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: string
    focalLength?: string
  }
  location?: string
  date_taken?: string
}

interface CloudinaryBulkUploadProps {
  onUploadComplete: (images: UploadedImage[]) => void
  maxFiles?: number
  folder?: string
}

export function CloudinaryBulkUpload({ onUploadComplete, maxFiles = 50, folder }: CloudinaryBulkUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const extractExifData = async (file: File) => {
    try {
      const exif = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        icc: false,
      })

      if (!exif) return {}

      // Extract camera info
      const camera = exif.Make && exif.Model
        ? `${exif.Make} ${exif.Model}`.trim()
        : exif.Model || undefined

      // Extract lens info
      const lens = exif.LensModel || exif.LensMake || undefined

      // Extract settings
      const settings: {
        aperture?: string
        shutter?: string
        iso?: string
        focalLength?: string
      } = {}
      if (exif.FNumber) settings.aperture = `f/${exif.FNumber}`
      if (exif.ExposureTime) {
        settings.shutter = exif.ExposureTime < 1
          ? `1/${Math.round(1 / exif.ExposureTime)}s`
          : `${exif.ExposureTime}s`
      }
      if (exif.ISO) settings.iso = exif.ISO.toString()
      if (exif.FocalLength) settings.focalLength = `${exif.FocalLength}mm`

      // Extract GPS location
      let location: string | undefined
      if (exif.latitude && exif.longitude) {
        location = `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`
      }

      // Extract date taken
      const date_taken = exif.DateTimeOriginal || exif.CreateDate || undefined

      return {
        camera,
        lens,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        location,
        date_taken: date_taken ? new Date(date_taken).toISOString() : undefined,
      }
    } catch (error) {
      console.warn('Failed to extract EXIF data:', error)
      return {}
    }
  }

  const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResponse> => {
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

    return response.json()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file count
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      toast.error('All files must be images')
      return
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('All files must be less than 10MB')
      return
    }

    await processFiles(files)
  }

  const handleRemove = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    onUploadComplete(newImages)
  }

  const handleClearAll = () => {
    setUploadedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onUploadComplete([])
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

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Validate file count
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      toast.error('All files must be images')
      return
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error('All files must be less than 10MB')
      return
    }

    // Process files
    await processFiles(files)
  }

  const processFiles = async (files: File[]) => {
    setUploading(true)
    setProgress(0)
    const uploaded: UploadedImage[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFile(file.name)
        setProgress(((i + 1) / files.length) * 100)

        // Create preview
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        // Extract EXIF metadata
        const exifData = await extractExifData(file)

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file)

        uploaded.push({
          image_id: result.public_id,
          image_url: result.secure_url,
          image_width: result.width,
          image_height: result.height,
          preview,
          name: file.name,
          ...exifData, // Include EXIF metadata
        })
      }

      setUploadedImages([...uploadedImages, ...uploaded])
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded successfully!`)
      onUploadComplete([...uploadedImages, ...uploaded])
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload some images')
    } finally {
      setUploading(false)
      setCurrentFile('')
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Upload Area with Drag & Drop */}
      {uploadedImages.length === 0 && !uploading && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative"
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
            {isDragging ? (
              <>
                <Upload className="w-12 h-12 text-primary mb-4 animate-bounce" />
                <p className="text-sm font-medium text-primary mb-1">Drop images here!</p>
                <p className="text-xs text-muted-foreground">Release to upload</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Drag & drop images here or click to browse</p>
                <p className="text-xs text-muted-foreground">Select multiple images (up to {maxFiles})</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB each</p>
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-3 p-6 border-2 border-dashed border-border rounded-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Uploading & extracting metadata...</p>
              <p className="text-xs text-muted-foreground">{currentFile}</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
        </div>
      )}

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm font-medium">{uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} uploaded</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add More
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={uploading}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto border rounded-lg p-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative aspect-square group">
                <Image
                  src={image.preview}
                  alt={image.name}
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
