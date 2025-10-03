'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Play, Grid2x2, List } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Video {
  _id: string
  title: string
  slug: { current: string }
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnail?: { asset: { _ref: string }; alt?: string }
  description?: string
  category?: string
  year?: number
  tags?: string[]
}

function VideoCard({ video, index, viewMode }: { video: Video; index: number; viewMode: 'grid' | 'full' }) {
  const [isHovered, setIsHovered] = useState(false)

  const getVideoThumbnail = (vid: Video) => {
    if (vid.thumbnail?.asset?._ref) {
      try {
        return urlFor(vid.thumbnail).width(800).height(450).url()
      } catch (error) {
        console.error('Error generating thumbnail URL:', error)
      }
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

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect width="800" height="450" fill="%23111827"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="%23ffffff40"%3ENo Thumbnail%3C/text%3E%3C/svg%3E'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link href={`/video/${video.slug.current}`}>
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-500 hover:border-white/20 hover:bg-white/10">

          {/* Thumbnail - Hidden on hover */}
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
                  alt={video.thumbnail?.alt || video.title}
                  fill
                  sizes={viewMode === 'grid' ? '(max-width: 768px) 100vw, 50vw' : '100vw'}
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='800' height='450' fill='%23111827' filter='url(%23b)'/%3E%3C/svg%3E"
                  loading={index < 2 ? "eager" : "lazy"}
                  priority={index < 2}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video Preview - Shown on hover */}
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
                <iframe
                  src={getEmbedUrl(video)}
                  className="w-full h-full pointer-events-none"
                  allow="autoplay; muted"
                  style={{ border: 'none' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500 z-20"></div>

          {/* Play Button - Hidden on hover */}
          <AnimatePresence>
            {!isHovered && (
              <motion.div
                key="play"
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Overlay - Slides down and fades out on hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6 z-30"
            animate={{
              y: isHovered ? 20 : 0,
              opacity: isHovered ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-3">
                    {video.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                  {video.category && (
                    <span className="px-3 py-1 bg-white/10 rounded-full">
                      {video.category}
                    </span>
                  )}
                  {video.year && (
                    <span className="px-3 py-1 bg-white/10 rounded-full">
                      {video.year}
                    </span>
                  )}
                </div>
              </div>
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
    async function fetchVideos() {
      try {
        const videosData = await client.fetch(`
          *[_type == "video"] | order(order asc, year desc) {
            _id,
            title,
            slug,
            videoUrl,
            videoType,
            thumbnail,
            description,
            category,
            year,
            tags
          }
        `)

        setVideos(videosData || [])
        setFilteredVideos(videosData || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching videos:', error)
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  useEffect(() => {
    let filtered = [...videos]

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category === selectedCategory)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower) ||
        video.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    setFilteredVideos(filtered)
  }, [videos, searchTerm, selectedCategory])

  const categories = ['all', ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))] as string[]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground/70">Loading videos...</div>
      </div>
    )
  }

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
              ALL VIDEOS
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-white/70 max-w-2xl mx-auto mb-8"
            >
              Explore {videos.length} video{videos.length !== 1 ? 's' : ''} showcasing my videography work
            </motion.p>

            {/* Search and View Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              {/* Search */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <Input
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base rounded-full border-0 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 focus-visible:ring-offset-0"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1">
                <button
                  onClick={() => setViewMode('full')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'full' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                  }`}
                  aria-label="Full view"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid2x2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Videos Grid */}
          {filteredVideos.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                  : 'space-y-8'
              }
            >
              {filteredVideos.map((video, index) => (
                <VideoCard key={video._id} video={video} index={index} viewMode={viewMode} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center py-20"
            >
              <Play className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-2xl font-bold text-white mb-3">
                {searchTerm ? 'No videos found' : 'No videos yet'}
              </h3>
              <p className="text-white/60">
                {searchTerm
                  ? `No videos match "${searchTerm}"`
                  : 'Videos will appear here soon'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
