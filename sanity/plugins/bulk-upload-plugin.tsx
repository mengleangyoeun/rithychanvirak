import { definePlugin } from 'sanity'
import { UploadIcon } from '@sanity/icons'

export const bulkUploadPlugin = definePlugin({
  name: 'bulk-upload',
  tools: [
    {
      name: 'bulk-upload',
      title: 'Bulk Upload Photos',
      icon: UploadIcon,
      component: () => {
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
                  📸 Bulk Photo Upload
                </h1>
                <p style={{ 
                  marginBottom: '2rem', 
                  color: '#666',
                  fontSize: '1.1rem',
                  lineHeight: '1.6'
                }}>
                  Upload multiple photos at once and organize them into collections effortlessly.
                </p>
              </div>
              
              <BulkUploadComponent />
            </div>
          </div>
        )
      }
    }
  ]
})

import React, { useState, useCallback } from 'react'
import { useClient } from 'sanity'
import imageCompression from 'browser-image-compression'
import exifr from 'exifr'

interface Collection {
  _id: string
  title: string
  slug?: { current: string }
  collectionType?: string
  parentCollection?: {
    title: string
    slug: { current: string }
  }
}

function BulkUploadComponent() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [compressionSavings, setCompressionSavings] = useState({ original: 0, compressed: 0 })

  // Fetch collections on component mount
  const fetchCollections = useCallback(() => {
    client
      .fetch(`*[_type == "collection"]{
        _id,
        title,
        slug,
        collectionType,
        parentCollection-> {
          title,
          slug
        }
      }`)
      .then(setCollections)
      .catch(console.error)
  }, [client])

  React.useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Max file size in MB
      maxWidthOrHeight: 2048, // Max width or height (good for web)
      useWebWorker: true,
      fileType: 'image/jpeg', // Convert to JPEG for better compression
      initialQuality: 0.85, // 85% quality - great balance
      preserveExif: true // IMPORTANT: Keep EXIF metadata
    }

    try {
      const compressedFile = await imageCompression(file, options)

      // Update compression stats
      setCompressionSavings(prev => ({
        original: prev.original + file.size,
        compressed: prev.compressed + compressedFile.size
      }))

      return compressedFile
    } catch (error) {
      console.error('Compression error:', error)
      return file // Return original if compression fails
    }
  }

  // Create new collection
  const createCollection = async (name: string): Promise<string> => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const collectionDoc = {
      _type: 'collection',
      title: name,
      slug: {
        _type: 'slug',
        current: slug
      }
    }

    const result = await client.create(collectionDoc)
    await fetchCollections() // Refresh collections list
    return result._id
  }

  // Cloudinary upload function with collection-based folder (supports nested sub-collections)
  const uploadToCloudinary = async (file: File, collection: Collection): Promise<{ secure_url: string; public_id: string; width: number; height: number }> => {
    // Create Cloudinary folder path from collection name
    let cloudinaryFolder = 'photography-portfolio'

    // If sub-collection, create nested folder structure
    if (collection.parentCollection) {
      const parentSlug = collection.parentCollection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const childSlug = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      cloudinaryFolder = `photography-portfolio/${parentSlug}/${childSlug}`
    } else {
      const folderSlug = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      cloudinaryFolder = `photography-portfolio/${folderSlug}`
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_preset')
    formData.append('folder', cloudinaryFolder)
    // Add Cloudinary transformations for additional compression
    formData.append('quality', 'auto:good') // Auto-optimize quality
    formData.append('fetch_format', 'auto') // Auto-select best format (WebP, AVIF, etc.)
    formData.append('image_metadata', 'true') // Preserve EXIF metadata

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files || !selectedCollection) return

    setUploading(true)
    setProgress('🚀 Starting upload...')
    setTotalFiles(files.length)
    setUploadedCount(0)
    setUploadedFiles([])
    setCompressionSavings({ original: 0, compressed: 0 })

    try {
      // Get collection info for Cloudinary folder
      const selectedCollectionObj = collections.find(c => c._id === selectedCollection)
      if (!selectedCollectionObj) {
        throw new Error('Collection not found')
      }

      const collectionName = selectedCollectionObj.title
      const displayPath = selectedCollectionObj.parentCollection
        ? `${selectedCollectionObj.parentCollection.title} / ${collectionName}`
        : collectionName

      const filesArray = Array.from(files)

      // Process files in batches of 3 for better performance
      const batchSize = 3
      for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize)

        const batchPromises = batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex
          setCurrentFile(file.name)
          setProgress(`🗜️ Compressing & uploading ${globalIndex + 1}/${filesArray.length} to ${displayPath}`)

          // Extract EXIF data from original file before compression
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let exifData: any = null
          try {
            exifData = await exifr.parse(file, {
              tiff: true,
              exif: true,
              gps: false,
              interop: false,
              ifd1: false
            })
          } catch (error) {
            console.warn('Could not extract EXIF from', file.name, error)
          }

          // Compress image before uploading
          const compressedFile = await compressImage(file)

          // Upload compressed file to Cloudinary with collection folder (handles nested paths)
          const cloudinaryResult = await uploadToCloudinary(compressedFile, selectedCollectionObj)

          // Create photo document with Cloudinary URLs
          const photoTitle = file.name.replace(/\.[^/.]+$/, '')
          const photoSlug = photoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

          // Prepare photo document
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const photoDoc: any = {
            _type: 'photo',
            title: photoTitle,
            slug: {
              _type: 'slug',
              current: `${photoSlug}-${Date.now()}-${globalIndex}`
            },
            imageUrl: cloudinaryResult.secure_url,
            imageId: cloudinaryResult.public_id,
            imageWidth: cloudinaryResult.width,
            imageHeight: cloudinaryResult.height,
            alt: photoTitle,
            collection: {
              _type: 'reference',
              _ref: selectedCollection
            },
            featured: false
          }

          // Add EXIF metadata if available
          if (exifData) {
            // Camera info
            if (exifData.Make && exifData.Model) {
              photoDoc.camera = `${exifData.Make} ${exifData.Model}`.trim()
            }
            if (exifData.LensModel) {
              photoDoc.lens = exifData.LensModel
            }

            // Camera settings
            if (exifData.FNumber || exifData.ExposureTime || exifData.ISO || exifData.FocalLength) {
              photoDoc.settings = {
                _type: 'object',
                aperture: exifData.FNumber ? String(exifData.FNumber) : undefined,
                shutter: exifData.ExposureTime ? (exifData.ExposureTime < 1 ? `1/${Math.round(1/exifData.ExposureTime)}` : String(exifData.ExposureTime)) : undefined,
                iso: exifData.ISO ? String(exifData.ISO) : undefined,
                focalLength: exifData.FocalLength ? String(Math.round(exifData.FocalLength)) : undefined
              }
            }

            // Capture date
            if (exifData.DateTimeOriginal) {
              const date = new Date(exifData.DateTimeOriginal)
              if (!isNaN(date.getTime())) {
                photoDoc.captureDate = date.toISOString().split('T')[0]
              }
            }

            // Raw EXIF data
            photoDoc.exifData = {
              _type: 'object',
              make: exifData.Make,
              model: exifData.Model,
              lensModel: exifData.LensModel,
              fNumber: exifData.FNumber,
              exposureTime: exifData.ExposureTime ? String(exifData.ExposureTime) : undefined,
              iso: exifData.ISO,
              focalLength: exifData.FocalLength,
              dateTimeOriginal: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toISOString() : undefined,
              software: exifData.Software
            }
          }

          await client.create(photoDoc)
          setUploadedCount(prev => prev + 1)
          setUploadedFiles(prev => [...prev, file.name])

          return photoDoc
        })
        
        // Wait for current batch to complete before starting next batch
        await Promise.all(batchPromises)
      }

      setProgress(`🎉 Successfully uploaded ${filesArray.length} photos!`)
      setTimeout(() => {
        setProgress('')
        setCurrentFile('')
        setUploadedCount(0)
        setTotalFiles(0)
        setUploadedFiles([])
      }, 5000)
      
    } catch (error) {
      console.error('Upload error:', error)
      setProgress('❌ Upload failed. Check console for details.')
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
    const files = e.dataTransfer.files
    if (files && selectedCollection) {
      handleFileUpload(files)
    }
  }

  return (
    <div>
      {/* Collection Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.75rem',
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#374151'
        }}>
          📂 Select or Create Collection
        </label>
        <select
          value={selectedCollection}
          onChange={(e) => {
            const value = e.target.value
            if (value === '__new__') {
              setShowNewCollectionInput(true)
              setSelectedCollection('')
            } else {
              setShowNewCollectionInput(false)
              setSelectedCollection(value)
            }
          }}
          style={{
            width: '100%',
            padding: '1rem',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '1rem',
            background: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea'
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb'
            e.target.style.boxShadow = 'none'
          }}
        >
          <option value="">Choose a collection...</option>
          <option value="__new__" style={{ fontWeight: 'bold', color: '#667eea' }}>
            ➕ Create New Collection
          </option>
          {collections.map((collection) => (
            <option key={collection._id} value={collection._id}>
              {collection.parentCollection
                ? `  └─ ${collection.title} (in ${collection.parentCollection.title})`
                : collection.title}
            </option>
          ))}
        </select>

        {/* New Collection Input */}
        {showNewCollectionInput && (
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #667eea',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  if (newCollectionName.trim()) {
                    setProgress('📁 Creating collection...')
                    try {
                      const newCollectionId = await createCollection(newCollectionName.trim())
                      setSelectedCollection(newCollectionId)
                      setShowNewCollectionInput(false)
                      setNewCollectionName('')
                      setProgress('✅ Collection created!')
                      setTimeout(() => setProgress(''), 2000)
                    } catch (error) {
                      console.error('Failed to create collection:', error)
                      setProgress('❌ Failed to create collection')
                      setTimeout(() => setProgress(''), 3000)
                    }
                  }
                }}
                disabled={!newCollectionName.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: newCollectionName.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newCollectionName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                ✓ Create Collection
              </button>
              <button
                onClick={() => {
                  setShowNewCollectionInput(false)
                  setNewCollectionName('')
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        style={{
          border: `3px dashed ${dragOver ? '#667eea' : selectedCollection ? '#d1d5db' : '#e5e7eb'}`,
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: dragOver ? '#f0f4ff' : selectedCollection ? '#f9fafb' : '#f3f4f6',
          cursor: selectedCollection && !uploading ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s ease',
          marginBottom: '2rem',
          position: 'relative'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (selectedCollection && !uploading) {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*'
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files
              if (files) handleFileUpload(files)
            }
            input.click()
          }
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {uploading ? '⏳' : dragOver ? '📥' : '📸'}
        </div>
        <h3 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '0.5rem',
          color: selectedCollection ? '#374151' : '#9ca3af'
        }}>
          {uploading ? 'Uploading Photos...' : 
           dragOver ? 'Drop photos here!' :
           selectedCollection ? 'Drop photos or click to browse' : 
           'Select a collection first'}
        </h3>
        <p style={{ 
          color: '#6b7280',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {!uploading && selectedCollection && (
            <>
              Supports JPG, PNG, WebP, GIF<br />
              <strong>Drag & drop multiple files or click to browse</strong>
            </>
          )}
        </p>

        {!selectedCollection && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            👆 Please select a collection first
          </div>
        )}
      </div>

      {/* Progress Section */}
      {uploading && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{progress}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {uploadedCount}/{totalFiles}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              background: 'white',
              height: '100%',
              borderRadius: '8px',
              width: `${totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {currentFile && (
            <div style={{ 
              fontSize: '0.9rem', 
              opacity: 0.9,
              fontStyle: 'italic'
            }}>
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
          <p style={{ opacity: 0.9, marginBottom: '1rem' }}>
            Successfully uploaded {uploadedFiles.length} photos to your collection
          </p>
          {compressionSavings.original > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '0.95rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💾 Storage Saved</div>
              <div style={{ opacity: 0.95 }}>
                Original: {(compressionSavings.original / 1024 / 1024).toFixed(2)} MB
                <br />
                Compressed: {(compressionSavings.compressed / 1024 / 1024).toFixed(2)} MB
                <br />
                <strong>Saved: {((1 - compressionSavings.compressed / compressionSavings.original) * 100).toFixed(0)}% ({((compressionSavings.original - compressionSavings.compressed) / 1024 / 1024).toFixed(2)} MB)</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && !uploading && (
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '2rem'
        }}>
          <h4 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            ✅ Recently Uploaded ({uploadedFiles.length} photos)
          </h4>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'grid',
            gap: '0.5rem'
          }}>
            {uploadedFiles.map((filename, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                background: 'white',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#6b7280',
                border: '1px solid #e5e7eb'
              }}>
                📸 {filename}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h4 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          💡 How to Use
        </h4>
        <ol style={{ 
          margin: 0, 
          paddingLeft: '1.2rem',
          color: '#075985',
          lineHeight: '1.6'
        }}>
          <li>Select the collection where you want to add photos</li>
          <li>Drag & drop photos directly or click the upload area</li>
          <li>Watch the progress and wait for completion</li>
          <li>Your photos will automatically appear in the selected collection</li>
        </ol>
        
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(3, 105, 161, 0.1)',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#075985'
        }}>
          <strong>💪 Pro Tips:</strong> Images are automatically compressed before upload (max 1MB, 2048px, 85% quality). You can upload hundreds of photos at once!
        </div>
      </div>
    </div>
  )
}