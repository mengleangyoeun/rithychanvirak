'use client'

import { useState, useEffect, use } from 'react'
import { client } from '@/sanity/lib/client'
import { getOptimizedImageUrl } from '@/lib/cloudinary'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { FullscreenPhotoPreview } from '@/components/fullscreen-photo-preview'
import { RelatedPhotos } from '@/components/related-photos'

interface Photo {
  _id: string
  title: string
  slug: { current: string }
  imageUrl: string
  imageId: string
  imageWidth?: number
  imageHeight?: number
  alt: string
  description?: string
  tags?: string[]
  collection: { title: string; slug: { current: string } }
  captureDate?: string
  camera?: string
  lens?: string
  location?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: string
    focalLength?: string
  }
}

interface PhotoPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getPhotoBySlug(slug: string) {
  return client.fetch(`
    *[_type == "photo" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      imageWidth,
      imageHeight,
      alt,
      description,
      tags,
      collection-> {
        title,
        slug
      },
      captureDate,
      camera,
      lens,
      settings,
      location,
      _createdAt
    }
  `, { slug })
}

async function getRelatedPhotos(collections: Array<{ slug: { current: string } }>, currentPhotoId: string) {
  if (!collections || collections.length === 0) return []

  const collectionSlugs = collections.map(c => c.slug.current)

  // Get all photos from the same collection
  const allPhotos = await client.fetch<Photo[]>(`
    *[_type == "photo" && collection->slug.current in $collectionSlugs] | order(title asc) {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      imageWidth,
      imageHeight,
      alt,
      collection->{ title, slug }
    }
  `, { collectionSlugs })

  // Natural sort by extracting numbers from titles like "Rak_ (1)", "Rak_ (2)", etc.
  const sortedPhotos = allPhotos.sort((a, b) => {
    const numA = parseInt(a.title.match(/\d+/)?.[0] || '0')
    const numB = parseInt(b.title.match(/\d+/)?.[0] || '0')
    return numA - numB
  })

  // Find current photo index
  const currentIndex = sortedPhotos.findIndex((p) => p._id === currentPhotoId)

  // Get 4 photos before and 4 after current photo (excluding current)
  const relatedPhotos = []
  for (let i = Math.max(0, currentIndex - 4); i < Math.min(sortedPhotos.length, currentIndex + 5); i++) {
    if (sortedPhotos[i]._id !== currentPhotoId) {
      relatedPhotos.push(sortedPhotos[i])
    }
  }

  return relatedPhotos.slice(0, 8)
}

