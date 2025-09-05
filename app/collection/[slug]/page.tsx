'use client'

import { useState, useEffect, use } from 'react'
import { client } from '@/sanity/lib/client'
import { getThumbnailUrl, getOptimizedImageUrl } from '@/lib/cloudinary'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Folder, X, Eye } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { FullscreenPhotoPreview } from '@/components/fullscreen-photo-preview'
import { useRouter } from 'next/navigation'

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
    *[_type == "photo" && references($collectionId)] | order(_createdAt desc) {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      imageWidth,
      imageHeight,
      alt,
      description
    }
  `, { collectionId })
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = use(params)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const collectionData = await getCollectionBySlug(resolvedParams.slug)
        
        if (!collectionData) {
          notFound()
          return
        }
        
        setCollection(collectionData)
        
        // Fetch photos for this collection
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

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
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

  if (!collection) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      
      {/* Header Section */}
      <section className="relative pt-20 sm:pt-22 lg:pt-24 pb-4 sm:pb-6 lg:pb-8 border-b border-border/50">        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          
          {/* Enhanced Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/gallery"
                className="group inline-flex items-center px-6 py-3 bg-card border border-border rounded-xl hover:bg-card/80 hover:border-foreground/20 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <motion.div
                  whileHover={{ x: -4 }}
                  transition={{ duration: 0.2 }}
                  className="mr-3"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
                </motion.div>
                <span className="text-foreground/80 group-hover:text-foreground font-medium tracking-wide transition-colors">
                  Back to Gallery
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Enhanced Collection Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 sm:mb-8 lg:mb-10"
          >
            <div className="relative">
              {/* Modern Title with Gradient Accent */}
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 text-foreground leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {collection.title}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full mt-4 origin-left"
                  style={{ width: '120px' }}
                />
              </motion.h1>
              
              {/* Enhanced Description */}
              {collection.description && (
                <motion.p 
                  className="text-lg sm:text-xl text-foreground/75 max-w-4xl leading-relaxed font-light mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {collection.description}
                </motion.p>
              )}
              
              {/* Modern Stats Cards */}
              <motion.div 
                className="flex flex-wrap gap-3 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-foreground/80 font-medium">
                      {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                  </div>
                </div>
                
                {collection.childCollections && collection.childCollections.length > 0 && (
                  <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-foreground/80 font-medium">
                        {collection.childCollections.length} Sub-Collections
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sub-Collections Section */}
      {collection.childCollections && collection.childCollections.length > 0 && (
        <section className="py-6 sm:py-8 lg:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Sub-Collections
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore related collections
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {collection.childCollections.map((subCollection, index) => (
                <motion.div
                  key={subCollection._id}
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 }
                  }}
                  className="group"
                >
                  <Link href={`/collection/${subCollection.slug.current}`}>
                    <div className="relative bg-card rounded-xl overflow-hidden border border-border hover:border-border/80 transition-all duration-300 group-hover:shadow-lg">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        {subCollection.coverImage && (
                          <Image
                            src={urlFor(subCollection.coverImage).width(400).url()}
                            alt={subCollection.coverImage.alt || subCollection.title}
                            width={400}
                            height={0}
                            style={{ height: 'auto' }}
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          {subCollection.title}
                        </h3>
                        {subCollection.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {subCollection.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Photos Section */}
      {photos.length > 0 && (
        <section className="py-6 sm:py-8 lg:py-10 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Photos
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} in this collection
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4"
            >
              {photos.filter(photo => photo.imageUrl).map((photo, index) => (
                <motion.div
                  key={photo._id}
                  variants={{
                    initial: { opacity: 0, y: 30 },
                    animate: { opacity: 1, y: 0 }
                  }}
                  className="break-inside-avoid mb-3 sm:mb-4 group"
                >
                  <motion.div 
                    className="bg-card rounded-2xl overflow-hidden border border-border cursor-pointer transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-black/10 hover:-translate-y-2"
                    onClick={() => {
                      setSelectedPhoto(photo)
                      setCurrentPhotoIndex(index)
                      setFullscreenOpen(true)
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={getThumbnailUrl(photo.imageId)}
                        alt={photo.alt || photo.title}
                        width={400}
                        height={300}
                        className="w-full h-auto group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      
                      {/* Modern Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileHover={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="bg-white/95 backdrop-blur-xl rounded-full p-4 shadow-2xl border border-white/20"
                        >
                          <Eye className="w-6 h-6 text-gray-800" />
                        </motion.div>
                        
                        {/* Photo title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                          <motion.h3 
                            className="font-semibold text-lg tracking-wide"
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            {photo.title}
                          </motion.h3>
                        </div>
                      </div>
                      
                      {/* Corner accent */}
                      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-transparent group-hover:border-white/50 transition-all duration-500 rounded-tr-lg"></div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Enhanced Empty State */}
      {!collection.childCollections?.length && !photos.length && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-24 bg-gradient-to-b from-background to-card"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-card rounded-2xl shadow-xl border border-border p-8 sm:p-12 lg:p-16"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Folder className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                  Empty Collection
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                  This collection is currently empty. New content will appear here as it becomes available.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/gallery"
                  className="bg-foreground text-background px-6 py-3 font-medium rounded-xl hover:bg-foreground/80 transition-all duration-300 inline-flex items-center gap-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Gallery
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0 border-none bg-transparent [&>button]:hidden">
          <DialogTitle className="sr-only">
            {selectedPhoto ? `${selectedPhoto.title} - Preview` : 'Photo Preview'}
          </DialogTitle>
          {selectedPhoto && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-2xl"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-2 -right-2 z-50 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </motion.button>

              <div className="relative w-full h-[60vh] bg-secondary rounded-lg overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(selectedPhoto.imageId, 1200)}
                  alt={selectedPhoto.alt || selectedPhoto.title}
                  width={1200}
                  height={800}
                  style={{ height: 'auto' }}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedPhoto.title}</h3>
                  {selectedPhoto.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedPhoto.description}</p>
                  )}
                </div>
                <Link 
                  href={`/photo/${selectedPhoto.slug.current}`}
                  className="bg-foreground text-background px-4 py-2 text-sm font-medium rounded-lg hover:bg-foreground/80 transition-colors inline-flex items-center gap-2"
                  onClick={() => setLightboxOpen(false)}
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Preview */}
      {selectedPhoto && (
        <FullscreenPhotoPreview
          photo={{
            _id: selectedPhoto._id,
            title: selectedPhoto.title,
            imageUrl: selectedPhoto.imageUrl,
            imageId: selectedPhoto.imageId,
            alt: selectedPhoto.alt,
            slug: selectedPhoto.slug
          }}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          relatedPhotos={photos.filter(p => p.imageUrl).map(p => ({
            _id: p._id,
            title: p.title,
            imageUrl: p.imageUrl,
            imageId: p.imageId,
            alt: p.alt,
            slug: p.slug
          }))}
          currentIndex={currentPhotoIndex}
          onNavigate={(direction) => {
            if (direction === 'next') {
              const nextIndex = (currentPhotoIndex + 1) % photos.length
              setCurrentPhotoIndex(nextIndex)
              setSelectedPhoto(photos[nextIndex])
            } else {
              const prevIndex = currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1
              setCurrentPhotoIndex(prevIndex)
              setSelectedPhoto(photos[prevIndex])
            }
          }}
        />
      )}

    </div>
  )
}