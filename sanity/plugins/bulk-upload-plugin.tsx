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

import React, { useState } from 'react'
import { useClient } from 'sanity'

function BulkUploadComponent() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [collections, setCollections] = useState<Array<{ _id: string; title: string }>>([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [currentFile, setCurrentFile] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  // Fetch collections on component mount
  React.useEffect(() => {
    client
      .fetch('*[_type == "collection"]{ _id, title, slug }')
      .then(setCollections)
      .catch(console.error)
  }, [client])

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<{ secure_url: string; public_id: string; width: number; height: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_preset')
    formData.append('folder', 'photography-portfolio')
    
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

    try {
      const filesArray = Array.from(files)
      
      // Process files in batches of 3 for better performance
      const batchSize = 3
      for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex
          setCurrentFile(file.name)
          setProgress(`📸 Uploading ${globalIndex + 1}/${filesArray.length}`)

          // Upload to Cloudinary instead of Sanity
          const cloudinaryResult = await uploadToCloudinary(file)

          // Create photo document with Cloudinary URLs
          const photoTitle = file.name.replace(/\.[^/.]+$/, '')
          const photoSlug = photoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

          const photoDoc = {
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
          📂 Select Collection
        </label>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
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
          {collections.map((collection) => (
            <option key={collection._id} value={collection._id}>
              {collection.title}
            </option>
          ))}
        </select>
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
          <p style={{ opacity: 0.9 }}>
            Successfully uploaded {uploadedFiles.length} photos to your collection
          </p>
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
          <strong>💪 Pro Tips:</strong> You can upload hundreds of photos at once! The system will process them sequentially and show real-time progress.
        </div>
      </div>
    </div>
  )
}