'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search, Image as ImageIcon, FolderOpen, ArrowUpRight, X, Layers, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getBlurPlaceholderDataUrl, getThumbnailFromSource } from '@/lib/cloudinary'
import type { CollectionWithStats } from '@/lib/collections'

interface GalleryViewProps {
  collections: CollectionWithStats[]
  totalPhotosCount: number
}

export function GalleryView({ collections, totalPhotosCount }: GalleryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'featured' | 'nested'>('all')

  const filteredCollections = useMemo(() => {
    let list = [...collections]

    if (filterType === 'featured') {
      list = list.filter(c => c.featured)
    } else if (filterType === 'nested') {
      list = list.filter(c => c.subAlbums > 0)
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      )
    }

    return list
  }, [collections, searchTerm, filterType])

  const featuredCount = useMemo(() => collections.filter(c => c.featured).length, [collections])

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-28 space-y-12">

        {/* Hero Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 backdrop-blur-md">
            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
            Curated Photographic Archives
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Photo Collections
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Explore {collections.length} {collections.length === 1 ? 'collection' : 'collections'} and{' '}
            {totalPhotosCount} photographs across cultural landscapes, portraits, and commercial archives.
          </p>
        </section>

        {/* Search & Filter Bar */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search collections and albums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-9 h-11 text-xs sm:text-sm rounded-2xl border-zinc-800 bg-zinc-900/90 text-white placeholder:text-zinc-500 focus:border-zinc-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                All ({collections.length})
              </button>

              {featuredCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType('featured')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterType === 'featured'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  Featured ({featuredCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setFilterType('nested')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === 'nested'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                With Sub-Albums
              </button>
            </div>
          </div>
        </section>

        {/* Collections Grid */}
        {filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCollections.map((collection, index) => {
              const previewImages =
                collection.previewPhotos && collection.previewPhotos.length > 0
                  ? collection.previewPhotos
                  : collection.cover_image_url
                  ? [collection.cover_image_url]
                  : []

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link href={`/collection/${collection.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/20 hover:bg-white/10">
                      {/* Image Collage or Fallback */}
                      {previewImages.length > 0 ? (
                        previewImages
                          .slice(0, 3)
                          .reverse()
                          .map((url: string, i: number, arr: string[]) => {
                            const offset = arr.length - 1 - i
                            const isTop = offset === 0

                            let transformClass = 'z-30 group-hover:scale-105'
                            if (offset === 1)
                              transformClass = 'z-20 scale-[0.92] -translate-y-3 opacity-80 shadow-lg'
                            if (offset === 2)
                              transformClass = 'z-10 scale-[0.84] -translate-y-6 opacity-60 shadow-xl'

                            return (
                              <Image
                                key={`${url}-${i}`}
                                src={getThumbnailFromSource(url, 1200)}
                                alt={collection.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className={`object-cover absolute inset-0 transition-transform duration-700 ${transformClass}`}
                                loading={index < 3 && isTop ? 'eager' : 'lazy'}
                                priority={index < 3 && isTop}
                                placeholder="blur"
                                blurDataURL={getBlurPlaceholderDataUrl(64, 48)}
                              />
                            )
                          })
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800/40 text-zinc-500 gap-2">
                          <FolderOpen className="w-12 h-12 stroke-[1.5] text-white/30" />
                          <span className="text-[11px] uppercase tracking-widest font-light text-white/40">
                            Album
                          </span>
                        </div>
                      )}

                      {/* Gradient Overlay - smooth reveal on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none z-40" />

                      {/* Content - reveals on hover */}
                      <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none z-40">
                        <h3
                          className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2 drop-shadow-md"
                          style={{
                            fontFamily: /[\u1780-\u17FF]/.test(collection.title)
                              ? '"Kantumruy Pro", sans-serif'
                              : 'var(--font-livvic), sans-serif',
                          }}
                        >
                          {collection.title}
                        </h3>

                        {/* Stats */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                            <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                            <span className="text-xs font-medium text-white/90">
                              {collection.totalPhotos} Photos
                            </span>
                          </div>
                          {collection.subAlbums > 0 && (
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                              <FolderOpen className="w-3.5 h-3.5 text-white/80" />
                              <span className="text-xs font-medium text-white/90">
                                {collection.subAlbums} Albums
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Arrow Badge */}
                      <div className="absolute top-4 right-4 z-40 pointer-events-none">
                        <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                          <ArrowUpRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No collections found</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {searchTerm || filterType !== 'all'
                ? `No albums match your search query or active filter.`
                : 'Collections will appear here once created from the admin dashboard.'}
            </p>
            {(searchTerm || filterType !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                }}
                className="rounded-xl border-zinc-800 text-xs font-semibold"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
