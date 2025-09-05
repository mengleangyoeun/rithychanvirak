import { DocumentActionComponent, useDocumentOperation } from 'sanity'
import { useCallback } from 'react'
import { useClient } from 'sanity'

export const AutoCreateSubalbumsAction: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type)
  const client = useClient()
  
  const handleCreateWithSubalbums = useCallback(async () => {
    // First save the main album
    patch.execute([{ set: props.draft || props.published }])
    
    if (props.draft && !props.published) {
      publish.execute()
    }
    
    // Wait a moment for the main album to be created
    setTimeout(async () => {
      try {
        const mainAlbumId = props.id
        const mainAlbumTitle = props.draft?.title || props.published?.title
        
        if (!mainAlbumTitle) return
        
        // Create default sub-albums
        const defaultSubalbums = [
          { name: 'Highlights', description: 'Best shots from this collection' },
          { name: 'Behind the Scenes', description: 'Behind the scenes moments' },
          { name: 'Details', description: 'Close-up and detail shots' }
        ]
        
        const subalbumPromises = defaultSubalbums.map(async (subalbum, index) => {
          const subalbumDoc = {
            _type: 'collection',
            title: `${mainAlbumTitle} - ${subalbum.name}`,
            slug: {
              _type: 'slug',
              current: `${(props.draft?.slug as { current?: string })?.current || (props.published?.slug as { current?: string })?.current || 'untitled'}-${subalbum.name.toLowerCase().replace(/\s+/g, '-')}`
            },
            description: subalbum.description,
            parentCollection: {
              _type: 'reference',
              _ref: mainAlbumId
            },
            isSubAlbum: true,
            order: index + 1,
            featured: false
          }
          
          return await client.create(subalbumDoc)
        })
        
        await Promise.all(subalbumPromises)
        
        // Show success message
        console.log(`Created ${defaultSubalbums.length} sub-albums for ${mainAlbumTitle}`)
        
      } catch (error) {
        console.error('Error creating sub-albums:', error)
      }
    }, 1000)
    
  }, [patch, publish, props, client])
  
  // Only show this action for main collections (not sub-albums)
  if (props.draft?.isSubAlbum || props.published?.isSubAlbum) {
    return null
  }
  
  return {
    label: 'Create with Sub-albums',
    icon: () => '📁+',
    onHandle: handleCreateWithSubalbums,
    disabled: !props.draft?.title
  }
}