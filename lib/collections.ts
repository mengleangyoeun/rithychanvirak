import { createClient } from '@/lib/supabase/server'
import type { Collection, Photo } from '@/types/database'

export interface CollectionWithStats extends Collection {
  totalPhotos: number
  directPhotosCount: number
  subAlbums: number
  previewPhotos: string[]
}

export interface CollectionDetailData {
  collection: CollectionWithStats & {
    childCollections: CollectionWithStats[]
    parentCollection?: { title: string; slug: string }
    collectionType: 'main' | 'sub'
  }
  photos: Photo[]
}

/**
 * Fetch all collection_photos in batches to avoid PostgREST 1,000-row silent truncation.
 */
async function fetchAllCollectionPhotoLinks(supabase: Awaited<ReturnType<typeof createClient>>) {
  const allLinks: {
    collection_id: string
    photo_id: string
    order: number
    photos: { id: string; image_url: string } | { id: string; image_url: string }[] | null
  }[] = []

  const PAGE_SIZE = 1000
  let from = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('collection_photos')
      .select(`
        collection_id,
        photo_id,
        order,
        photos ( id, image_url )
      `)
      .order('order', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching collection_photos batch:', error)
      break
    }

    if (data && data.length > 0) {
      allLinks.push(...(data as unknown as typeof allLinks))
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        from += PAGE_SIZE
      }
    } else {
      hasMore = false
    }
  }

  return allLinks
}

/**
 * Fetch all photos in batches to avoid PostgREST 1,000-row silent truncation.
 */
async function fetchAllPhotos(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Photo[]> {
  const allPhotos: Photo[] = []
  const PAGE_SIZE = 1000
  let from = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('Error fetching photos batch:', error)
      break
    }

    if (data && data.length > 0) {
      allPhotos.push(...(data as Photo[]))
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        from += PAGE_SIZE
      }
    } else {
      hasMore = false
    }
  }

  return allPhotos
}

/**
 * Core engine to build collection hierarchy, count unique photos recursively, and gather preview collages.
 */
export async function getCollectionsHierarchy(): Promise<{
  allCollections: Collection[]
  rootCollections: CollectionWithStats[]
  collectionsMap: Map<string, CollectionWithStats>
  directPhotoIdsMap: Map<string, Set<string>>
  directPhotosMap: Map<string, { url: string; order: number }[]>
  childrenMap: Map<string, string[]>
}> {
  const supabase = await createClient()

  // 1. Fetch all collections
  const { data: allCollections, error: collectionsError } = await supabase
    .from('collections')
    .select('*')
    .order('order', { ascending: true })

  if (collectionsError || !allCollections || allCollections.length === 0) {
    return {
      allCollections: [],
      rootCollections: [],
      collectionsMap: new Map(),
      directPhotoIdsMap: new Map(),
      directPhotosMap: new Map(),
      childrenMap: new Map(),
    }
  }

  // 2. Fetch all collection_photos with batch pagination
  const allLinks = await fetchAllCollectionPhotoLinks(supabase)

  // 3. Build maps for direct photo IDs and preview photos
  const directPhotoIdsMap = new Map<string, Set<string>>()
  const directPhotosMap = new Map<string, { url: string; order: number }[]>()

  for (const link of allLinks) {
    const rawPhoto = link.photos
    const photo = Array.isArray(rawPhoto) ? rawPhoto[0] : rawPhoto
    const photoId = link.photo_id || (photo && photo.id)

    if (link.collection_id && photoId) {
      const idSet = directPhotoIdsMap.get(link.collection_id) || new Set<string>()
      idSet.add(photoId)
      directPhotoIdsMap.set(link.collection_id, idSet)

      const imageUrl = photo?.image_url
      if (imageUrl) {
        const list = directPhotosMap.get(link.collection_id) || []
        list.push({ url: imageUrl, order: link.order || 0 })
        directPhotosMap.set(link.collection_id, list)
      }
    }
  }

  // 4. Build parent -> children map for hierarchy traversal
  const childrenMap = new Map<string, string[]>()
  for (const col of allCollections) {
    if (col.parent_id) {
      const siblings = childrenMap.get(col.parent_id) || []
      siblings.push(col.id)
      childrenMap.set(col.parent_id, siblings)
    }
  }

  // 5. Recursive tree-aggregation function for any collection node
  const computeStatsForNode = (nodeId: string) => {
    const photoIds = new Set<string>(directPhotoIdsMap.get(nodeId) || [])
    let subAlbums = 0
    const allPreviewPhotos: { url: string; order: number }[] = [
      ...(directPhotosMap.get(nodeId) || []),
    ]

    const queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      const children = childrenMap.get(current) || []
      for (const childId of children) {
        const childPhotoIds = directPhotoIdsMap.get(childId) || []
        childPhotoIds.forEach((id) => photoIds.add(id))
        subAlbums += 1
        allPreviewPhotos.push(...(directPhotosMap.get(childId) || []))
        queue.push(childId)
      }
    }

    const previewPhotos = allPreviewPhotos
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map((p) => p.url)

    return {
      totalPhotos: photoIds.size,
      directPhotosCount: (directPhotoIdsMap.get(nodeId) || new Set()).size,
      subAlbums,
      previewPhotos,
    }
  }

  // 6. Build enriched collections map
  const collectionsMap = new Map<string, CollectionWithStats>()
  for (const col of allCollections) {
    const stats = computeStatsForNode(col.id)
    let finalPreviews = stats.previewPhotos
    if (col.cover_image_url) {
      const filtered = stats.previewPhotos.filter((url) => url !== col.cover_image_url)
      finalPreviews = [col.cover_image_url, ...filtered].slice(0, 3)
    }

    collectionsMap.set(col.id, {
      ...col,
      totalPhotos: stats.totalPhotos,
      directPhotosCount: stats.directPhotosCount,
      subAlbums: stats.subAlbums,
      previewPhotos: finalPreviews,
    })
  }

  // 7. Get root collections
  const rootCollections: CollectionWithStats[] = allCollections
    .filter((col) => !col.parent_id)
    .map((col) => collectionsMap.get(col.id)!)

  return {
    allCollections,
    rootCollections,
    collectionsMap,
    directPhotoIdsMap,
    directPhotosMap,
    childrenMap,
  }
}

