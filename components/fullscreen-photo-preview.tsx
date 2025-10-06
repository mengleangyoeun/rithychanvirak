'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Download, Share2, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

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
      setScale(1) // Reset scale when opening
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  // Handle touch gestures for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPinching || scale > 1) return // Don't swipe when zoomed
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching || scale > 1) return // Don't swipe when zoomed
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isPinching || scale > 1) return

    const swipeThreshold = 50
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = Math.abs(touchStart.y - touchEnd.y)

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(distanceX) > swipeThreshold && Math.abs(distanceX) > distanceY) {
      if (distanceX > 0 && onNavigate && relatedPhotos.length > 1) {
        onNavigate('next')
      } else if (distanceX < 0 && onNavigate && relatedPhotos.length > 1) {
        onNavigate('prev')
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // Handle pinch-to-zoom
  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true)
      e.preventDefault()
    }
  }

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      // Calculate scale based on initial distance (stored in a way that works)
      const newScale = Math.min(Math.max(1, distance / 200), 3)
      setScale(newScale)
    }
  }

  const handlePinchEnd = () => {
    setIsPinching(false)
    // Reset scale if less than 1.1
    if (scale < 1.1) {
      setScale(1)
    }
  }

  // Reset scale when photo changes
  useEffect(() => {
    setScale(1)
  }, [photo._id])

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

    const photoUrl = window.location.href

    try {
      // MOBILE & MODERN BROWSERS: Use native share
      if (navigator.share) {
        console.log('Opening native share dialog...')

        // Check if browser supports sharing files
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [] })

        if (canShareFiles) {
          // Try to share with image
          try {
            const imageUrl = getOptimizedImageUrl(photo.imageId, 1920)
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const file = new File([blob], `${photo.title}.jpg`, { type: 'image/jpeg' })

            // Check if we can share this specific file
            if (navigator.canShare({ files: [file] })) {
              console.log('Sharing with image file...')
              await navigator.share({
                title: photo.title,
                text: `Check out this photo: ${photo.title}`,
                url: photoUrl,
                files: [file]
              })
              console.log('Share successful!')
              return
            }
          } catch (fileError) {
            console.log('Sharing with file failed, falling back to URL only:', fileError)
          }
        }

        // Share without image (URL only) - this opens WhatsApp, Email, etc.
        console.log('Sharing URL only...')
        await navigator.share({
          title: photo.title,
          text: `Check out this photo: ${photo.title}`,
          url: photoUrl
        })
        console.log('Share successful!')
      } else {
        // DESKTOP FALLBACK: Copy to clipboard (no native share on most desktop browsers)
        console.log('Native share not available, copying to clipboard...')
        await navigator.clipboard.writeText(photoUrl)
        alert('📋 Photo link copied to clipboard!\n\nYou can now paste it to share.')
      }
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled - do nothing
        return
      }

      console.error('Share failed:', error)

      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(photoUrl)
        alert('Photo link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard copy failed:', clipboardError)
        alert('Could not share or copy link. Please try again.')
      }
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
        {/* Top Controls Bar - Mobile: absolute overlay, Desktop: flex item */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="absolute top-0 left-0 right-0 md:relative z-20 flex items-center justify-between p-3 md:p-4 bg-gradient-to-b from-black/90 via-black/70 to-transparent md:bg-black/80 md:backdrop-blur-sm md:border-b md:border-white/10"
        >
          <div className="flex items-center gap-2 md:gap-3 text-white min-w-0 flex-1">
            <h2 className="text-sm md:text-lg font-semibold truncate">
              {photo.title}
            </h2>
            {relatedPhotos.length > 1 && (
              <span className="text-white/70 text-xs md:text-sm whitespace-nowrap">
                {currentIndex + 1} / {relatedPhotos.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className={`text-white hover:bg-white/20 rounded-full p-2 h-8 w-8 md:h-10 md:w-10 transition-colors ${showMetadata ? 'bg-white/20' : ''}`}
              aria-label="Toggle photo details"
            >
              <Info className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="hidden sm:flex text-white hover:bg-white/20 rounded-full p-2 h-8 w-8 md:h-10 md:w-10"
              aria-label="Download photo"
            >
              <Download className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="hidden sm:flex text-white hover:bg-white/20 rounded-full p-2 h-8 w-8 md:h-10 md:w-10"
              aria-label="Share photo"
            >
              <Share2 className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 h-8 w-8 md:h-10 md:w-10"
              aria-label="Close preview"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Main Image Area */}
        <div className="relative flex-1 flex items-center justify-center p-4 md:p-8">
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
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-md border border-white/20 items-center justify-center"
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
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-md border border-white/20 items-center justify-center"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </>
          )}

          {/* Image */}
          <div
            ref={imageRef}
            className="relative z-10 flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            <motion.div
              key={photo._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, scale: { duration: 0.1 } }}
              onTouchStart={handlePinchStart}
              onTouchMove={handlePinchMove}
              onTouchEnd={handlePinchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOptimizedImageUrl(photo.imageId, 1920)}
                alt={photo.alt || photo.title}
                className="max-w-full max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-200px)] w-auto h-auto object-contain md:rounded-lg md:shadow-2xl"
                style={{ touchAction: 'none' }}
                onLoad={() => {
                  console.log('Image loaded successfully:', getOptimizedImageUrl(photo.imageId, 1920))
                  setIsLoading(false)
                }}
                onError={(e) => {
                  console.error('Image failed to load:', getOptimizedImageUrl(photo.imageId, 1920), e)
                  setIsLoading(false)
                }}
                draggable={false}
              />
            </motion.div>
          </div>
        </div>

        {/* Sliding Metadata Panel */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Photo Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMetadata(false)}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-2">Title</h4>
                    <p className="text-white text-lg">{photo.title}</p>
                  </div>

                  {/* Camera Info */}
                  {(photo.camera || photo.lens) && (
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Equipment</h4>
                      <div className="space-y-3">
                        {photo.camera && (
                          <div className="flex items-start gap-3">
                            <span className="text-white/50 mt-1">📷</span>
                            <div>
                              <p className="text-xs text-white/50">Camera</p>
                              <p className="text-white">{photo.camera}</p>
                            </div>
                          </div>
                        )}
                        {photo.lens && (
                          <div className="flex items-start gap-3">
                            <span className="text-white/50 mt-1">🔍</span>
                            <div>
                              <p className="text-xs text-white/50">Lens</p>
                              <p className="text-white">{photo.lens}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Camera Settings */}
                  {photo.settings && Object.keys(photo.settings).length > 0 && (
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {photo.settings.aperture && (
                          <div>
                            <p className="text-xs text-white/50">Aperture</p>
                            <p className="text-white font-mono">f/{photo.settings.aperture}</p>
                          </div>
                        )}
                        {photo.settings.shutter && (
                          <div>
                            <p className="text-xs text-white/50">Shutter Speed</p>
                            <p className="text-white font-mono">{photo.settings.shutter}s</p>
                          </div>
                        )}
                        {photo.settings.iso && (
                          <div>
                            <p className="text-xs text-white/50">ISO</p>
                            <p className="text-white font-mono">{photo.settings.iso}</p>
                          </div>
                        )}
                        {photo.settings.focalLength && (
                          <div>
                            <p className="text-xs text-white/50">Focal Length</p>
                            <p className="text-white font-mono">{photo.settings.focalLength}mm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location & Date */}
                  {(photo.location || photo.captureDate) && (
                    <div className="border-t border-white/10 pt-6">
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Details</h4>
                      <div className="space-y-3">
                        {photo.location && (
                          <div className="flex items-start gap-3">
                            <span className="text-white/50 mt-1">📍</span>
                            <div>
                              <p className="text-xs text-white/50">Location</p>
                              <p className="text-white">{photo.location}</p>
                            </div>
                          </div>
                        )}
                        {photo.captureDate && (
                          <div className="flex items-start gap-3">
                            <span className="text-white/50 mt-1">📅</span>
                            <div>
                              <p className="text-xs text-white/50">Capture Date</p>
                              <p className="text-white">{new Date(photo.captureDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <Button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Download className="h-4 w-4" />
                      Download Photo
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Share2 className="h-4 w-4" />
                      Share Photo
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar - Mobile: absolute overlay, Desktop: flex item */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="absolute bottom-0 left-0 right-0 md:relative z-20 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent md:bg-black/80 md:backdrop-blur-sm md:border-t md:border-white/10"
        >
          <div className="text-center">
            <div className="text-white/70 text-xs md:text-sm">
              {relatedPhotos.length > 1 && (
                <>
                  <span className="hidden md:inline">Use arrow keys or buttons to navigate • </span>
                  <span className="md:hidden">Swipe to navigate • </span>
                </>
              )}
              <span className="hidden md:inline">Click Info for details • Press ESC to close</span>
              <span className="md:hidden">Tap Info icon • Pinch to zoom</span>
              {scale > 1 && (
                <span className="ml-2 text-blue-400">
                  ({(scale * 100).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}