interface CloudinaryTransformOptions {
  width?: number
  height?: number
  quality?: 'auto' | number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'scale' | 'crop'
}

export const buildCloudinaryUrl = (
  publicId: string, 
  options: CloudinaryTransformOptions = {}
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured')
  }

  const transformations: string[] = []
  
  if (options.quality) {
    transformations.push(`q_${options.quality}`)
  }
  
  if (options.format) {
    transformations.push(`f_${options.format}`)
  }
  
  if (options.width) {
    transformations.push(`w_${options.width}`)
  }
  
  if (options.height) {
    transformations.push(`h_${options.height}`)
  }
  
  if (options.crop) {
    transformations.push(`c_${options.crop}`)
  }

  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : ''
  
  return `https://res.cloudinary.com/${cloudName}/image/upload${transformString}/${publicId}`
}

export const getOptimizedImageUrl = (publicId: string, width: number = 800) => {
  return buildCloudinaryUrl(publicId, {
    width,
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  })
}

export const getThumbnailUrl = (publicId: string) => {
  return buildCloudinaryUrl(publicId, {
    width: 400,
    height: 300,
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  })
}