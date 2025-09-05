#!/usr/bin/env node

/**
 * Bulk Upload Script for Rithy Chanvirak Photography Portfolio
 * 
 * Usage:
 * node scripts/bulk-upload.js <collection-id> <photos-folder-path>
 * 
 * Example:
 * node scripts/bulk-upload.js collection-123 ./photos/wedding-2024/
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@sanity/client')

// Sanity client configuration
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, // You'll need to set this
  useCdn: false
})

// Supported image formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

async function bulkUploadPhotos(collectionId, folderPath) {
  try {
    // Validate collection exists
    const collection = await client.fetch(`*[_type == "collection" && _id == "${collectionId}"][0]`)
    if (!collection) {
      throw new Error(`Collection with ID "${collectionId}" not found`)
    }

    console.log(`📷 Uploading photos to collection: "${collection.title}"`)

    // Get all image files from folder
    const files = fs.readdirSync(folderPath)
      .filter(file => SUPPORTED_FORMATS.includes(path.extname(file).toLowerCase()))
      .sort()

    console.log(`📁 Found ${files.length} images in "${folderPath}"`)

    if (files.length === 0) {
      console.log('❌ No supported image files found')
      return
    }

    // Process each file
    const uploadPromises = files.map(async (filename, index) => {
      const filePath = path.join(folderPath, filename)
      const photoTitle = path.parse(filename).name
      const photoSlug = photoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      try {
        console.log(`📸 [${index + 1}/${files.length}] Uploading: ${filename}`)

        // Upload image asset
        const imageAsset = await client.assets.upload('image', fs.createReadStream(filePath), {
          filename: filename
        })

        // Create photo document
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
              _ref: imageAsset._id
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
          tags: [],
          _createdAt: new Date().toISOString()
        }

        const createdPhoto = await client.create(photoDoc)
        console.log(`✅ [${index + 1}/${files.length}] Created: ${createdPhoto.title}`)
        
        return createdPhoto

      } catch (error) {
        console.error(`❌ [${index + 1}/${files.length}] Failed to upload ${filename}:`, error.message)
        return null
      }
    })

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)
    const successful = results.filter(result => result !== null)

    console.log(`\n🎉 Bulk upload complete!`)
    console.log(`✅ Successfully uploaded: ${successful.length}/${files.length} photos`)
    console.log(`📂 Collection: "${collection.title}"`)
    
    if (successful.length < files.length) {
      console.log(`❌ Failed uploads: ${files.length - successful.length}`)
    }

  } catch (error) {
    console.error('💥 Bulk upload failed:', error.message)
    process.exit(1)
  }
}

// CLI Usage
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.log(`
📷 Bulk Photo Upload Script

Usage:
  node scripts/bulk-upload.js <collection-id> <photos-folder-path>

Examples:
  node scripts/bulk-upload.js 12345678 ./photos/wedding-2024/
  node scripts/bulk-upload.js abcdefgh "/Users/rithy/Photos/Portrait Session"

Environment Variables Required:
  NEXT_PUBLIC_SANITY_PROJECT_ID - Your Sanity project ID
  NEXT_PUBLIC_SANITY_DATASET - Your Sanity dataset (default: production)
  SANITY_API_TOKEN - Your Sanity API token with write permissions

Supported Formats: ${SUPPORTED_FORMATS.join(', ')}
`)
  process.exit(1)
}

const [collectionId, folderPath] = args

// Validate folder exists
if (!fs.existsSync(folderPath)) {
  console.error(`❌ Folder not found: ${folderPath}`)
  process.exit(1)
}

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.SANITY_API_TOKEN) {
  console.error(`❌ Missing required environment variables:
  - NEXT_PUBLIC_SANITY_PROJECT_ID
  - SANITY_API_TOKEN
  
Add these to your .env.local file`)
  process.exit(1)
}

// Start bulk upload
bulkUploadPhotos(collectionId, folderPath)