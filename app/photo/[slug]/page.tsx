'use client'

import { useState, useEffect, use } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, Camera, Calendar, ArrowRight, Eye } from 'lucide-react'
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
      _createdAt
    }
  `, { slug })
}

async function getRelatedPhotos(collections: Array<{ slug: { current: string } }>, currentPhotoId: string) {
  if (!collections || collections.length === 0) return []
  
  const collectionSlugs = collections.map(c => c.slug.current)
  
  return client.fetch(`
    *[_type == "photo" && _id != $currentPhotoId && collection->slug.current in $collectionSlugs] | order(_createdAt desc) [0...6] {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      alt
    }
  `, { currentPhotoId, collectionSlugs })
}

export default function PhotoPage({ params }: PhotoPageProps) {
  const resolvedParams = use(params)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [relatedPhotos, setRelatedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
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

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  }

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
    <div className="min-h-screen bg-background">
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        
        {/* Back to Gallery */}
        <Link 
          href="/gallery"
          className="inline-flex items-center px-4 py-2 bg-secondary text-foreground hover:bg-foreground hover:text-background transition-colors mb-6 font-medium rounded-md border border-border"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Gallery
        </Link>
        
        {/* Title */}
        <h1 className="text-4xl font-bold mb-8 text-foreground">
          {photo.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Photo */}
          <div 
            className="relative cursor-pointer group max-w-sm mx-auto"
            onClick={() => setFullscreenOpen(true)}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.alt || photo.title}
              width={1280}
              height={0}
              style={{ height: 'auto' }}
              className="w-full rounded-lg border border-border"
              priority
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <Eye className="w-6 h-6 text-gray-800" />
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
            {(photo.camera || photo.lens || photo.settings || photo.captureDate) && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Technical Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {photo.captureDate && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                      <dd className="text-sm">{new Date(photo.captureDate).toLocaleDateString()}</dd>
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
      {relatedPhotos.length > 0 && (
        <RelatedPhotos 
          photos={relatedPhotos}
          onPhotoSelect={(index) => {
            setCurrentPhotoIndex(index)
            setFullscreenOpen(true)
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
            slug: photo.slug
          }}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          relatedPhotos={relatedPhotos.filter(p => p.imageUrl).map(p => ({
            _id: p._id,
            title: p.title,
            imageUrl: p.imageUrl,
            imageId: p.imageId,
            alt: p.alt,
            slug: p.slug
          }))}
          currentIndex={currentPhotoIndex}
          onNavigate={(direction) => {
            const nextIndex = direction === 'next' 
              ? (currentPhotoIndex + 1) % relatedPhotos.length
              : currentPhotoIndex === 0 ? relatedPhotos.length - 1 : currentPhotoIndex - 1
            router.push(`/photo/${relatedPhotos[nextIndex].slug.current}`)
          }}
        />
      )}

    </div>
  )
}