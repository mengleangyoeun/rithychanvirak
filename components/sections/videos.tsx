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

function getVideoThumbnail(vid: Video) {
  if (vid.thumbnailUrl) return vid.thumbnailUrl

  if (vid.videoType === 'youtube') {
    const videoId = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  } else if (vid.videoType === 'vimeo') {
    const videoId = vid.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
    if (videoId) return `https://vumbnail.com/${videoId}.jpg`
  }

  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect width="800" height="450" fill="%23111827"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="%23ffffff40"%3ENo Thumbnail%3C/text%3E%3C/svg%3E'
}

function getEmbedUrl(vid: Video) {
  if (vid.videoType === 'youtube') {
    const videoId = vid.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`
  } else if (vid.videoType === 'vimeo') {
    const videoId = vid.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&background=1`
  } else if (vid.videoType === 'googledrive') {
    const fileIdMatch = vid.videoUrl.match(/\/d\/([^/]+)/) || vid.videoUrl.match(/[?&]id=([^&]+)/)
    const fileId = fileIdMatch?.[1]
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
  }
  return vid.videoUrl
}

function VideoCard({ video, index }: { video: Video; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [embedError, setEmbedError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
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
                  loading={index < 2 ? "eager" : "lazy"}
                  priority={index < 2}
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

export function Videos({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  return (
    <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 sm:p-10 hover:border-zinc-700/80 transition-colors duration-500 relative flex flex-col h-full">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white uppercase mb-2">
            Featured Videos
          </h2>
          <p className="text-zinc-400 text-sm">
            Explore my latest videography work and creative projects.
          </p>
        </div>
        <Link
          href="/videos"
          className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-1.5 shrink-0 mt-1 group"
        >
          View all
          <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.slice(0, 4).map((video, index) => (
          <VideoCard key={video._id} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}