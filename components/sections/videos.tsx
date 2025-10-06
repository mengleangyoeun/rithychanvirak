'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { getThumbnailUrl } from '@/lib/cloudinary'

interface Video {
  _id: string
  title: string
  slug: { current: string }
  videoUrl: string
  videoType: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnailUrl?: string
  thumbnailId?: string
  category?: string
  year?: number
}

export function Videos({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) return null

  const getVideoThumbnail = (vid: Video) => {
    // Use Cloudinary thumbnail if available
    if (vid.thumbnailId) {
      return getThumbnailUrl(vid.thumbnailId, 500)
    }

    // Fallback to video platform thumbnails
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

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="281"%3E%3Crect width="500" height="281" fill="%23111827"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="%23ffffff40"%3ENo Thumbnail%3C/text%3E%3C/svg%3E'
  }

  return (
    <section className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="relative mb-12 sm:mb-16 px-4 sm:px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-[0.08em] sm:tracking-[0.1em] uppercase mb-4 sm:mb-6 px-4"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            Featured Videos
          </h2>
          <motion.div
            className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full mx-auto mb-4 sm:mb-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          />
          <p className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Infinite scroll showcase of my latest videography work and creative projects
          </p>
        </motion.div>
      </div>

      {/* First Row - Right to Left */}
      <div className="relative overflow-hidden mb-4 sm:mb-6">
        <motion.div
          className="flex gap-4 sm:gap-6"
          animate={{ x: [`-${videos.length * 25}%`, `0%`] }}
          transition={{
            duration: videos.length * 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[...videos].reverse().concat([...videos].reverse(), [...videos].reverse()).map((video, index) => (
            <div
              key={`top-${video._id}-${index}`}
              className="flex-shrink-0 w-72 sm:w-80 md:w-96 h-80 sm:h-96 md:h-[28rem] relative group cursor-pointer"
            >
              <Link href={`/video/${video.slug.current}`}>
                <div className="w-full h-full relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-white/10 transition-all duration-500 border border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm">
                  <Image
                    src={getVideoThumbnail(video)}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 288px, (max-width: 768px) 320px, 384px"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading={index < 3 ? "eager" : "lazy"}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" fill="white" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white transform group-hover:translate-y-[-4px] transition-transform duration-300">
                    <h3 className="text-white font-bold text-base sm:text-lg md:text-xl tracking-wide mb-2 sm:mb-3 drop-shadow-lg" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {video.category && (
                        <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full">
                          {video.category}
                        </span>
                      )}
                      {video.year && (
                        <span className="text-xs text-white/70">
                          {video.year}
                        </span>
                      )}
                    </div>
                    <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-20 sm:group-hover:w-24 transition-all duration-300"></div>
                  </div>

                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <svg className="w-3 sm:w-4 h-3 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
          className="flex gap-4 sm:gap-6"
          animate={{ x: [`0%`, `-${videos.length * 25}%`] }}
          transition={{
            duration: videos.length * 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[...videos, ...videos, ...videos].map((video, index) => (
            <div
              key={`bottom-${video._id}-${index}`}
              className="flex-shrink-0 w-72 sm:w-80 md:w-96 h-80 sm:h-96 md:h-[28rem] relative group cursor-pointer"
            >
              <Link href={`/video/${video.slug.current}`}>
                <div className="w-full h-full relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-white/10 transition-all duration-500 border border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm">
                  <Image
                    src={getVideoThumbnail(video)}
                    alt={video.title}
                    fill
                    sizes="384px"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading={index < 3 ? "eager" : "lazy"}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" fill="white" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform group-hover:translate-y-[-4px] transition-transform duration-300">
                    <h3 className="text-white font-bold text-xl tracking-wide mb-3 drop-shadow-lg" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {video.category && (
                        <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full">
                          {video.category}
                        </span>
                      )}
                      {video.year && (
                        <span className="text-xs text-white/70">
                          {video.year}
                        </span>
                      )}
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-24 transition-all duration-300"></div>
                  </div>

                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}