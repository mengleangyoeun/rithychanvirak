/**
 * Script to fetch EXIF data from Cloudinary and populate photo metadata
 *
 * Usage: npx tsx scripts/populate-exif.ts
 */

import { client } from '../sanity/lib/client'

interface CloudinaryResource {
  public_id: string
  image_metadata?: {
    Make?: string
    Model?: string
    LensModel?: string
    FNumber?: number
    ExposureTime?: string
    ISO?: number
    FocalLength?: number
    DateTimeOriginal?: string
    Software?: string
  }
}

async function fetchCloudinaryMetadata(publicId: string): Promise<CloudinaryResource | null> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  if (!cloudName) {
    console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set')
    return null
  }

  try {
    // Cloudinary API endpoint to get resource details
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.json`

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch metadata for ${publicId}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching metadata for ${publicId}:`, error)
    return null
  }
}

async function populateExifData() {
  console.log('Fetching all photos from Sanity...')

  // Get all photos
  const photos = await client.fetch(`
    *[_type == "photo"] {
      _id,
      title,
      imageId,
      camera,
      lens,
      settings,
      exifData
    }
  `)

  console.log(`Found ${photos.length} photos`)

  for (const photo of photos) {
    console.log(`\nProcessing: ${photo.title}`)

    if (!photo.imageId) {
      console.log('  ⚠️  No imageId, skipping')
      continue
    }

    // Fetch metadata from Cloudinary
    const metadata = await fetchCloudinaryMetadata(photo.imageId)

    if (!metadata?.image_metadata) {
      console.log('  ⚠️  No EXIF data available')
      continue
    }

    const exif = metadata.image_metadata

    // Prepare updates
    const updates: any = {}

    // Update exifData field (raw EXIF)
    if (Object.keys(exif).length > 0) {
      updates.exifData = {
        make: exif.Make,
        model: exif.Model,
        lensModel: exif.LensModel,
        fNumber: exif.FNumber,
        exposureTime: exif.ExposureTime,
        iso: exif.ISO,
        focalLength: exif.FocalLength,
        dateTimeOriginal: exif.DateTimeOriginal,
        software: exif.Software
      }
      console.log('  ✓ Found EXIF data')
    }

    // Auto-populate camera field if not set
    if (!photo.camera && exif.Make && exif.Model) {
      updates.camera = `${exif.Make} ${exif.Model}`.trim()
      console.log(`  ✓ Camera: ${updates.camera}`)
    }

    // Auto-populate lens field if not set
    if (!photo.lens && exif.LensModel) {
      updates.lens = exif.LensModel
      console.log(`  ✓ Lens: ${updates.lens}`)
    }

    // Auto-populate settings if not set
    if (!photo.settings && (exif.FNumber || exif.ExposureTime || exif.ISO || exif.FocalLength)) {
      updates.settings = {
        aperture: exif.FNumber ? exif.FNumber.toString() : undefined,
        shutter: exif.ExposureTime,
        iso: exif.ISO ? exif.ISO.toString() : undefined,
        focalLength: exif.FocalLength ? `${exif.FocalLength}mm` : undefined
      }
      console.log(`  ✓ Settings: f/${updates.settings.aperture}, ${updates.settings.shutter}s, ISO ${updates.settings.iso}`)
    }

    // Auto-populate capture date if not set
    if (exif.DateTimeOriginal) {
      try {
        // Parse EXIF date format: "2024:01:15 14:30:00"
        const dateStr = exif.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          updates.captureDate = date.toISOString().split('T')[0]
          console.log(`  ✓ Capture date: ${updates.captureDate}`)
        }
      } catch (e) {
        console.log('  ⚠️  Could not parse capture date')
      }
    }

    // Update the document
    if (Object.keys(updates).length > 0) {
      try {
        await client.patch(photo._id).set(updates).commit()
        console.log('  ✅ Updated successfully')
      } catch (error) {
        console.error('  ❌ Failed to update:', error)
      }
    } else {
      console.log('  - No updates needed')
    }

    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n✅ Done!')
}

// Run the script
populateExifData().catch(console.error)
