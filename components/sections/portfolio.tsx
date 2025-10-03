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
            <motion.span
              className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/80 text-xs sm:text-sm font-medium tracking-wide mb-4 sm:mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Featured Collections
            </motion.span>
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

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Content overlay */}
                  <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                      viewport={{ once: true }}
                    >
                      <h3
                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-wide leading-tight group-hover:translate-y-[-4px] transition-transform duration-300"
                        style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
                      >
                        {collection.title}
                      </h3>

                      {collection.description && (
                        <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xs leading-relaxed mb-3 sm:mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          {collection.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3 text-white/90 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-white/10">
                          <span>📸</span>
                          <span>{collection.totalPhotos}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-white/10">
                          <span>📁</span>
                          <span>{collection.subAlbums}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center group-hover:rotate-45">
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
