'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, FolderOpen } from 'lucide-react'
import { CollectionCardSkeletonPortfolio } from '@/components/collection-card-skeleton'
import { getBlurPlaceholderDataUrl, getThumbnailFromSource } from '@/lib/cloudinary'
import type { CollectionWithStats } from '@/lib/collections'

export function Portfolio({
  collections,
  loading = false,
  showTitle = true,
}: {
  collections: CollectionWithStats[]
  loading?: boolean
  showTitle?: boolean
}) {
  if (!loading && (!collections || collections.length === 0)) return null

  return (
    <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 sm:p-10 hover:border-zinc-700/80 transition-colors duration-500 relative flex flex-col h-full">
      {/* Section Title - conditionally shown */}
      {showTitle && (
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-white mb-2 uppercase">
              Featured Albums
            </h2>
            <p className="text-zinc-400 text-sm">
              Explore curated photography styles and unforgettable moments.
            </p>
          </div>
          <Link
            href="/gallery"
            className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-1.5 shrink-0 mt-1 group"
          >
            View all
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3]">
              <CollectionCardSkeletonPortfolio />
            </div>
          ))
        ) : (
          collections.slice(0, 9).map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl bg-white/5 border border-white/10 aspect-[4/3]"
          >
            {/* Force cache bust */}
            <Link href={`/collection/${collection.slug}`} className="block h-full">
              <div className="h-full relative overflow-hidden rounded-2xl">
                {/* Image Collage or Fallback */}
                {(() => {
                  const previewImages =
                    collection.previewPhotos && collection.previewPhotos.length > 0
                      ? collection.previewPhotos
                      : collection.cover_image_url
                      ? [collection.cover_image_url]
                      : []
                  
                  if (previewImages.length > 0) {
                    return previewImages.slice(0, 3).reverse().map((url: string, i: number, arr: string[]) => {
                      const offset = arr.length - 1 - i
                      
                      let transformClass = 'z-30 group-hover:scale-105'
                      if (offset === 1) transformClass = 'z-20 scale-[0.92] -translate-y-3 opacity-80 shadow-lg'
                      if (offset === 2) transformClass = 'z-10 scale-[0.84] -translate-y-6 opacity-60 shadow-xl'
                      
                      return (
                        <Image
                          key={`${url}-${i}`}
                          src={getThumbnailFromSource(url, 1200)}
                          alt={collection.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className={`object-cover absolute inset-0 transition-transform duration-700 ease-out ${transformClass}`}
                          placeholder="blur"
                          blurDataURL={getBlurPlaceholderDataUrl(64, 48)}
                        />
                      )
                    })
                  }

                  return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/40 text-zinc-500 gap-2">
                      <FolderOpen className="w-12 h-12 stroke-[1.5] text-white/30" />
                      <span className="text-[11px] uppercase tracking-widest font-light text-white/40">Album</span>
                    </div>
                  )
                })()}

                {/* Gradient Overlay - smooth reveal on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-40 pointer-events-none"></div>

                {/* Content - reveals on hover */}
                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-40 pointer-events-none">
                  <h3
                    className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-md"
                    style={{ fontFamily: /[\u1780-\u17FF]/.test(collection.title) ? '"Kantumruy Pro", sans-serif' : 'var(--font-livvic), sans-serif' }}
                  >
                    {collection.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-xs font-medium text-white/90">{collection.totalPhotos} Photos</span>
                    </div>
                    {collection.subAlbums > 0 && (
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                        <FolderOpen className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-xs font-medium text-white/90">{collection.subAlbums} Albums</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 z-40">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))
        )}
      </div>
    </section>
  )
}
