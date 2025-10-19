/**
 * Cloudinary Folder Organization Utility
 * Auto-generates organized folder paths based on content type
 */

export type ContentType = 'collection' | 'video' | 'hero' | 'profile' | 'misc'

interface FolderOptions {
  type: ContentType
  collectionSlug?: string
  collectionName?: string
  videoSlug?: string
}

/**
 * Generate a Cloudinary folder path based on content type
 *
 * @example
 * // For a collection
 * getCloudinaryFolder({ type: 'collection', collectionSlug: 'wedding-2024' })
 * // Returns: "rithychanvirak/collections/wedding-2024"
 *
 * @example
 * // For a video thumbnail
 * getCloudinaryFolder({ type: 'video', videoSlug: 'highlights-2024' })
 * // Returns: "rithychanvirak/videos/highlights-2024"
 */
export function getCloudinaryFolder(options: FolderOptions): string {
  const ROOT = 'rithychanvirak'

  switch (options.type) {
    case 'collection':
      if (!options.collectionSlug) {
        throw new Error('collectionSlug is required for collection type')
      }
      // Sanitize slug for folder name (remove special chars, lowercase)
      const safeSlug = sanitizeSlug(options.collectionSlug)
      return `${ROOT}/collections/${safeSlug}`

    case 'video':
      if (!options.videoSlug) {
        throw new Error('videoSlug is required for video type')
      }
      const safeVideoSlug = sanitizeSlug(options.videoSlug)
      return `${ROOT}/videos/${safeVideoSlug}`

    case 'hero':
      return `${ROOT}/hero`

    case 'profile':
      return `${ROOT}/profile`

    case 'misc':
    default:
      return `${ROOT}/misc`
  }
}

/**
 * Sanitize a slug for use in Cloudinary folder names
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Get collection folder from collection data
 */
export function getCollectionFolder(collection: { slug?: string; name?: string; id?: string }): string {
  const slug = collection.slug || collection.name || collection.id || 'untitled'
  return getCloudinaryFolder({ type: 'collection', collectionSlug: slug })
}

/**
 * Get video folder from video data
 */
export function getVideoFolder(video: { slug?: string; title?: string; id?: string }): string {
  const slug = video.slug || video.title || video.id || 'untitled'
  return getCloudinaryFolder({ type: 'video', videoSlug: slug })
}

/**
 * Parse folder path to extract information
 * @example
 * parseFolderPath('rithychanvirak/collections/wedding-2024')
 * // Returns: { type: 'collection', slug: 'wedding-2024' }
 */
export function parseFolderPath(folderPath: string): { type: ContentType; slug?: string } | null {
  const parts = folderPath.split('/')

  if (parts.length < 2) return null

  const [root, type, slug] = parts

  if (root !== 'rithychanvirak') return null

  switch (type) {
    case 'collections':
      return { type: 'collection', slug }
    case 'videos':
      return { type: 'video', slug }
    case 'hero':
      return { type: 'hero' }
    case 'profile':
      return { type: 'profile' }
    case 'misc':
      return { type: 'misc' }
    default:
      return null
  }
}
