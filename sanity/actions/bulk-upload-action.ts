import { DocumentActionComponent, useClient } from 'sanity'

export const BulkUploadAction: DocumentActionComponent = (props) => {
  const { type, draft, published } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  // Only show for collection documents
  if (type !== 'collection') {
    return null
  }

  const handleBulkUpload = async () => {
    // Create file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    
    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files
      if (!files) return

      const collectionId = published?._id || draft?._id
      const collectionTitle = published?.title || draft?.title || 'Untitled Collection'
      
      try {
        // Show progress (you could add a toast notification here)
        console.log(`Uploading ${files.length} photos to collection: ${collectionTitle}`)
        
        const uploadPromises = Array.from(files).map(async (file, index) => {
          // Upload image to Sanity
          const asset = await client.assets.upload('image', file, {
            filename: file.name
          })

          // Create photo document
          const photoTitle = file.name.replace(/\.[^/.]+$/, '') // Remove extension
          const photoSlug = photoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

          const photoDoc = {
            _type: 'photo',
            title: photoTitle,
            slug: {
              _type: 'slug',
              current: `${photoSlug}-${Date.now()}-${index}`
            },
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: asset._id
              },
              alt: photoTitle
            },
            collections: [
              {
                _type: 'reference',
                _ref: collectionId,
                _key: `collection-${collectionId}-${Date.now()}-${index}`
              }
            ],
            featured: false,
            _createdAt: new Date().toISOString()
          }

          return client.create(photoDoc)
        })

        await Promise.all(uploadPromises)
        
        // Show success message
        alert(`Successfully uploaded ${files.length} photos to ${collectionTitle}!`)
        
        // Refresh the page or update the UI as needed
        window.location.reload()
        
      } catch (error) {
        console.error('Bulk upload error:', error)
        alert('Error uploading photos. Please try again.')
      }
    }
    
    input.click()
  }

  return {
    label: 'Bulk Upload Photos',
    icon: () => '📷',
    onHandle: handleBulkUpload,
    tone: 'primary'
  }
}