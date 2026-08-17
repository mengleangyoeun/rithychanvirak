'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Play, LayoutGrid, List, Film, X, Calendar, ArrowUpRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Video {
  _id: string
  title: string
  slug: { current: string }
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnailUrl?: string
  description?: string
  category?: string
  year?: number
  tags?: string[]
}

function VideoCard({ video, index, viewMode }: { video: Video; index: number; viewMode: 'grid' | 'full' }) {
  const [isHovered, setIsHovered] = useState(false)
  const [embedError, setEmbedError] = useState(false)

  const getVideoThumbnail = (vid: Video) => {
    if (vid.thumbnailUrl) {
      return vid.thumbnailUrl
    }

    if (vid.videoType === 'youtube') {
      const videoId = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    } else if (vid.videoType === 'vimeo') {
      const videoId = vid.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
      if (videoId) {
        return `https://vumbnail.com/${videoId}.jpg`
      }
    }

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect width="800" height="450" fill="%2309090b"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="20" fill="%23ffffff30"%3ECinema Motion%3C/text%3E%3C/svg%3E'
  }

  const getEmbedUrl = (vid: Video) => {
    if (vid.videoType === 'youtube') {
      const videoId = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`
    } else if (vid.videoType === 'vimeo') {
      const videoId = vid.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&background=1`
    } else if (vid.videoType === 'googledrive') {
      const fileIdMatch = vid.videoUrl.match(/\/d\/([^/]+)/) || vid.videoUrl.match(/[?&]id=([^&]+)/)
      const fileId = fileIdMatch?.[1]
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
    }
    return vid.videoUrl
  }

  if (viewMode === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group rounded-3xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden hover:border-zinc-700 transition-all duration-300 shadow-xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Video Preview Aspect Left */}
          <div
            className="lg:col-span-7 relative aspect-video overflow-hidden bg-black cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Link href={`/video/${video.slug.current}`} className="block w-full h-full">
              {!isHovered ? (
                <Image
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  priority={index < 2}
                />
              ) : (
                <div className="w-full h-full">
                  {!embedError ? (
                    <iframe
                      src={getEmbedUrl(video)}
                      className="w-full h-full pointer-events-none"
                      allow="autoplay; muted"
                      style={{ border: 'none' }}
                      onError={() => setEmbedError(true)}
                    />
                  ) : (
                    <Image
                      src={getVideoThumbnail(video)}
                      alt={video.title}
                      fill
                      className="object-cover opacity-60"
                    />
                  )}
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Play Badge */}
              {!isHovered && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white text-black transition-all duration-300 shadow-2xl">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Info Details Right */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {video.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {video.category}
                  </span>
                )}
                {video.year && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {video.year}
                  </span>
                )}
              </div>

              <Link href={`/video/${video.slug.current}`} className="group/title block">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover/title:text-primary transition-colors">
                  {video.title}
                </h3>
              </Link>

              {video.description && (
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
                  {video.description}
                </p>
              )}

              {video.tags && video.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  {video.tags.map((t, idx) => (
                    <span key={idx} className="text-[11px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
              <Link
                href={`/video/${video.slug.current}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white hover:text-zinc-300 transition-colors"
              >
                <span>Watch Film & Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      viewport={{ once: true, margin: "-50px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/video/${video.slug.current}`}>
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-800/50 border border-white/[0.06] transition-all duration-500 hover:border-white/15 hover:shadow-2xl hover:shadow-black/30">

          {/* Thumbnail */}
          <AnimatePresence mode="wait">
            {!isHovered && (
              <motion.div
                key="thumbnail"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading={index < 3 ? "eager" : "lazy"}
                  priority={index < 3}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video preview on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-10"
              >
                {!embedError ? (
                  <iframe
                    src={getEmbedUrl(video)}
                    className="w-full h-full pointer-events-none"
                    allow="autoplay; muted"
                    style={{ border: 'none' }}
                    onError={() => setEmbedError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/80">
                    <Image
                      src={getVideoThumbnail(video)}
                      alt={video.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover opacity-50"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent group-hover:from-black/40 transition-all duration-500 z-20" />

          {/* Play button */}
          <AnimatePresence>
            {!isHovered && (
              <motion.div
                key="play"
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info overlay */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-30"
            animate={{
              y: isHovered ? 16 : 0,
              opacity: isHovered ? 0 : 1
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h3 className="text-sm sm:text-base font-medium text-white mb-1.5 line-clamp-2 leading-snug">
              {video.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              {video.category && <span>{video.category}</span>}
              {video.category && video.year && <span className="text-white/20">·</span>}
              {video.year && <span>{video.year}</span>}
            </div>
          </motion.div>

        </div>
      </Link>
    </motion.div>
  )
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'full'>('grid')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data: videosData, error } = await supabase
          .from('videos')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true })

        if (error) {
          console.error('Error fetching videos:', error)
          setVideos([])
          setFilteredVideos([])
        } else {
          const transformedVideos: Video[] = (videosData || []).map(video => ({
            _id: video.id,
            title: video.title,
            slug: { current: video.slug },
            videoUrl: video.video_url,
            videoType: video.video_type,
            thumbnailUrl: video.thumbnail_url,
            description: video.description,
            category: video.category,
            year: video.year,
            tags: video.tags || []
          }))

          setVideos(transformedVideos)
          setFilteredVideos(transformedVideos)
        }
      } catch (error) {
        console.error('Error fetching videos:', error)
        setVideos([])
        setFilteredVideos([])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  useEffect(() => {
    let filtered = [...videos]

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower) ||
        video.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    setFilteredVideos(filtered)
  }, [videos, searchTerm, selectedCategory])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const v of videos) {
      if (v.category && v.category.trim()) set.add(v.category.trim())
    }
    return ['all', ...Array.from(set)]
  }, [videos])

  return (
    <main className="min-h-screen bg-[#030303] text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-28 space-y-12">

        {/* Hero Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold text-zinc-300 backdrop-blur-md">
            <Film className="w-3.5 h-3.5 text-zinc-400" />
            Motion Picture & Directing Showcase
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Films & Motion
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Commercial cinema, documentary storytelling, and bespoke visual direction.
          </p>
        </section>

        {/* Filter, Search & View Switcher Bar */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 backdrop-blur-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search films by title, concept, or tags..."
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

            {/* View Mode Toggle */}
            <div className="flex items-center self-end md:self-auto rounded-2xl border border-zinc-800 bg-zinc-900/90 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('full')}
                className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  viewMode === 'full' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Cinematic</span>
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-zinc-900 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-white text-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat === 'all' ? 'All Productions' : cat}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Video Collection Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-800/60" />
                <div className="p-5 space-y-2 bg-zinc-950">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-8'
          }>
            {filteredVideos.map((video, index) => (
              <VideoCard key={video._id} video={video} index={index} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Film className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No films found</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {searchTerm || selectedCategory !== 'all'
                ? 'No motion works match your active search or category filters.'
                : 'Films will appear here once published from the admin dashboard.'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="rounded-xl border-zinc-800 text-xs font-semibold"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
