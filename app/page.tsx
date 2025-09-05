'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { getOptimizedImageUrl } from '@/lib/cloudinary'

interface Photo {
  _id: string
  title: string
  slug: { current: string }
  imageUrl: string
  imageId: string
  alt: string
  description?: string
  collection?: { title: string; slug: { current: string } }
}

interface Collection {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  coverImage?: { asset: { _ref: string }; alt?: string }
  totalPhotos: number
  subAlbums: number
  subAlbumBreakdown?: { photoCount: number }[]
}

interface HeroData {
  _id: string
  title?: string
  subtitle?: string
  backgroundImage?: { asset: { _ref: string }; alt?: string }
  overlayOpacity?: number
}

async function getFeaturedPhotos() {
  return client.fetch(`
    *[_type == "photo" && featured == true && defined(imageUrl)] | order(_createdAt desc)[0...6] {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      alt,
      description,
      collection-> {
        title,
        slug
      }
    }
  `)
}

async function getFeaturedCollections() {
  return client.fetch(`
    *[_type == "collection" && featured == true && collectionType == "main" && status == "published"] | order(order asc)[0...3] {
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
}

async function getHeroData() {
  return client.fetch(`
    *[_type == "hero"][0] {
      _id,
      title,
      subtitle,
      backgroundImage,
      overlayOpacity
    }
  `)
}

export default function Home() {
  const [featuredPhotos, setFeaturedPhotos] = useState<Photo[]>([])
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([])
  const [heroData, setHeroData] = useState<HeroData | null>(null)
  const [, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    
    async function fetchData() {
      try {
        const [photosData, collectionsData, heroDataResult] = await Promise.all([
          getFeaturedPhotos(),
          getFeaturedCollections(),
          getHeroData()
        ])
        
        // Calculate totalPhotos by summing photoCount from all sub-albums
        if (!isCancelled) {
          const collectionsWithTotals = collectionsData?.map((collection: Collection) => ({
            ...collection,
            totalPhotos: collection.subAlbumBreakdown?.reduce((sum: number, subAlbum: { photoCount: number }) => sum + subAlbum.photoCount, 0) || 0
          })) || []
          setFeaturedPhotos(photosData || [])
          setFeaturedCollections(collectionsWithTotals)
          setHeroData(heroDataResult)
          setError(null)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching data:', error)
          setError('Failed to load content. Please refresh the page.')
          setFeaturedPhotos([])
          setFeaturedCollections([])
          setHeroData(null)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isCancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-foreground text-background rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section - Minimalist Design */}
      <section className="relative h-[100vh] flex items-center justify-center overflow-hidden mt20">
        {/* Background */}
        <div className="absolute inset-0">
          {heroData?.backgroundImage ? (
            <>
              <Image
                src={urlFor(heroData.backgroundImage).url()}
                alt={heroData.backgroundImage.alt || 'Hero background'}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/50" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900 via-orange-900 to-black" />
          )}
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-8">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-[0.1em] leading-none mb-8 drop-shadow-2xl"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            RITHY<br />CHANVIRAK
          </motion.h1>
          
          <motion.p 
            className="text-base md:text-lg text-white/90 font-light tracking-wide max-w-xl mx-auto "
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            I&apos;m a Photographer who specializes in capturing moments that tell compelling stories.
          </motion.p>

          {/* Minimal Scroll Indicator */}
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-white/70 text-xs tracking-[0.3em] font-light"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
              role="button"
              tabIndex={0}
              aria-label="Scroll down to view portfolio and work sections"
            >
              (Scroll)
            </motion.div>
          </motion.div>
        </div>
      </section>

      <main className="unified-background">
      {/* Collections Section - Equal Size Grid */}
      {featuredCollections.length > 0 && (
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
                <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
                  Discover my curated collections showcasing different styles and moments
                </p>
              </motion.div>
            </div>
            
            {/* Equal Size Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {featuredCollections.map((collection) => (
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
      )}

      {/* Dual Auto-Scrolling Photo Carousels */}
      {featuredPhotos.length > 0 && (
        <section className="relative py-16 overflow-hidden">

          <div className="relative mb-10 px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-wider uppercase mb-4" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                WORKS
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6"></div>
              <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
                A showcase of my latest photography work and creative projects
              </p>
            </motion.div>
          </div>
          
          {/* First Row - Right to Left */}
          <div className="relative overflow-hidden mb-4">
            <motion.div 
              className="flex gap-4"
              animate={{ x: [`-${featuredPhotos.length * 25}%`, `0%`] }}
              transition={{ 
                duration: featuredPhotos.length * 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...featuredPhotos].reverse().concat([...featuredPhotos].reverse(), [...featuredPhotos].reverse()).map((photo, index: number) => (
                <div 
                  key={`top-${photo._id}-${index}`}
                  className="flex-shrink-0 w-80 h-96 relative group cursor-pointer"
                >
                  <Link href={`/collection/${photo.collection?.slug.current || ''}`}>
                    <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                      <Image
                        src={getOptimizedImageUrl(photo.imageId, 450)}
                        alt={photo.alt || photo.title}
                        fill
                        sizes="320px"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        loading={index < 3 ? "eager" : "lazy"}
                      />
                      
                      {/* Modern gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      
                      {/* Enhanced Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <h3 className="text-white font-bold text-lg tracking-wide mb-2 drop-shadow-lg">
                            {photo.collection?.title || photo.title}
                          </h3>
                          <div className="w-12 h-0.5 bg-white/70 group-hover:bg-white group-hover:w-16 transition-all duration-300"></div>
                        </motion.div>
                      </div>
                      
                      {/* Hover effect circle */}
                      <div className="absolute top-6 right-6 w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-sm">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Second Row - Left to Right */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-4"
              animate={{ x: [`0%`, `-${featuredPhotos.length * 25}%`] }}
              transition={{ 
                duration: featuredPhotos.length * 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...featuredPhotos, ...featuredPhotos, ...featuredPhotos].map((photo, index: number) => (
                <div 
                  key={`bottom-${photo._id}-${index}`}
                  className="flex-shrink-0 w-80 h-96 relative group cursor-pointer"
                >
                  <Link href={`/collection/${photo.collection?.slug.current || ''}`}>
                    <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
                      <Image
                        src={getOptimizedImageUrl(photo.imageId, 450)}
                        alt={photo.alt || photo.title}
                        fill
                        sizes="320px"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        loading={index < 3 ? "eager" : "lazy"}
                      />
                      
                      {/* Modern gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      
                      {/* Enhanced Title Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <h3 className="text-white font-bold text-lg tracking-wide mb-2 drop-shadow-lg">
                            {photo.collection?.title || photo.title}
                          </h3>
                          <div className="w-12 h-0.5 bg-white/70 group-hover:bg-white group-hover:w-16 transition-all duration-300"></div>
                        </motion.div>
                      </div>
                      
                      {/* Hover effect circle */}
                      <div className="absolute top-6 right-6 w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-sm">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Modern CTA Section */}
      <motion.section 
        className="relative py-24 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Main Headline */}
            <motion.h2 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              Let&apos;s create<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                something amazing
              </span>
            </motion.h2>
            
            {/* Decorative Line */}
            <motion.div 
              className="flex items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </motion.div>
            
            {/* Enhanced Description */}
            <motion.p 
              className="text-xl sm:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed font-light mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Whether it&apos;s a portrait session, event coverage, or creative project, 
              I&apos;m here to transform your vision into captivating visual stories that last forever.
            </motion.p>
            
            {/* Enhanced CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <Link 
                  href="/contact"
                  className="relative bg-white text-black px-10 py-5 font-bold tracking-wide text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-500 inline-flex items-center gap-3 overflow-hidden"
                >
                  <span className="relative z-10">Start a Project</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative z-10"
                  >
                    →
                  </motion.div>
                  
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/gallery"
                  className="border-2 border-white/30 text-white px-10 py-5 font-bold tracking-wide text-lg rounded-2xl hover:bg-white hover:text-black transition-all duration-500 inline-flex items-center gap-3 backdrop-blur-sm"
                >
                  View My Work
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    →
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Contact Info Pills */}
            {/* <motion.div 
              className="flex flex-wrap justify-center gap-4 mt-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-white/80 text-sm">
                📧 hello@rithychanvirak.com
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-white/80 text-sm">
                📱 +1 (234) 567-8900
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-white/80 text-sm">
                ⏰ Available Mon-Sat
              </div>
            </motion.div> */}
          </motion.div>
        </div>
      </motion.section>
      </main>
    </>
  )
}
