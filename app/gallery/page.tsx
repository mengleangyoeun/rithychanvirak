'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search, Folder, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { CollectionCardSkeleton } from '@/components/collection-card-skeleton'
import type { Collection } from '@/types/database'

interface CollectionWithStats extends Collection {
  totalPhotos: number
  subAlbums: number
}

// Helper function to count photos recursively
async function countPhotosRecursively(
  collectionId: string,
  supabase: ReturnType<typeof createClient>,
  collectionMap: Map<string, Collection>
): Promise<number> {
  // Count direct photos
  const { count: directCount } = await supabase
    .from('collection_photos')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId)

  let totalCount = directCount || 0

  // Count photos in child collections recursively
  for (const [id, collection] of collectionMap) {
    if (collection.parent_id === collectionId) {
      totalCount += await countPhotosRecursively(id, supabase, collectionMap)
    }
  }

  return totalCount
}

export default function GalleryPage() {
  const supabase = createClient()
  const [collections, setCollections] = useState<CollectionWithStats[]>([])
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCollections() {
      try {
        // Fetch all collections to build the hierarchy
        const { data: allCollections, error: allCollectionsError } = await supabase
          .from('collections')
          .select('*')
          .order('order', { ascending: true })

        if (allCollectionsError) throw allCollectionsError

        // Build collection map for efficient lookups
        const collectionMap = new Map<string, Collection>()
        allCollections?.forEach(collection => {
          collectionMap.set(collection.id, collection)
        })

        // Filter root collections
        const rootCollections = allCollections?.filter(collection => !collection.parent_id) || []

        // Get stats for each root collection
        const collectionsWithStats: CollectionWithStats[] = await Promise.all(
          rootCollections.map(async (collection) => {
            // Count subcollections
            const { count: subAlbumsCount } = await supabase
              .from('collections')
              .select('*', { count: 'exact', head: true })
              .eq('parent_id', collection.id)

            // Count photos recursively (direct + through subcollections)
            const totalPhotos = await countPhotosRecursively(collection.id, supabase, collectionMap)

            return {
              ...collection,
              totalPhotos,
              subAlbums: subAlbumsCount || 0
            }
          })
        )

        setCollections(collectionsWithStats)
        setFilteredCollections(collectionsWithStats)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching collections:', error)
        setLoading(false)
      }
    }

    fetchCollections()
  }, [supabase])

  useEffect(() => {
    let filtered = [...collections]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(collection =>
        collection.title.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredCollections(filtered)
  }, [collections, searchTerm])

  // Remove the old loading check - we'll show skeletons inline instead

  const totalPhotos = collections.reduce((total, collection) => total + (collection.totalPhotos || 0), 0)

  return (
    <main className="unified-background min-h-screen">
      <div className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            >
              GALLERY
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            {!loading && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-white/70 max-w-2xl mx-auto mb-8"
              >
                Explore {collections.length} collection{collections.length !== 1 ? 's' : ''} featuring {totalPhotos} photograph{totalPhotos !== 1 ? 's' : ''}
              </motion.p>
            )}

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-md mx-auto"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5 z-10" />
              <Input
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-base rounded-full border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 focus-visible:ring-offset-0"
              />
            </motion.div>
          </motion.div>

          {/* Collections Grid */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <CollectionCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredCollections.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Link
                    href={`/collection/${collection.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/20 hover:bg-white/10">

                      {/* Image */}
                      {collection.cover_image_url && (
                        <Image
                          src={collection.cover_image_url}
                          alt={collection.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          loading={index < 3 ? "eager" : "lazy"}
                          priority={index < 3}
                        />
                      )}

                      {/* Gradient Overlay - always visible, stronger on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:from-black/40 md:via-black/10 md:group-hover:from-black/80 md:group-hover:via-black/30 transition-all duration-500"></div>

                      {/* Content - always visible on mobile, shown on hover on desktop */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-end md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                        <h3
                          className="text-2xl font-bold text-white mb-2 md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300"
                          style={{ fontFamily: /[\u1780-\u17FF]/.test(collection.title) ? '"Kantumruy Pro", sans-serif' : undefined }}
                        >
                          {collection.title}
                        </h3>

                        {collection.description && (
                          <p className="text-sm text-white/80 mb-4 line-clamp-2 md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300 md:delay-75">
                            {collection.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-white/70 md:transform md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-300 md:delay-100">
                          <div className="flex items-center gap-1">
                            <span>📸</span>
                            <span>{collection.totalPhotos}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📁</span>
                            <span>{collection.subAlbums}</span>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center py-20"
            >
              <Folder className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm ? 'No collections found' : 'No collections yet'}
              </h3>
              <p className="text-white/60">
                {searchTerm
                  ? `No collections match "${searchTerm}"`
                  : 'Collections will appear here soon'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
