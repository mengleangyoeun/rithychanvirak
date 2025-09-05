'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search, Folder } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface Collection {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  coverImage?: { asset: { _ref: string }; alt?: string }
  totalPhotos: number
  subAlbums: number
  subAlbumBreakdown?: Array<{ photoCount: number }>
}

export default function GalleryPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCollections() {
      try {
        const collectionsData = await client.fetch(`
          *[_type == "collection" && !defined(parentCollection)] | order(order asc) {
            _id,
            title,
            slug,
            description,
            coverImage,
            "subAlbums": count(*[_type == "collection" && parentCollection._ref == ^._id]),
            "subAlbumBreakdown": *[_type == "collection" && parentCollection._ref == ^._id]{
              "photoCount": count(*[_type == "photo" && collection._ref == ^._id])
            }
          }
        `)
        
        // Calculate totalPhotos by summing photoCount from all sub-albums like in home page
        const collectionsWithTotals = collectionsData?.map((collection: Collection) => ({
          ...collection,
          totalPhotos: collection.subAlbumBreakdown?.reduce((sum: number, subAlbum: { photoCount: number }) => sum + subAlbum.photoCount, 0) || 0
        })) || []
        
        console.log('Collections data:', collectionsWithTotals)
        setCollections(collectionsWithTotals)
        setFilteredCollections(collectionsWithTotals)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching collections:', error)
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  useEffect(() => {
    let filtered = [...collections]

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(collection =>
        collection.title.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredCollections(filtered)
  }, [collections, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <Skeleton className="w-full h-48 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="unified-background">
      {/* Collections Section - Equal Size Grid */}
      {filteredCollections.length > 0 ? (
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="relative max-w-7xl mx-auto">
            {/* Enhanced Section Title */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase mb-4" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                  Portfolio
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6"></div>
                <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                  Discover my curated collections showcasing different styles and moments
                </p>
                
                {/* Total Counts */}
                {!loading && (
                  <div className="flex justify-center items-center gap-6 mb-8">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                      <span className="text-2xl">📁</span>
                      <span className="text-lg font-semibold text-white">
                        {collections.length} Collection{collections.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                      <span className="text-2xl">📸</span>
                      <span className="text-lg font-semibold text-white">
                        {collections.reduce((total, collection) => total + (collection.totalPhotos || 0), 0)} Total Photos
                      </span>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base rounded-full border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </motion.div>
            </div>
            
            {/* Equal Size Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {filteredCollections.map((collection) => (
                <motion.div 
                  key={collection._id}
                  className="relative group cursor-pointer h-80 overflow-hidden rounded-2xl"
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Link href={`/collection/${collection.slug.current}`}>
                    <div className="h-full relative overflow-hidden rounded-2xl">
                      {/* Collection Image */}
                      {collection.coverImage && (
                        <Image
                          src={urlFor(collection.coverImage).width(600).height(400).url()}
                          alt={collection.coverImage.alt || collection.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      )}
                      
                      {/* Gradient overlay for better contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl"></div>
                      
                      {/* Glow border effect */}
                      <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-white/30 group-hover:shadow-lg group-hover:shadow-white/20 transition-all duration-300"></div>
                      
                      {/* Collection Title - Smooth slide up */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-out">
                        <div className="text-center">
                          <h3 
                            className="text-xl lg:text-2xl font-bold text-white mb-2 tracking-wide leading-tight"
                            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
                          >
                            {collection.title}
                          </h3>
                          {collection.description && (
                            <p className="text-sm text-white/90 font-medium max-w-xs mx-auto leading-relaxed mb-3 line-clamp-2">
                              {collection.description}
                            </p>
                          )}
                          
                          {/* Photo and Sub-collection counts - Compact design */}
                          <div className="flex justify-center items-center gap-4 text-white/80 text-xs font-medium">
                            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                              <span>📸</span>
                              <span>{collection.totalPhotos} Photos</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                              <span>📁</span>
                              <span>{collection.subAlbums} Albums</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover indicator */}
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative py-24 px-6 overflow-hidden min-h-screen flex items-center">
          <div className="relative max-w-7xl mx-auto w-full">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase mb-4" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                  Portfolio
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6"></div>
                <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed mb-12">
                  Discover my curated collections showcasing different styles and moments
                </p>
                
                {/* Search Bar */}
                <div className="relative max-w-md mx-auto mb-12">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <Input
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base rounded-full border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/20"
                  />
                </div>

                {/* Empty State */}
                <div className="max-w-md mx-auto">
                  <Folder className="w-16 h-16 mx-auto mb-4 text-white/40" />
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {searchTerm ? 'No collections found' : 'No collections yet'}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {searchTerm 
                      ? `No collections match "${searchTerm}". Try searching with different keywords.`
                      : 'Collections will appear here as they are added to the portfolio.'
                    }
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}