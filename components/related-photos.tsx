'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { getOptimizedImageUrl } from '@/lib/cloudinary'
import { ArrowRight } from 'lucide-react'

interface Photo {
  _id: string
  title: string
  slug: { current: string }
  imageUrl: string
  imageId: string
  alt: string
}

interface RelatedPhotosProps {
  photos: Photo[]
  collectionSlug?: string
  onPhotoSelect: (index: number) => void
}

export function RelatedPhotos({ photos, collectionSlug, onPhotoSelect }: RelatedPhotosProps) {
  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gradient-to-b from-background to-card relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-8 h-px bg-foreground"></div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Related <span className="italic font-light">Photos</span>
            </h2>
            <div className="w-8 h-px bg-foreground"></div>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Discover more photos from the same collections and similar themes
          </p>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
        >
          {photos.map((photo, index) => (
            <motion.div
              key={photo._id}
              variants={{
                initial: { opacity: 0, y: 60, scale: 0.9 },
                animate: { 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }
              }}
              whileHover={{ 
                y: -12, 
                scale: 1.05
              }}
              className="group"
            >
              <div className="relative">
                <div 
                  className="cursor-pointer" 
                  onClick={(e) => {
                    e.preventDefault()
                    onPhotoSelect(index)
                  }}
                >
                  <div className="bg-card rounded-2xl border border-border relative overflow-hidden mb-3 shadow-lg group-hover:shadow-2xl transition-all duration-500">
                    <Image
                      src={getOptimizedImageUrl(photo.imageId, 400)}
                      alt={photo.alt || photo.title}
                      width={400}
                      height={0}
                      style={{ height: 'auto' }}
                      className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-card/90 backdrop-blur-md rounded-full p-2 border border-border shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link href={`/photo/${photo.slug.current}`}>
                  <h3 className="font-bold text-foreground text-sm hover:text-blue-500 transition-colors duration-300 line-clamp-2 leading-tight">
                    {photo.title}
                  </h3>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Call-to-action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mt-16"
        >
          <Link
            href={collectionSlug ? `/collection/${collectionSlug}` : '/gallery'}
            className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white inline-flex items-center text-lg px-8 py-4 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl font-bold"
          >
            {collectionSlug ? 'Explore Full Collection' : 'Explore Full Gallery'}
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}