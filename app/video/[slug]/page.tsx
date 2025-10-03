'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, Calendar, Tag, Camera } from 'lucide-react'

interface StoryboardImage {
  asset: { _ref: string }
  alt?: string
  caption?: string
}

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
  storyboard?: StoryboardImage[]
}

export default function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string>('')

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    async function fetchVideo() {
      try {
        const videoData = await client.fetch(
          `*[_type == "video" && slug.current == $slug][0] {
            _id,
            title,
            slug,
            videoUrl,
            videoType,
            thumbnail,
            description,
            category,
            year,
            tags,
            storyboard
          }`,
          { slug }
        )

        if (videoData) {
          setVideo(videoData)

          // Fetch related videos
          const related = await client.fetch(
            `*[_type == "video" && category == $category && slug.current != $slug] | order(_createdAt desc)[0...3] {
              _id,
              title,
              slug,
              videoUrl,
              videoType,
              thumbnail,
              category,
              year
            }`,
            { category: videoData.category, slug }
          )

          setRelatedVideos(related || [])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching video:', error)
        setLoading(false)
      }
    }

    fetchVideo()
  }, [slug])

  const getEmbedUrl = (video: Video) => {
    if (video.videoType === 'youtube') {
      const videoId = video.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (video.videoType === 'vimeo') {
      const videoId = video.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1]
      return `https://player.vimeo.com/video/${videoId}`
    } else if (video.videoType === 'googledrive') {
      // Extract file ID from Google Drive URL
      // Supports: https://drive.google.com/file/d/FILE_ID/view
      // or: https://drive.google.com/open?id=FILE_ID
      const fileIdMatch = video.videoUrl.match(/\/d\/([^/]+)/) || video.videoUrl.match(/[?&]id=([^&]+)/)
      const fileId = fileIdMatch?.[1]
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
    }
    return video.videoUrl
  }

  const getVideoThumbnail = (vid: Video) => {
    if (vid.thumbnail?.asset?._ref) {
      try {
        return urlFor(vid.thumbnail).width(400).height(225).url()
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

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23111827"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%23ffffff40"%3ENo Thumbnail%3C/text%3E%3C/svg%3E'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground/70">Loading video...</div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Video not found</h1>
          <Link href="/videos" className="text-blue-500 hover:underline">
            ← Back to Videos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="unified-background min-h-screen">
      <div className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Videos
            </Link>
          </motion.div>

          {/* Video Info - Above Video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            >
              {video.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {video.year && (
                <div className="flex items-center gap-2 text-white/70 text-lg">
                  <Calendar className="w-5 h-5" />
                  <span>{video.year}</span>
                </div>
              )}
              {video.category && (
                <div className="px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/10">
                  {video.category}
                </div>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <p className="text-lg text-white/80 leading-relaxed max-w-4xl">
                {video.description}
              </p>
            )}
          </motion.div>

          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <iframe
                src={getEmbedUrl(video)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>

          {/* Tags - Below Video */}
          {video.tags && video.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-4 h-4 text-white/50" />
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Grabbed Stills / Storyboard */}
          {video.storyboard && video.storyboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-16"
            >
              {/* Header with just camera icon */}
              <div className="flex items-center justify-center mb-8">
                <Camera className="w-8 h-8 text-white" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {video.storyboard.map((still, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group relative overflow-hidden rounded-xl transition-all duration-300"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl">
                      <Image
                        src={urlFor(still).width(600).height(338).url()}
                        alt={still.alt || `Frame ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />

                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Caption - only show if exists */}
                    {still.caption && (
                      <div className="mt-3">
                        <p className="text-sm text-white/70 leading-relaxed">
                          {still.caption}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Related Videos */}
          {relatedVideos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-white mb-8"
                style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
              >
                RELATED VIDEOS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedVideos.map((relatedVideo) => (
                  <Link
                    key={relatedVideo._id}
                    href={`/video/${relatedVideo.slug.current}`}
                    className="group"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      <Image
                        src={getVideoThumbnail(relatedVideo)}
                        alt={relatedVideo.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">
                          {relatedVideo.title}
                        </h3>
                        {relatedVideo.year && (
                          <p className="text-white/60 text-sm">{relatedVideo.year}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
