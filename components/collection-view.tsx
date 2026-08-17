'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowUpDown,
  Eye,
  Image as ImageIcon,
  FolderOpen,
  ArrowRight,
} from 'lucide-react'
import { FullscreenPhotoPreview } from '@/components/fullscreen-photo-preview'
import { getBlurPlaceholderDataUrl, getThumbnailFromSource } from '@/lib/cloudinary'
import type { CollectionWithStats } from '@/lib/collections'
import type { Photo } from '@/types/database'

interface CollectionViewProps {
  collection: CollectionWithStats & {
    childCollections: CollectionWithStats[]
    parentCollection?: { title: string; slug: string }
    collectionType: 'main' | 'sub'
  }
  photos: Photo[]
}

export function CollectionView({ collection, photos }: CollectionViewProps) {
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'capture'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photoRenderCount, setPhotoRenderCount] = useState(120)

  // Smart photo sorting
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name': {
          const extractParts = (title: string) => {
            const match = title.match(/^(.*?)[\s_\(]*(\d+)[\)\s_]*$/)
            if (match) {
              return { base: match[1].trim(), num: parseInt(match[2], 10) }
            }
            return { base: title, num: 0 }
          }

          const aParts = extractParts(a.title)
          const bParts = extractParts(b.title)

          const baseComparison = aParts.base.localeCompare(bParts.base, undefined, {
            sensitivity: 'base',
            numeric: true,
          })

          if (baseComparison === 0) {
            comparison = aParts.num - bParts.num
          } else {
            comparison = baseComparison
          }
          break
        }
        case 'capture': {
          const hasDateA = !!a.date_taken
          const hasDateB = !!b.date_taken

          if (!hasDateA && !hasDateB) {
            comparison = 0
          } else if (!hasDateA) {
            comparison = 1
          } else if (!hasDateB) {
            comparison = -1
          } else {
            const dateA = new Date(a.date_taken!).getTime()
            const dateB = new Date(b.date_taken!).getTime()
            comparison = dateA - dateB
          }
          break
        }
        case 'date':
        default: {
          const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
          const createdB = b.created_at ? new Date(b.created_at).getTime() : 0
          comparison = createdA - createdB
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [photos, sortBy, sortOrder])

  const visiblePhotos = useMemo(
    () => sortedPhotos.slice(0, photoRenderCount),
    [sortedPhotos, photoRenderCount]
  )

  useEffect(() => {
    setPhotoRenderCount(120)
  }, [collection.slug, sortBy, sortOrder, photos.length])

  // Infinite scroll
  useEffect(() => {
    if (visiblePhotos.length >= sortedPhotos.length) return

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY
      const threshold = document.documentElement.scrollHeight - 1000

      if (scrollPosition >= threshold) {
        setPhotoRenderCount((prev) => Math.min(prev + 60, sortedPhotos.length))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visiblePhotos.length, sortedPhotos.length])

  const previewPhotosList = useMemo(() => {
    return sortedPhotos.map((p) => ({
      _id: p.id,
      title: p.title || '',
      imageUrl: p.image_url,
      imageId: p.image_id || '',
      alt: p.alt || p.title || 'Photo',
      slug: { current: p.id },
      camera: p.camera,
      lens: p.lens,
      settings: p.settings,
      location: p.location,
      captureDate: p.date_taken,
    }))
  }, [sortedPhotos])

  return (
    <div className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href={collection.parentCollection ? `/collection/${collection.parentCollection.slug}` : '/gallery'}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>
              {collection.parentCollection
                ? `Back to ${collection.parentCollection.title}`
                : 'Back to Gallery'}
            </span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-4 tracking-tight leading-none"
            style={{
              fontFamily: /[\u1780-\u17FF]/.test(collection.title)
                ? '"Kantumruy Pro", sans-serif'
                : 'var(--font-livvic), sans-serif',
            }}
          >
            {collection.title}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          </div>

          {collection.description && (
            <p className="text-xl text-white/70 max-w-3xl leading-relaxed mb-6">
              {collection.description}
            </p>
          )}

          {/* Stats Badges */}
          <div className="flex items-center gap-3 sm:gap-4 mt-6 flex-wrap">
            {collection.totalPhotos > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white/90 text-sm">
                <ImageIcon className="w-4 h-4 text-white/80" />
                <span>
                  {collection.totalPhotos} photo{collection.totalPhotos !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {collection.childCollections && collection.childCollections.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white/90 text-sm">
                <FolderOpen className="w-4 h-4 text-white/80" />
                <span>
                  {collection.childCollections.length} sub-album
                  {collection.childCollections.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sub-Collections Section */}
        {collection.childCollections && collection.childCollections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight">
              Sub-Albums
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collection.childCollections.map((subCollection, index) => (
                <motion.div
                  key={subCollection.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                >
                  <Link href={`/collection/${subCollection.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/20 hover:bg-white/10">
                      {/* Image Collage or Fallback */}
                      {(() => {
                        const previewImages =
                          subCollection.previewPhotos && subCollection.previewPhotos.length > 0
                            ? subCollection.previewPhotos
                            : subCollection.cover_image_url
                            ? [subCollection.cover_image_url]
                            : []

                        if (previewImages.length > 0) {
                          return previewImages
                            .slice(0, 3)
                            .reverse()
                            .map((url: string, i: number, arr: string[]) => {
                              const offset = arr.length - 1 - i
                              const isTop = offset === 0

                              let transformClass = 'z-30 group-hover:scale-105'
                              if (offset === 1)
                                transformClass = 'z-20 scale-[0.92] -translate-y-3 opacity-80 shadow-lg'
                              if (offset === 2)
                                transformClass = 'z-10 scale-[0.84] -translate-y-6 opacity-60 shadow-xl'

                              return (
                                <Image
                                  key={`${url}-${i}`}
                                  src={getThumbnailFromSource(url, 1200)}
                                  alt={subCollection.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className={`object-cover absolute inset-0 transition-transform duration-700 ${transformClass}`}
                                  loading={index < 3 && isTop ? 'eager' : 'lazy'}
                                  priority={index < 3 && isTop}
                                  placeholder="blur"
                                  blurDataURL={getBlurPlaceholderDataUrl(64, 48)}
                                />
                              )
                            })
                        }

                        return (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/40 text-zinc-500 gap-2">
                            <FolderOpen className="w-12 h-12 stroke-[1.5] text-white/30" />
                            <span className="text-[11px] uppercase tracking-widest font-light text-white/40">
                              Album
                            </span>
                          </div>
                        )
                      })()}

                      {/* Gradient Overlay - smooth reveal on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none z-40"></div>

                      {/* Content - reveals on hover */}
                      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none z-40">
                        <h3
                          className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-md"
                          style={{
                            fontFamily: /[\u1780-\u17FF]/.test(subCollection.title)
                              ? '"Kantumruy Pro", sans-serif'
                              : 'var(--font-livvic), sans-serif',
                          }}
                        >
                          {subCollection.title}
                        </h3>

                        {/* Stats */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                            <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                            <span className="text-xs font-medium text-white/90">
                              {subCollection.totalPhotos} Photos
                            </span>
                          </div>
                          {subCollection.subAlbums > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                              <FolderOpen className="w-3.5 h-3.5 text-white/80" />
                              <span className="text-xs font-medium text-white/90">
                                {subCollection.subAlbums} Albums
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 z-40">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Photos Grid Section */}
        {photos.length > 0 && (
          <>
            {/* Controls Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm">Sort by:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === 'date'
                        ? 'bg-white/20 text-white font-medium'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Upload Date
                  </button>
                  <button
                    onClick={() => setSortBy('capture')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === 'capture'
                        ? 'bg-white/20 text-white font-medium'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Capture Date
                  </button>
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sortBy === 'name'
                        ? 'bg-white/20 text-white font-medium'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Name
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>
            </motion.div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visiblePhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index < 20 ? index * 0.02 : 0 }}
                  className="relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 group cursor-pointer"
                  onClick={() => {
                    setSelectedPhoto(photo)
                    setCurrentPhotoIndex(index)
                    setFullscreenOpen(true)
                  }}
                >
                  <Image
                    src={getThumbnailFromSource(photo.image_url, 800)}
                    alt={photo.title || 'Photo'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading={index < 8 ? 'eager' : 'lazy'}
                    placeholder="blur"
                    blurDataURL={getBlurPlaceholderDataUrl(48, 48)}
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {visiblePhotos.length < sortedPhotos.length && (
              <div className="text-center py-10 text-white/50 text-sm">
                Loading more photos...
              </div>
            )}
          </>
        )}

        {/* Empty state if no photos and no sub-albums */}
        {photos.length === 0 && (!collection.childCollections || collection.childCollections.length === 0) && (
          <div className="text-center py-24 text-white/60">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 stroke-1 text-white/30" />
            <h3 className="text-xl font-medium text-white mb-2">No photos in this album yet</h3>
            <p className="text-white/50 text-sm">Check back later or explore other collections.</p>
          </div>
        )}
      </div>

      {/* Fullscreen Photo Lightbox */}
      {fullscreenOpen && selectedPhoto && (
        <FullscreenPhotoPreview
          photo={previewPhotosList[currentPhotoIndex] || previewPhotosList[0]}
          relatedPhotos={previewPhotosList}
          currentIndex={currentPhotoIndex}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          onNavigate={(direction: 'prev' | 'next') => {
            if (direction === 'next') {
              const nextIdx = (currentPhotoIndex + 1) % previewPhotosList.length
              setCurrentPhotoIndex(nextIdx)
              setSelectedPhoto(sortedPhotos[nextIdx])
            } else {
              const prevIdx =
                currentPhotoIndex === 0
                  ? previewPhotosList.length - 1
                  : currentPhotoIndex - 1
              setCurrentPhotoIndex(prevIdx)
              setSelectedPhoto(sortedPhotos[prevIdx])
            }
          }}
        />
      )}
    </div>
  )
}
