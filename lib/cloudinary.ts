interface CloudinaryTransformOptions {
  width?: number
  height?: number
  quality?: 'auto' | 'auto:good' | 'auto:eco' | number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'scale' | 'crop'
  dpr?: 'auto' | number
  progressive?: boolean
}

export const buildCloudinaryUrl = (
  publicId: string, 
  options: CloudinaryTransformOptions = {}
): string => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  
  if (!cloudName) {
    // Graceful fallback in development/misconfigured env:
    // - if a full URL was passed, use it directly
    // - otherwise use a local placeholder to avoid runtime crashes
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
      return publicId
    }
    return '/file.svg'
  }

  const transformations: string[] = []
  
  if (options.quality) {
    transformations.push(`q_${options.quality}`)
  }
  
  if (options.format) {
    transformations.push(`f_${options.format}`)
  }

  if (options.dpr) {
    transformations.push(`dpr_${options.dpr}`)
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

  if (options.progressive) {
    transformations.push('fl_progressive')
  }

  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : ''
  
  return `https://res.cloudinary.com/${cloudName}/image/upload${transformString}/${publicId}`
}

export const getOptimizedImageUrl = (publicId: string, width: number = 800) => {
  return buildCloudinaryUrl(publicId, {
    width,
    quality: 'auto:good',
    format: 'auto',
    crop: 'fill',
    dpr: 'auto',
    progressive: true,
  })
}

export const getThumbnailUrl = (publicId: string, width: number = 600) => {
  return buildCloudinaryUrl(publicId, {
    width,
    quality: 'auto:eco',
    format: 'auto',
    crop: 'fit',
    dpr: 'auto',
    progressive: true,
  })
}

export const getFullImageUrl = (publicId: string) => {
  return buildCloudinaryUrl(publicId, {
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
    progressive: true,
  })
}

export const extractCloudinaryPublicId = (source: string): string | null => {
  if (!source || !source.includes('/upload/')) return null

  try {
    const noQuery = source.split('?')[0]
    const uploadIndex = noQuery.indexOf('/upload/')
    if (uploadIndex === -1) return null

    const afterUpload = noQuery.slice(uploadIndex + '/upload/'.length)
    const parts = afterUpload.split('/').filter(Boolean)
    if (parts.length === 0) return null

    // Remove transformation chunks until version/public id segment.
    // Cloudinary version segment is typically v123456789.
    let startIndex = 0
    for (let i = 0; i < parts.length; i += 1) {
      if (/^v\d+$/.test(parts[i])) {
        startIndex = i + 1
        break
      }
      // If segment looks like a folder/file token, stop early.
      if (!parts[i].includes('_') && !parts[i].includes(',')) {
        startIndex = i
        break
      }
    }

    const publicPath = parts.slice(startIndex).join('/')
    if (!publicPath) return null
    return publicPath.replace(/\.[a-zA-Z0-9]+$/, '')
  } catch {
    return null
  }
}

export const getOptimizedImageFromSource = (source: string, width: number = 800): string => {
  const publicId = extractCloudinaryPublicId(source)
  if (!publicId) return source
  return getOptimizedImageUrl(publicId, width)
}

export const getThumbnailFromSource = (source: string, width: number = 600): string => {
  const publicId = extractCloudinaryPublicId(source)
  if (!publicId) return source
  return getThumbnailUrl(publicId, width)
}

export const getBlurPlaceholderDataUrl = (
  width: number = 64,
  height: number = 64,
  color: string = '#111827'
): string => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><filter id='b' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='18'/></filter><rect width='100%' height='100%' fill='${color}' filter='url(#b)'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
