'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Download, Share2, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { getOptimizedImageUrl } from '@/lib/cloudinary'

interface Photo {
  _id: string
  title: string
  imageUrl: string
  imageId: string
  alt: string
  slug: {
    current: string
  }
  camera?: string
  lens?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: string
    focalLength?: string
  }
  location?: string
  captureDate?: string
}

interface FullscreenPhotoPreviewProps {
  photo: Photo
  isOpen: boolean
  onClose: () => void
  relatedPhotos?: Photo[]
  currentIndex?: number
  onNavigate?: (direction: 'prev' | 'next') => void
}

export function FullscreenPhotoPreview({
  photo,
  isOpen,
  onClose,
  relatedPhotos = [],
  currentIndex = 0,
  onNavigate
}: FullscreenPhotoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Preload next and previous images
  useEffect(() => {
    if (!isOpen || relatedPhotos.length <= 1) return

    const nextIndex = (currentIndex + 1) % relatedPhotos.length
    const prevIndex = currentIndex === 0 ? relatedPhotos.length - 1 : currentIndex - 1

    const preloadImage = (imageId: string) => {
      const img = new window.Image()
      img.src = getOptimizedImageUrl(imageId, 1920)
    }

    if (relatedPhotos[nextIndex]?.imageId) {
      preloadImage(relatedPhotos[nextIndex].imageId)
    }
    if (relatedPhotos[prevIndex]?.imageId) {
      preloadImage(relatedPhotos[prevIndex].imageId)
    }
  }, [currentIndex, relatedPhotos, isOpen])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (onNavigate && relatedPhotos.length > 1) {
          onNavigate('prev')
        }
        break
      case 'ArrowRight':
        if (onNavigate && relatedPhotos.length > 1) {
          onNavigate('next')
        }
        break
    }
  }, [isOpen, onClose, onNavigate, relatedPhotos.length])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setIsLoading(true)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await fetch(getOptimizedImageUrl(photo.imageId, 1920))
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${photo.title?.replace(/[^a-z0-9]/gi, '_') || 'photo'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(getOptimizedImageUrl(photo.imageId, 1920), '_blank')
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      await navigator.share({
        title: photo.title,
        url: window.location.href
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Top Controls Bar */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-white/10"
        >
          <div className="flex items-center gap-3 text-white min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              {photo.title}
            </h2>
            {relatedPhotos.length > 1 && (
              <span className="text-white/70 text-sm whitespace-nowrap">
                {currentIndex + 1} / {relatedPhotos.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Link
              href={`/photo/${photo.slug.current}`}
              className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10 flex items-center justify-center transition-colors"
            >
              <Info className="h-5 w-5" />
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10"
            >
              <Download className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10"
            >
              <Share2 className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Main Image Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background - Click to close */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={onClose}
          />

          {/* Navigation Arrows */}
          {onNavigate && relatedPhotos.length > 1 && (
            <>
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate('prev')
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>

              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate('next')
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </>
          )}

          {/* Image Container */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ top: '60px', bottom: '80px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <motion.div
              key={photo._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <Image
                src={getOptimizedImageUrl(photo.imageId, 1920)}
                alt={photo.alt || photo.title}
                width={1920}
                height={1280}
                style={{
                  height: 'auto',
                  maxWidth: '85vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }}
                className="rounded-xl border-2 border-white/20 drop-shadow-2xl"
                onLoad={() => setIsLoading(false)}
                draggable={false}
                priority
                quality={90}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="p-4 bg-black/80 backdrop-blur-sm border-t border-white/10"
        >
          {/* Metadata Row */}
          {(photo.camera || photo.lens || photo.settings || photo.location || photo.captureDate) && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 md:gap-x-6 gap-y-2 text-xs md:text-sm text-white/70 px-2">
              {photo.camera && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">📷</span>
                  <span>{photo.camera}</span>
                </div>
              )}
              {photo.lens && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">🔍</span>
                  <span>{photo.lens}</span>
                </div>
              )}
              {photo.settings && (
                <div className="flex items-center gap-3">
                  {photo.settings.aperture && <span>f/{photo.settings.aperture}</span>}
                  {photo.settings.shutter && <span>{photo.settings.shutter}s</span>}
                  {photo.settings.iso && <span>ISO {photo.settings.iso}</span>}
                  {photo.settings.focalLength && <span>{photo.settings.focalLength}mm</span>}
                </div>
              )}
              {photo.location && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">📍</span>
                  <span>{photo.location}</span>
                </div>
              )}
              {photo.captureDate && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">📅</span>
                  <span>{new Date(photo.captureDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <div className="text-white/70 text-xs md:text-sm">
              {relatedPhotos.length > 1 && (
                <>
                  <span className="hidden md:inline">Use arrow keys or buttons to navigate • </span>
                  <span className="md:hidden">Swipe or tap buttons to navigate • </span>
                </>
              )}
              <span className="hidden md:inline">Click outside or press ESC to close</span>
              <span className="md:hidden">Tap outside to close</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}