export default function PhotoPage({ params }: PhotoPageProps) {
  const resolvedParams = use(params)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const header = document.querySelector('header')
    if (header) {
      header.classList.remove('nav-scrolled')
      header.classList.add('bg-transparent')
    }

    return () => {
      if (header) {
        header.classList.add('nav-scrolled')
        header.classList.remove('bg-transparent')
      }
    }
  }, [])

  useEffect(() => {
    async function fetchPhoto() {
      try {
        const photoData = await getPhotoBySlug(resolvedParams.slug)
        
        if (!photoData) {
          notFound()
          return
        }
        
        setPhoto(photoData)
        
        // Fetch related photos
        const related = await getRelatedPhotos([photoData.collection], photoData._id)
        setRelatedPhotos(related)
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching photo:', error)
        setLoading(false)
      }
    }

    fetchPhoto()
  }, [resolvedParams.slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8">
          <Skeleton className="w-full h-full rounded-full" />
        </div>
      </div>
    )
  }

  if (!photo) {
    notFound()
  }

  return (
    <div className="min-h-screen unified-background">
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        
        {/* Back to Collection */}
        <Link
          href={`/collection/${photo.collection.slug.current}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 transition-all duration-300 mb-8 font-medium rounded-lg backdrop-blur-sm border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collection
        </Link>
        
        {/* Title */}
        <h1 className="text-4xl font-bold mb-8 text-foreground">
          {photo.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Photo */}
          <div className={`md:col-span-1 flex items-start ${(photo.imageWidth && photo.imageHeight && photo.imageWidth < photo.imageHeight) ? 'justify-center' : 'justify-start'}`}>
            <div
              className={`relative cursor-pointer group rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 w-full ${(photo.imageWidth && photo.imageHeight && photo.imageWidth < photo.imageHeight) ? 'max-w-sm' : 'max-w-full'}`}
              onClick={() => setFullscreenOpen(true)}
            >
              <Image
                src={getOptimizedImageUrl(photo.imageId, 1280)}
                alt={photo.alt || photo.title}
                width={photo.imageWidth || 1280}
                height={photo.imageHeight || 853}
                style={{ width: '100%', height: 'auto' }}
                className="w-full h-auto"
                priority
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            
            {/* Description */}
            {photo.description && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {photo.description}
                </p>
              </div>
            )}

            {/* Technical Details */}
            {(photo.camera || photo.lens || photo.settings || photo.captureDate || photo.location) && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Technical Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {photo.captureDate && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                      <dd className="text-sm">{new Date(photo.captureDate).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {photo.location && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                      <dd className="text-sm">{photo.location}</dd>
                    </div>
                  )}
                  {photo.camera && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Camera</dt>
                      <dd className="text-sm">{photo.camera}</dd>
                    </div>
                  )}
                  {photo.lens && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Lens</dt>
                      <dd className="text-sm">{photo.lens}</dd>
                    </div>
                  )}
                  {photo.settings?.aperture && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Aperture</dt>
                      <dd className="text-sm">f/{photo.settings.aperture}</dd>
                    </div>
                  )}
                  {photo.settings?.shutter && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Shutter</dt>
                      <dd className="text-sm">{photo.settings.shutter}s</dd>
                    </div>
                  )}
                  {photo.settings?.iso && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">ISO</dt>
                      <dd className="text-sm">{photo.settings.iso}</dd>
                    </div>
                  )}
                  {photo.settings?.focalLength && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Focal Length</dt>
                      <dd className="text-sm">{photo.settings.focalLength}mm</dd>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collection */}
            {photo.collection && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Collection</h2>
                <Link
                  href={`/collection/${photo.collection.slug.current}`}
                  className="px-3 py-1 bg-secondary text-foreground rounded-md text-sm hover:bg-foreground hover:text-background transition-colors"
                >
                  {photo.collection.title}
                </Link>
              </div>
            )}

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-secondary text-foreground rounded-md text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Button */}
            <div className="pt-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/80 transition-colors"
              >
                Get This Photo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Related Photos */}
      {relatedPhotos.length > 0 && photo?.collection && (
        <RelatedPhotos
          photos={relatedPhotos}
          collectionSlug={photo.collection.slug.current}
          onPhotoSelect={(index) => {
            // Navigate to the selected photo's detail page
            router.push(`/photo/${relatedPhotos[index].slug.current}`)
          }}
        />
      )}

      {/* Fullscreen Photo Preview */}
      {photo && (
        <FullscreenPhotoPreview
          photo={{
            _id: photo._id,
            title: photo.title,
            imageUrl: photo.imageUrl,
            imageId: photo.imageId,
            alt: photo.alt,
            slug: photo.slug,
            camera: photo.camera,
            lens: photo.lens,
            settings: photo.settings,
            location: photo.location,
            captureDate: photo.captureDate
          }}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          relatedPhotos={relatedPhotos.filter(p => p.imageUrl && p.imageId).map(p => ({
            _id: p._id,
            title: p.title,
            imageUrl: p.imageUrl,
            imageId: p.imageId,
            alt: p.alt,
            slug: p.slug
          }))}
          currentIndex={0}
          onNavigate={(direction) => {
            const currentIdx = relatedPhotos.findIndex(p => p._id === photo._id)
            const nextIndex = direction === 'next'
              ? (currentIdx + 1) % relatedPhotos.length
              : currentIdx === 0 ? relatedPhotos.length - 1 : currentIdx - 1
            router.push(`/photo/${relatedPhotos[nextIndex].slug.current}`)
          }}
        />
      )}

    </div>
  )
}