/**
 * Fetch featured collections for homepage with fallback to top-level collections.
 */
export async function getFeaturedCollections(): Promise<CollectionWithStats[]> {
  const { rootCollections } = await getCollectionsHierarchy()

  let featured = rootCollections.filter((col) => col.featured)
  if (featured.length === 0) {
    featured = rootCollections
  }

  return featured.slice(0, 9)
}

/**
 * Fetch all gallery collections for /gallery page.
 */
export async function getGalleryCollections(): Promise<{
  collections: CollectionWithStats[]
  totalPhotosCount: number
}> {
  const { rootCollections } = await getCollectionsHierarchy()
  const totalPhotosCount = rootCollections.reduce((sum, col) => sum + col.totalPhotos, 0)

  return {
    collections: rootCollections,
    totalPhotosCount,
  }
}

/**
 * Fetch a single collection by slug (or ID) with all direct photos and sub-collections.
 */
export async function getCollectionDetail(slug: string): Promise<CollectionDetailData | null> {
  const supabase = await createClient()

  // Handle special 'root' uncategorized collection
  if (slug === 'root') {
    const [rawPhotos, allLinks] = await Promise.all([
      fetchAllPhotos(supabase),
      fetchAllCollectionPhotoLinks(supabase),
    ])

    const linkedIds = new Set(allLinks.map((r) => r.photo_id))
    const rootPhotos = rawPhotos.filter((p) => !linkedIds.has(p.id))
    const now = new Date().toISOString()

    const rootCollectionStats: CollectionWithStats = {
      id: 'root-uncategorized',
      title: 'Root Album',
      slug: 'root',
      description: 'Photos uploaded without assigning to a collection',
      parent_id: undefined,
      order: -1,
      created_at: now,
      updated_at: now,
      totalPhotos: rootPhotos.length,
      directPhotosCount: rootPhotos.length,
      subAlbums: 0,
      previewPhotos: rootPhotos.slice(0, 3).map((p) => p.image_url),
    }

    return {
      collection: {
        ...rootCollectionStats,
        childCollections: [],
        collectionType: 'sub',
      },
      photos: rootPhotos,
    }
  }

  const { allCollections, collectionsMap, childrenMap } = await getCollectionsHierarchy()

  const decodedSlug = decodeURIComponent(slug).toLowerCase()
  const targetCol = allCollections.find(
    (c) => c.slug.toLowerCase() === decodedSlug || c.id === slug
  )

  if (!targetCol) return null

  const targetStats = collectionsMap.get(targetCol.id)!

  // Child collections
  const childIds = childrenMap.get(targetCol.id) || []
  const childCollections: CollectionWithStats[] = childIds
    .map((id) => collectionsMap.get(id))
    .filter(Boolean) as CollectionWithStats[]

  // Parent collection
  const parentCol = targetCol.parent_id
    ? allCollections.find((c) => c.id === targetCol.parent_id)
    : undefined

  // Direct photos for this collection
  const { data: directPhotoLinks } = await supabase
    .from('collection_photos')
    .select(`
      order,
      photos (*)
    `)
    .eq('collection_id', targetCol.id)
    .order('order', { ascending: true })

  const photoLinks = (directPhotoLinks || []) as unknown as { photos: Photo | Photo[] | null }[]
  const photos: Photo[] = photoLinks
    .map((link) => {
      const raw = link.photos
      return Array.isArray(raw) ? raw[0] : raw
    })
    .filter(Boolean) as Photo[]

  return {
    collection: {
      ...targetStats,
      childCollections,
      parentCollection: parentCol ? { title: parentCol.title, slug: parentCol.slug } : undefined,
      collectionType: targetCol.parent_id ? 'sub' : 'main',
    },
    photos,
  }
}
