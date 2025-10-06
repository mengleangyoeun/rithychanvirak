import { definePlugin } from 'sanity'
import { UploadIcon } from '@sanity/icons'
import React, { useState, useEffect } from 'react'
import { useClient } from 'sanity'

export const videoUploadPlugin = definePlugin({
  name: 'video-storyboard-upload',
  tools: [
    {
      name: 'video-storyboard-upload',
      title: 'Bulk Upload Storyboards',
      icon: UploadIcon,
      component: VideoStoryboardUploadComponent
    }
  ]
})

interface Video {
  _id: string
  title: string
  slug?: { current: string }
  category?: string
}

function VideoStoryboardUploadComponent() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  // Fetch videos
  const fetchVideos = async () => {
    setLoading(true)
    setError('')
    try {
      const fetchedVideos = await client.fetch(`*[_type == "video"] | order(title asc) {
        _id,
        title,
        slug,
        category
      }`)
      setVideos(fetchedVideos)
      console.log(`Loaded ${fetchedVideos.length} videos`)
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to load videos. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uploadToCloudinary = async (file: File, video: Video): Promise<{ secure_url: string; public_id: string }> => {
    const videoSlug = video.slug?.current || video.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const cloudinaryFolder = `video-storyboards/${videoSlug}`

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'portfolio')
    formData.append('folder', cloudinaryFolder)
    formData.append('quality', 'auto:good')
    formData.append('fetch_format', 'auto')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary')
    }

    return response.json()
  }

  const handleFileUpload = async (fileList: FileList) => {
    if (!selectedVideo) {
      alert('Please select a video first')
      return
    }

    setUploading(true)
    setProgress('Starting upload...')
    setUploadedCount(0)
    setTotalFiles(fileList.length)

    try {
      const selectedVideoObj = videos.find(v => v._id === selectedVideo)
      if (!selectedVideoObj) {
        throw new Error('Video not found')
      }

      const filesArray = Array.from(fileList)
      const storyboardItems: Array<{ _key: string; _type: string; imageUrl: string; imageId: string; alt?: string; order?: number }> = []

      // Process files in batches of 3
      const batchSize = 3
      for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize)

        const batchPromises = batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex
          setCurrentFile(file.name)
          setProgress(`📤 Uploading ${globalIndex + 1}/${filesArray.length} to ${selectedVideoObj.title}`)

          const cloudinaryResult = await uploadToCloudinary(file, selectedVideoObj)

          const fileName = file.name.replace(/\.[^/.]+$/, '')

          // Generate unique key using timestamp and random string
          const uniqueKey = `frame-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

          return {
            _key: uniqueKey,
            _type: 'storyboardFrame',
            imageUrl: cloudinaryResult.secure_url,
            imageId: cloudinaryResult.public_id,
            alt: fileName,
            order: globalIndex
          }
        })

        const batchResults = await Promise.all(batchPromises)
        storyboardItems.push(...batchResults)
        setUploadedCount(storyboardItems.length)
      }

      // Update video document with storyboard images
      setProgress('💾 Saving storyboard to video...')

      await client
        .patch(selectedVideo)
        .set({ storyboard: storyboardItems })
        .commit()

      setProgress(`🎉 Successfully uploaded ${storyboardItems.length} storyboard images to "${selectedVideoObj.title}"!`)
    } catch (error) {
      console.error('Upload error:', error)
      setProgress(`❌ Error: ${error instanceof Error ? error.message : 'Upload failed'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && selectedVideo) {
      handleFileUpload(droppedFiles)
    }
  }

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            🎬 Bulk Upload Video Storyboards
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Upload storyboard images to your videos. Images will be automatically added to the selected video.
          </p>
        </div>

        {/* Video Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: '#374151'
            }}>
              🎥 Select Video
            </label>
            <button
              onClick={fetchVideos}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: loading ? '#e5e7eb' : '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#374151',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              marginBottom: '1rem',
              color: '#dc2626'
            }}>
              ❌ {error}
            </div>
          )}

          {loading ? (
            <div style={{
              padding: '1.5rem',
              background: '#f3f4f6',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              ⏳ Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#92400e', fontWeight: '600', marginBottom: '0.5rem' }}>
                ⚠️ No videos found
              </p>
              <p style={{ color: '#78350f', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Please create a video document first before uploading storyboards.
              </p>
              <button
                onClick={fetchVideos}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🔄 Refresh List
              </button>
            </div>
          ) : (
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <option value="">Choose a video... ({videos.length} available)</option>
              {videos.map((video) => (
                <option key={video._id} value={video._id}>
                  {video.title} {video.category && `• ${video.category}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: dragOver ? '3px dashed #667eea' : '2px dashed #d1d5db',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            background: dragOver ? '#f0f4ff' : '#f9fafb',
            transition: 'all 0.2s',
            marginBottom: '1.5rem',
            opacity: !selectedVideo ? 0.5 : 1,
            pointerEvents: !selectedVideo ? 'none' : 'auto'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
          <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
            Drag & Drop Storyboard Images Here
          </p>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>or</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files)
              }
            }}
            style={{ display: 'none' }}
            id="file-input"
            disabled={!selectedVideo}
          />
          <label
            htmlFor="file-input"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: !selectedVideo ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              cursor: !selectedVideo ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            Browse Files
          </label>
          {!selectedVideo && (
            <p style={{ marginTop: '1.5rem', color: '#dc2626', fontSize: '0.9rem' }}>
              ⚠️ Please select a video first
            </p>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {progress}
              </div>
              <div style={{
                background: '#e5e7eb',
                height: '12px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginTop: '1rem'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  height: '100%',
                  width: `${totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            {currentFile && (
              <div style={{ fontSize: '0.9rem', opacity: 0.9, fontStyle: 'italic' }}>
                Currently uploading: {currentFile}
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {progress.includes('🎉') && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            color: 'white',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Upload Complete!</h3>
            <p style={{ opacity: 0.9 }}>
              Storyboard images have been added to your video. You can view them in the video document.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
