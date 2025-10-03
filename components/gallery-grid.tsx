'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { getThumbnailUrl } from '@/lib/cloudinary'
import { Eye, Heart, Share2 } from 'lucide-react'

interface Photo {
  _id: string
  title: string
  slug: { current: string }
  imageUrl: string
  imageId: string
  alt: string
  description?: string
  tags?: string[]
  collection?: { title: string; slug: { current: string } }
}

interface GalleryGridProps {
  photos: Photo[]
  onPhotoSelect?: (photo: Photo) => void
  layout?: 'masonry' | 'grid' | 'justified'
  showHover?: boolean
}

export function GalleryGrid({ 
  photos, 
  onPhotoSelect, 
  layout = 'grid',
  showHover = true 
}: GalleryGridProps) {
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null)

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const photoVariants = {
    initial: { opacity: 0, y: 40, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    hover: { y: -8, scale: 1.02 }
  }

  const getGridClass = () => {
    switch (layout) {
      case 'masonry':
        return 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
      case 'justified':
        return 'flex flex-wrap gap-4 justify-center'
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
    }
  }

  if (layout === 'masonry') {
    return (
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className={getGridClass()}
      >
        {photos.map((photo) => (
          <motion.div
            key={photo._id}
            variants={{
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0 }
            }}
            className="break-inside-avoid mb-4"
            onMouseEnter={() => setHoveredPhoto(photo._id)}
            onMouseLeave={() => setHoveredPhoto(null)}
          >
            <div className="relative group cursor-pointer bg-card rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-border">
              <div 
                className="relative aspect-auto overflow-hidden rounded-2xl"
                onClick={() => onPhotoSelect?.(photo)}
              >
                <Image
                  src={getThumbnailUrl(photo.imageId)}
                  alt={photo.alt || photo.title}
                  width={500}
                  height={0}
                  style={{ height: 'auto' }}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='500' height='300' fill='%23111827' filter='url(%23b)'/%3E%3C/svg%3E"
                  loading="lazy"
                />
                
                {/* Enhanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {showHover && hoveredPhoto === photo._id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm"
                  >
                    <div className="flex space-x-4">
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                      >
                        <Eye className="w-5 h-5 text-foreground" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                      >
                        <Heart className="w-5 h-5 text-foreground" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                      >
                        <Share2 className="w-5 h-5 text-foreground" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                
                {/* Photo Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="bg-card/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-border">
                    <Link href={`/photo/${photo.slug.current}`}>
                      <h3 className="font-bold text-sm text-foreground hover:text-blue-500 transition-colors line-clamp-1 mb-1">
                        {photo.title}
                      </h3>
                      {photo.collection && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {photo.collection.title}
                        </p>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={getGridClass()}
    >
      {photos.map((photo) => (
        <motion.div
          key={photo._id}
          variants={photoVariants}
          whileHover="hover"
          className="group"
          onMouseEnter={() => setHoveredPhoto(photo._id)}
          onMouseLeave={() => setHoveredPhoto(null)}
        >
          <div className="relative bg-card rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-border">
            <div 
              className="relative cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => onPhotoSelect?.(photo)}
            >
              <Image
                src={getThumbnailUrl(photo.imageId)}
                alt={photo.alt || photo.title}
                width={400}
                height={300}
                className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='400' height='300' fill='%23111827' filter='url(%23b)'/%3E%3C/svg%3E"
                loading="lazy"
              />
              
              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {showHover && hoveredPhoto === photo._id && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <div className="flex space-x-4">
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                    >
                      <Eye className="w-5 h-5 text-foreground" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                    >
                      <Heart className="w-5 h-5 text-foreground" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-card/90 backdrop-blur-md rounded-full hover:bg-card transition-all duration-200 shadow-lg border border-border"
                    >
                      <Share2 className="w-5 h-5 text-foreground" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
              
              {/* Photo Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="bg-card/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-border">
                  <Link href={`/photo/${photo.slug.current}`}>
                    <h3 className="font-bold text-sm text-foreground hover:text-blue-500 transition-colors line-clamp-1 mb-1">
                      {photo.title}
                    </h3>
                    {photo.collection && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        {photo.collection.title}
                      </p>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}