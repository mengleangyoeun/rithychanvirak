'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Play, Grid2x2, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { VideoCardSkeleton } from '@/components/video-card-skeleton'

interface Video {
  _id: string
  title: string
  slug: { current: string }
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnail?: { asset: { _ref: string }; alt?: string }
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
    // 1. Check for custom thumbnail URL
    if (vid.thumbnailUrl) {
      return vid.thumbnailUrl
    }

    // 2. Fall back to video platform thumbnails
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

    // 3. Placeholder if nothing else works
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
                      alt={video.thumbnail?.alt || video.title}
                      fill
                      sizes={viewMode === 'grid' ? '(max-width: 768px) 100vw, 50vw' : '100vw'}
                      className="object-cover opacity-50"
                    />
                  </div>
                )}
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
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" fill="white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Overlay - Slides down and fades out on hover */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-30"
            animate={{
              y: isHovered ? 20 : 0,
              opacity: isHovered ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-xs sm:text-sm text-white/70 line-clamp-2 mb-2 sm:mb-3 hidden sm:block">
                    {video.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-white/60">
                  {video.category && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/10 rounded-full">
                      {video.category}
                    </span>
                  )}
                  {video.year && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/10 rounded-full">
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
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })

          // Check if it's specifically a "table doesn't exist" error
          const isTableNotExistError = error.code === 'PGRST116' ||
            (error.message && (
              error.message.includes('relation "public.videos" does not exist') ||
              error.message.includes('videos') && error.message.includes('does not exist')
            ))

          if (isTableNotExistError) {
            console.warn('Videos table does not exist. Please run the database migration in Supabase Dashboard > SQL Editor.')
            console.warn('Copy the contents of database_migration.sql and run it in your Supabase dashboard.')
          } else {
            console.warn('Videos table exists but there was an error fetching data. This might be a permissions issue or data format problem.')
          }

          setVideos([])
          setFilteredVideos([])
        } else {
          // Transform data to match the expected interface
          const transformedVideos = (videosData || []).map(video => ({
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
              VIDEOS
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
                Explore {videos.length} video{videos.length !== 1 ? 's' : ''} showcasing my videography work
              </motion.p>
            )}

            {/* Search and View Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              {/* Search */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5 z-10" />
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
          {loading ? (
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
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                >
                  <VideoCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredVideos.length > 0 ? (
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
                {searchTerm ? 'No videos found' : 'Videos Database Setup Required'}
              </h3>
              <p className="text-white/60 mb-4">
                {searchTerm
                  ? `No videos match "${searchTerm}"`
                  : 'The videos database table needs to be created.'}
              </p>
              {!searchTerm && (
                <div className="bg-white/10 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-white/80 mb-2">To enable videos:</p>
                  <ol className="text-xs text-white/70 text-left space-y-1">
                    <li>1. Go to Supabase Dashboard → SQL Editor</li>
                    <li>2. Copy contents of <code className="bg-black/20 px-1 rounded">database_migration.sql</code></li>
                    <li>3. Run the SQL to create tables</li>
                    <li>4. Refresh this page</li>
                  </ol>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
