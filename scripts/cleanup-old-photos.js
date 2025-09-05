const { createClient } = require('next-sanity')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Create Sanity client with write permissions
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

async function cleanupOldPhotos() {
  try {
    console.log('🔍 Finding old photos without Cloudinary URLs...')
    
    // Find photos that don't have imageUrl (old schema)
    const oldPhotos = await client.fetch(`
      *[_type == "photo" && !defined(imageUrl)] {
        _id,
        title,
        _createdAt
      }
    `)
    
    console.log(`📋 Found ${oldPhotos.length} old photos to delete:`)
    oldPhotos.forEach(photo => {
      console.log(`  - ${photo.title} (${photo._id})`)
    })
    
    if (oldPhotos.length === 0) {
      console.log('✅ No old photos found!')
      return
    }
    
    // Confirm deletion
    console.log('\n⚠️  This will permanently delete these photos!')
    console.log('📝 Make sure you have backups if needed.')
    
    // Delete in batches
    const batchSize = 10
    let deletedCount = 0
    
    for (let i = 0; i < oldPhotos.length; i += batchSize) {
      const batch = oldPhotos.slice(i, i + batchSize)
      const deletePromises = batch.map(photo => 
        client.delete(photo._id)
      )
      
      await Promise.all(deletePromises)
      deletedCount += batch.length
      
      console.log(`🗑️  Deleted ${deletedCount}/${oldPhotos.length} photos...`)
    }
    
    console.log(`✅ Successfully deleted ${deletedCount} old photos!`)
    console.log('🔄 Your app should now work properly with Cloudinary images only.')
    
  } catch (error) {
    console.error('❌ Error cleaning up old photos:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupOldPhotos()