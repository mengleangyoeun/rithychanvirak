import { client } from '../sanity/lib/client'
import { config } from 'dotenv'

config()

interface CloudinaryMetadata {
  image_metadata?: {
    Make?: string
    Model?: string
    LensModel?: string
    FNumber?: number
    ExposureTime?: string
    ISOSpeedRatings?: number
    FocalLength?: number
    DateTimeOriginal?: string
    Software?: string
  }
}

async function extractExifFromCloudinary() {
  console.log('🔍 Fetching photos from Sanity...')

  // Fetch all photos that have Cloudinary imageId but no EXIF data
  const photos = await client.fetch(`
    *[_type == "photo" && defined(imageId) && !defined(exifData)] {
      _id,
      title,
      imageId,
      imageUrl
    }
  `)

  console.log(`📸 Found ${photos.length} photos without EXIF data`)

  if (photos.length === 0) {
    console.log('✅ All photos already have EXIF data!')
    return
  }

  let updatedCount = 0
  let failedCount = 0

  for (const photo of photos) {
    try {
      console.log(`\n📷 Processing: ${photo.title}`)
      console.log(`   Cloudinary ID: ${photo.imageId}`)

      // Fetch metadata from Cloudinary
      const metadataUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${photo.imageId}.json`

      const response = await fetch(metadataUrl)

      if (!response.ok) {
        console.log(`   ⚠️  Could not fetch metadata (${response.status})`)
        failedCount++
        continue
      }

      const metadata: CloudinaryMetadata = await response.json()
      const exif = metadata.image_metadata

      if (!exif || Object.keys(exif).length === 0) {
        console.log(`   ℹ️  No EXIF data found in image`)
        failedCount++
        continue
      }

      console.log(`   ✓ Found EXIF data:`)
      if (exif.Make) console.log(`     Camera: ${exif.Make} ${exif.Model || ''}`)
      if (exif.LensModel) console.log(`     Lens: ${exif.LensModel}`)
      if (exif.FNumber) console.log(`     Aperture: f/${exif.FNumber}`)
      if (exif.ExposureTime) console.log(`     Shutter: ${exif.ExposureTime}`)
      if (exif.ISOSpeedRatings) console.log(`     ISO: ${exif.ISOSpeedRatings}`)
      if (exif.FocalLength) console.log(`     Focal Length: ${exif.FocalLength}mm`)

      // Prepare the update data
      const updateData: any = {
        exifData: {
          _type: 'object',
          make: exif.Make || undefined,
          model: exif.Model || undefined,
          lensModel: exif.LensModel || undefined,
          fNumber: exif.FNumber || undefined,
          exposureTime: exif.ExposureTime || undefined,
          iso: exif.ISOSpeedRatings || undefined,
          focalLength: exif.FocalLength || undefined,
          dateTimeOriginal: exif.DateTimeOriginal || undefined,
          software: exif.Software || undefined,
        }
      }

      // Also populate the user-friendly fields if they're empty
      const cameraName = exif.Make && exif.Model
        ? `${exif.Make} ${exif.Model}`.trim()
        : undefined

      if (cameraName) {
        updateData.camera = cameraName
      }

      if (exif.LensModel) {
        updateData.lens = exif.LensModel
      }

      if (exif.FNumber || exif.ExposureTime || exif.ISOSpeedRatings || exif.FocalLength) {
        updateData.settings = {
          _type: 'object',
          aperture: exif.FNumber ? String(exif.FNumber) : undefined,
          shutter: exif.ExposureTime || undefined,
          iso: exif.ISOSpeedRatings ? String(exif.ISOSpeedRatings) : undefined,
          focalLength: exif.FocalLength ? String(exif.FocalLength) : undefined,
        }
      }

      if (exif.DateTimeOriginal && !photo.captureDate) {
        // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO date (YYYY-MM-DD)
        const dateMatch = exif.DateTimeOriginal.match(/^(\d{4}):(\d{2}):(\d{2})/)
        if (dateMatch) {
          updateData.captureDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
        }
      }

      // Update the photo in Sanity
      await client
        .patch(photo._id)
        .set(updateData)
        .commit()

      console.log(`   ✅ Updated Sanity record`)
      updatedCount++

    } catch (error) {
      console.error(`   ❌ Error processing ${photo.title}:`, error)
      failedCount++
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n\n📊 Summary:`)
  console.log(`   ✅ Successfully updated: ${updatedCount}`)
  console.log(`   ❌ Failed: ${failedCount}`)
  console.log(`   📸 Total processed: ${photos.length}`)
}

// Run the script
extractExifFromCloudinary()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
