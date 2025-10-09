'use client'

import { useState, useEffect, useCallback } from 'react'
import { getThumbnailUrl } from '@/lib/cloudinary'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Video, VideoStoryboard } from '@/types/database'

interface VideoWithStoryboard extends Video {
  storyboard: VideoStoryboard[]
}

export default function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = createClient()
  const [video, setVideo] = useState<VideoWithStoryboard | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string>('')
  const [embedError, setEmbedError] = useState(false)
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({})

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch video with storyboard images
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select(`
          *,
          storyboard:video_storyboard(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (videoError || !videoData) {
        console.error('Video not found:', videoError)
        setVideo(null)
        setRelatedVideos([])
        return
      }

      setVideo(videoData as VideoWithStoryboard)

      // Fetch related videos (same category, different video, active only)
      if (videoData.category) {
        const { data: relatedData } = await supabase
          .from('videos')
          .select('*')
          .eq('category', videoData.category)
          .neq('id', videoData.id)
          .eq('is_active', true)
          .limit(3)

        setRelatedVideos(relatedData || [])
      } else {
        setRelatedVideos([])
      }
    } catch (error) {
      console.error('Error fetching video:', error)
      setVideo(null)
      setRelatedVideos([])
    } finally {
      setLoading(false)
    }
  }, [slug, supabase])

  useEffect(() => {
    if (!slug) return

    fetchVideo()
  }, [slug, fetchVideo])

  useEffect(() => {
    if (!video?.storyboard) return

    video.storyboard.forEach((still, index) => {
      if (aspectRatios[index] !== undefined) return

      const img = document.createElement('img')
      img.onload = () => {
        setAspectRatios(prev => ({ ...prev, [index]: img.naturalWidth / img.naturalHeight }))
      }
      // Use image_id if available, otherwise extract from image_url
      const imageId = still.image_id || (still.image_url.includes('cloudinary')
        ? (() => {
            const urlParts = still.image_url.split('/upload/')
            if (urlParts.length > 1) {
              const afterUpload = urlParts[1]
              // Remove version prefix if present (v123/) and file extension
              const withoutVersion = afterUpload.replace(/^v\d+\//, '')
              return withoutVersion.split('.').slice(0, -1).join('.')
            }
            return ''
          })()
        : still.image_url)
      img.src = getThumbnailUrl(imageId, 600)
    })
  }, [video?.storyboard, aspectRatios])

  const getEmbedUrl = (video: VideoWithStoryboard) => {
    if (video.video_type === 'youtube') {
      const videoId = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (video.video_type === 'vimeo') {
      const videoId = video.video_url.match(/vimeo\.com\/(\d+)/)?.[1]
      return `https://player.vimeo.com/video/${videoId}`
    } else if (video.video_type === 'googledrive') {
      // Extract file ID from Google Drive URL
      // Supports: https://drive.google.com/file/d/FILE_ID/view
      // or: https://drive.google.com/open?id=FILE_ID
      const fileIdMatch = video.video_url.match(/\/d\/([^/]+)/) || video.video_url.match(/[?&]id=([^&]+)/)
      const fileId = fileIdMatch?.[1]
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
    }
    return video.video_url
  }

  const getVideoThumbnail = (vid: Video) => {
    // 1. Check for custom thumbnail URL (Google Drive, Imgur, etc.)
    if (vid.thumbnail_url) {
      return vid.thumbnail_url
    }

    // 2. Fall back to video platform thumbnails
    if (vid.video_type === 'youtube') {
      const videoId = vid.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    } else if (vid.video_type === 'vimeo') {
      const videoId = vid.video_url.match(/vimeo\.com\/(\d+)/)?.[1]
      if (videoId) {
        return `https://vumbnail.com/${videoId}.jpg`
      }
    }

    // 3. Placeholder if nothing else works
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
            <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 relative">
              {!embedError ? (
                <iframe
                  src={getEmbedUrl(video)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setEmbedError(true)}
                  onLoad={() => {
                    // Check if embed failed after load
                    setTimeout(() => {
                      try {
                        const iframe = document.querySelector('iframe[src*="youtube.com/embed"]') as HTMLIFrameElement
                        if (iframe && iframe.contentWindow) {
                          // Try to detect if content is blocked
                          const checkContent = () => {
                            try {
                              const doc = iframe.contentDocument || iframe.contentWindow?.document
                              if (doc && doc.body && doc.body.textContent?.includes('blocked')) {
                                setEmbedError(true)
                              }
                            } catch {
                              // Cross-origin error, assume it's working
                            }
                          }
                          setTimeout(checkContent, 2000)
                        }
                      } catch {
                        // Ignore cross-origin errors
                      }
                    }, 1000)
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
                    <p className="text-white/70 mb-6 max-w-md">
                      This video cannot be embedded. Please watch it directly on the platform.
                    </p>
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                      Watch on {video.video_type === 'youtube' ? 'YouTube' : video.video_type === 'vimeo' ? 'Vimeo' : 'Platform'}
                    </a>
                  </div>
                </div>
              )}
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
                <svg
                  className="w-6 h-6 text-white"
                  style={{ imageRendering: 'crisp-edges', shapeRendering: 'crispEdges' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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
                    <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10" style={{ aspectRatio: aspectRatios[index] || 16/9 }}>
                      <Image
                        src={getThumbnailUrl(still.image_id || (still.image_url.includes('cloudinary')
                          ? (() => {
                              const urlParts = still.image_url.split('/upload/')
                              if (urlParts.length > 1) {
                                const afterUpload = urlParts[1]
                                // Remove version prefix if present (v123/) and file extension
                                const withoutVersion = afterUpload.replace(/^v\d+\//, '')
                                return withoutVersion.split('.').slice(0, -1).join('.')
                              }
                              return ''
                            })()
                          : still.image_url), 600)}
                        alt={still.alt || `Frame ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain group-hover:scale-110 transition-transform duration-700"
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
                    key={relatedVideo.id}
                    href={`/video/${relatedVideo.slug}`}
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
