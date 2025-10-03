'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'

interface Collection {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  coverImage?: { asset: { _ref: string }; alt?: string }
  totalPhotos: number
  subAlbums: number
}

export function Portfolio({ collections }: { collections: Collection[] }) {
  if (!collections || collections.length === 0) return null

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-[0.08em] sm:tracking-[0.1em] uppercase mb-4 sm:mb-6 px-4"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            >
              Portfolio
            </h2>
            <motion.div
              className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-4 sm:mb-6"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
            <p className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
              Explore curated collections showcasing diverse photography styles and unforgettable moments
            </p>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto">
          {collections.map((collection, index) => (
            <motion.div
              key={collection._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              className="relative group cursor-pointer h-80 sm:h-96 overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10"
              whileHover={{ y: -12, scale: 1.02 }}
            >
              <Link href={`/collection/${collection.slug.current}`} className="block h-full">
                <div className="h-full relative overflow-hidden rounded-3xl">
                  {collection.coverImage && (
                    <Image
                      src={urlFor(collection.coverImage).width(600).height(500).url()}
                      alt={collection.coverImage.alt || collection.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  )}

                  {/* Gradient Overlay - stronger on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent group-hover:from-black/80 group-hover:via-black/30 transition-all duration-500"></div>

                  {/* Content - hidden by default, shown on hover */}
                  <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <h3
                      className="text-xl sm:text-2xl font-bold text-white mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                      style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
                    >
                      {collection.title}
                    </h3>

                    {collection.description && (
                      <p className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4 line-clamp-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {collection.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-white/70 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span>📸</span>
                        <span>{collection.totalPhotos}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span>📁</span>
                        <span>{collection.subAlbums}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
