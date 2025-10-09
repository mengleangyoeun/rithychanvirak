'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'

interface Video {
  _id: string
  title: string
  slug: { current: string }
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnailUrl?: string
  category?: string
  year?: number
}

function VideoCard({ video, index }: { video: Video; index: number }) {
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
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
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
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                  priority={index < 3}
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

export function Videos({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

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
              Videos
            </h2>
            <motion.div
              className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full mx-auto mb-4 sm:mb-6"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
            <p className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
              Explore my latest videography work and creative projects
            </p>
          </motion.div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">
          {videos.map((video, index) => (
            <VideoCard key={video._id} video={video} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}