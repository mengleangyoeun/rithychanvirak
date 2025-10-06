'use client'

import { useState, useEffect, use } from 'react'
import { client } from '@/sanity/lib/client'
import { getThumbnailUrl } from '@/lib/cloudinary'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, Folder, Eye, ArrowUpDown } from 'lucide-react'
import { notFound } from 'next/navigation'
import { FullscreenPhotoPreview } from '@/components/fullscreen-photo-preview'
import { PhotoGridSkeleton } from '@/components/photo-grid-skeleton'
import { CollectionCardSkeleton } from '@/components/collection-card-skeleton'

interface Photo {
  _id: string
  _createdAt?: string
  title: string
  slug: { current: string }
  imageUrl: string
  imageId: string
  imageWidth?: number
  imageHeight?: number
  alt: string
  description?: string
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

interface Collection {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  coverImage?: { asset: { _ref: string }; alt?: string }
  parentCollection?: { title: string; slug: { current: string } }
  childCollections?: Collection[]
}

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getCollectionBySlug(slug: string) {
  return client.fetch(`
    *[_type == "collection" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      coverImage,
      parentCollection-> {
        title,
        slug
      },
      "childCollections": *[_type == "collection" && parentCollection._ref == ^._id] {
        _id,
        title,
        slug,
        description,
        coverImage
      }
    }
  `, { slug })
}

async function getCollectionPhotos(collectionId: string) {
  return client.fetch(`
    *[_type == "photo" && references($collectionId)] {
      _id,
      _createdAt,
      title,
      slug,
      imageUrl,
      imageId,
      imageWidth,
      imageHeight,
      alt,
      description,
      camera,
      lens,
      settings,
      location,
      captureDate
    }
  `, { collectionId })
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = use(params)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'capture'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const collectionData = await getCollectionBySlug(resolvedParams.slug)

        if (!collectionData) {
          notFound()
          return
        }

        setCollection(collectionData)

        const photosData = await getCollectionPhotos(collectionData._id)
        setPhotos(photosData)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching collection:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.slug])

  // Sort photos based on sortBy and sortOrder
  const sortedPhotos = [...photos].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        // Extract base name and number for smart sorting (handles "Rak(1)", "Rak(2)", etc.)
        const extractParts = (title: string) => {
          // Match patterns like "Name(123)" or "Name_123" or "Name 123"
          const match = title.match(/^(.*?)[\s_\(]*(\d+)[\)\s_]*$/);
          if (match) {
            return { base: match[1].trim(), num: parseInt(match[2], 10) };
          }
          return { base: title, num: 0 };
        };

        const aParts = extractParts(a.title);
        const bParts = extractParts(b.title);

        // First compare base names
        const baseComparison = aParts.base.localeCompare(bParts.base, undefined, {
          sensitivity: 'base',
          numeric: true
        });

        // If base names are the same, compare numbers
        if (baseComparison === 0) {
          comparison = aParts.num - bParts.num;
        } else {
          comparison = baseComparison;
        }
        break
      case 'capture':
        // Handle missing capture dates - put them at the end
        const hasDateA = !!a.captureDate
        const hasDateB = !!b.captureDate

        if (!hasDateA && !hasDateB) {
          comparison = 0
        } else if (!hasDateA) {
          // a has no date, put it at the end (return positive value)
          comparison = 1
        } else if (!hasDateB) {
          // b has no date, put it at the end (return negative value)
          comparison = -1
        } else {
          // Both have dates, compare them
          const dateA = new Date(a.captureDate!).getTime()
          const dateB = new Date(b.captureDate!).getTime()
          comparison = dateA - dateB
        }
        break
      case 'date':
      default:
        // Sort by creation date (_createdAt)
        const createdA = a._createdAt ? new Date(a._createdAt).getTime() : 0
        const createdB = b._createdAt ? new Date(b._createdAt).getTime() : 0
        comparison = createdA - createdB
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Removed early return for loading - show skeleton inline instead

  if (!loading && !collection) {
    notFound()
  }

  return (
    <div className="min-h-screen unified-background">
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
              href="/gallery"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Gallery</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            {loading ? (
              <>
                <div className="h-16 sm:h-20 md:h-24 w-3/4 bg-white/10 rounded animate-pulse mb-4" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                </div>
                <div className="h-6 w-full max-w-3xl bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-6 w-2/3 max-w-2xl bg-white/10 rounded animate-pulse" />
              </>
            ) : (
              <>
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-4 tracking-tight leading-none"
                  style={{ fontFamily: /[\u1780-\u17FF]/.test(collection?.title || '') ? '"Kantumruy Pro", sans-serif' : 'var(--font-livvic), sans-serif' }}
                >
                  {collection?.title}
                </h1>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                </div>

                {collection?.description && (
                  <p className="text-xl text-white/70 max-w-3xl leading-relaxed">
                    {collection.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 mt-6">
                  {photos.length > 0 && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>📸</span>
                      <span>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {collection?.childCollections && collection.childCollections.length > 0 && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>📁</span>
                      <span>{collection.childCollections.length} sub-collection{collection.childCollections.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* Sub-Collections */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-16"
            >
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <CollectionCardSkeleton key={index} />
                ))}
              </div>
            </motion.div>
          ) : collection?.childCollections && collection.childCollections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Sub-Collections</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collection.childCollections.map((subCollection, index) => (
                  <motion.div
                    key={subCollection._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  >
                    <Link
                      href={`/collection/${subCollection.slug.current}`}
                      className="group block"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/20 hover:bg-white/10">
                        {subCollection.coverImage && (
                          <Image
                            src={urlFor(subCollection.coverImage).width(600).height(450).url()}
                            alt={subCollection.coverImage.alt || subCollection.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}

                        {/* Gradient Overlay - always visible, stronger on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:from-black/40 md:via-black/10 md:group-hover:from-black/80 md:group-hover:via-black/30 transition-all duration-500"></div>

                        {/* Content - always visible on mobile, shown on hover on desktop */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                          <h3
                            className="text-xl font-bold text-white mb-2 md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300"
                            style={{ fontFamily: /[\u1780-\u17FF]/.test(subCollection.title) ? '"Kantumruy Pro", sans-serif' : undefined }}
                          >
                            {subCollection.title}
                          </h3>
                          {subCollection.description && (
                            <p className="text-sm text-white/70 line-clamp-2 md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300 md:delay-75">
                              {subCollection.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Photos Grid */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-10 w-40 bg-white/10 rounded-lg animate-pulse" />
              </div>
              <PhotoGridSkeleton />
            </motion.div>
          ) : photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">Photos</h2>
                  <span className="text-sm text-white/50">({sortedPhotos.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'capture')}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-lg text-white text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="date" className="bg-black text-white">Upload Date</option>
                    <option value="name" className="bg-black text-white">Name (A-Z)</option>
                    <option value="capture" className="bg-black text-white">Capture Date</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 rounded-lg text-white transition-all"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-[180px] sm:auto-rows-[200px] md:auto-rows-[220px] gap-2 sm:gap-3 md:gap-4" style={{ gridAutoFlow: 'dense' }}>
                {sortedPhotos.filter(photo => photo.imageUrl && photo.imageId).map((photo, index) => {
                  // Calculate aspect ratio to determine grid span
                  const width = photo.imageWidth || 1200
                  const height = photo.imageHeight || 900
                  const aspectRatio = width / height

                  // Determine row and column span based on aspect ratio - improved algorithm
                  let colSpan = 'col-span-1'
                  let rowSpan = 'row-span-1'

                  if (aspectRatio > 2.5) {
                    // Ultra-wide panorama
                    colSpan = 'col-span-2 md:col-span-3'
                    rowSpan = 'row-span-1'
                  } else if (aspectRatio > 1.8) {
                    // Wide panorama
                    colSpan = 'col-span-2'
                    rowSpan = 'row-span-1'
                  } else if (aspectRatio > 1.3) {
                    // Landscape
                    colSpan = 'col-span-2'
                    rowSpan = 'row-span-1'
                  } else if (aspectRatio >= 0.9) {
                    // Square-ish
                    colSpan = 'col-span-1'
                    rowSpan = 'row-span-1'
                  } else if (aspectRatio >= 0.6) {
                    // Portrait
                    colSpan = 'col-span-1'
                    rowSpan = 'row-span-2'
                  } else {
                    // Tall portrait
                    colSpan = 'col-span-1'
                    rowSpan = 'row-span-2 md:row-span-3'
                  }

                  return (
                    <motion.div
                      key={photo._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.6) }}
                      className={`group cursor-pointer ${colSpan} ${rowSpan}`}
                      onClick={() => {
                        setSelectedPhoto(photo)
                        setCurrentPhotoIndex(index)
                        setFullscreenOpen(true)
                      }}
                    >
                      <div className="relative h-full overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/30 hover:shadow-xl hover:shadow-white/5 hover:scale-[1.01] group-hover:from-white/10 group-hover:to-white/5">
                        {photo.imageId ? (
                          <Image
                            src={getThumbnailUrl(photo.imageId)}
                            alt={photo.alt || photo.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            loading={index < 15 ? 'eager' : 'lazy'}
                            onError={(e) => {
                              console.error('Image failed to load:', photo.imageId)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <span className="text-white/30 text-xs">No image</span>
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Eye className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          </div>
                        </div>

                        {/* Photo Title - Shows on hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <h3
                            className="text-xs md:text-sm font-semibold text-white line-clamp-2 drop-shadow-lg"
                            style={{ fontFamily: /[\u1780-\u17FF]/.test(photo.title) ? '"Kantumruy Pro", sans-serif' : undefined }}
                          >
                            {photo.title}
                          </h3>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !collection?.childCollections?.length && !photos.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center py-20"
            >
              <Folder className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-2xl font-bold text-white mb-3">Empty Collection</h3>
              <p className="text-white/60 mb-8">
                This collection doesn&apos;t have any photos or sub-collections yet.
              </p>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Gallery
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Preview */}
      {selectedPhoto && (
        <FullscreenPhotoPreview
          photo={{
            _id: selectedPhoto._id,
            title: selectedPhoto.title,
            imageUrl: selectedPhoto.imageUrl,
            imageId: selectedPhoto.imageId,
            alt: selectedPhoto.alt,
            slug: selectedPhoto.slug,
            camera: selectedPhoto.camera,
            lens: selectedPhoto.lens,
            settings: selectedPhoto.settings,
            location: selectedPhoto.location,
            captureDate: selectedPhoto.captureDate
          }}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          relatedPhotos={sortedPhotos.filter(p => p.imageUrl).map(p => ({
            _id: p._id,
            title: p.title,
            imageUrl: p.imageUrl,
            imageId: p.imageId,
            alt: p.alt,
            slug: p.slug,
            camera: p.camera,
            lens: p.lens,
            settings: p.settings,
            location: p.location,
            captureDate: p.captureDate
          }))}
          currentIndex={currentPhotoIndex}
          onNavigate={(direction) => {
            if (direction === 'next') {
              const nextIndex = (currentPhotoIndex + 1) % sortedPhotos.length
              setCurrentPhotoIndex(nextIndex)
              setSelectedPhoto(sortedPhotos[nextIndex])
            } else {
              const prevIndex = currentPhotoIndex === 0 ? sortedPhotos.length - 1 : currentPhotoIndex - 1
              setCurrentPhotoIndex(prevIndex)
              setSelectedPhoto(sortedPhotos[prevIndex])
            }
          }}
        />
      )}
    </div>
  )
}
