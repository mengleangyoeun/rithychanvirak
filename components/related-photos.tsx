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
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-black/20 backdrop-blur-sm relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: 'var(--font-kantumruy-pro), sans-serif' }}>
            Related Photos
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            More from the same collection
          </p>
        </motion.div>
        
        <div className="columns-2 sm:columns-3 md:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
          {photos.map((photo, index) => (
            <motion.div
              key={photo._id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="break-inside-avoid mb-4 md:mb-6"
            >
              <div
                className="group cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  onPhotoSelect(index)
                }}
              >
                <div className="relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden shadow-lg hover:shadow-2xl hover:border-white/20 transition-all duration-500">
                  <div className="relative w-full">
                    <Image
                      src={getOptimizedImageUrl(photo.imageId, 400)}
                      alt={photo.alt || photo.title}
                      width={400}
                      height={400}
                      style={{ width: '100%', height: 'auto' }}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href={`/photo/${photo.slug.current}`} className="block mt-3">
                  <h3 className="font-medium text-white text-sm hover:text-white/70 transition-colors duration-300 line-clamp-2 leading-tight">
                    {photo.title}
                  </h3>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Call-to-action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mt-16"
        >
          <Link
            href={collectionSlug ? `/collection/${collectionSlug}` : '/gallery'}
            className="group bg-white text-black inline-flex items-center text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:bg-white/90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl font-semibold"
          >
            {collectionSlug ? 'Explore Full Collection' : 'Explore Full Gallery'}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}