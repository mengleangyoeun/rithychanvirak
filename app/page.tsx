import dynamic from 'next/dynamic'
import { Hero } from "@/components/sections/hero"

// Lazy load heavy components
const Portfolio = dynamic(() => import('@/components/sections/portfolio').then(mod => ({ default: mod.Portfolio })), {
  loading: () => <div className="py-24 text-center text-white/50">Loading...</div>
})
const Works = dynamic(() => import('@/components/sections/works').then(mod => ({ default: mod.Works })), {
  loading: () => <div className="py-24 text-center text-white/50">Loading...</div>
})
const Videos = dynamic(() => import('@/components/sections/videos').then(mod => ({ default: mod.Videos })), {
  loading: () => <div className="py-24 text-center text-white/50">Loading...</div>
})
const Services = dynamic(() => import('@/components/sections/services').then(mod => ({ default: mod.Services })), {
  loading: () => <div className="py-24 text-center text-white/50">Loading...</div>
})
const CTA = dynamic(() => import('@/components/sections/cta').then(mod => ({ default: mod.CTA })), {
  loading: () => <div className="py-24 text-center text-white/50">Loading...</div>
})


// Force dynamic rendering and revalidate on every request since we use Supabase cookies
export const revalidate = 0

export default async function HomePage() {
  // Fetch content from database
  const [heroData, services, featuredCollections, featuredVideos, featuredPhotos] = await Promise.all([
    fetchHeroContent(),
    fetchServices(),
    fetchFeaturedCollections(),
    fetchFeaturedVideos(),
    fetchFeaturedPhotos()
  ])

  async function fetchHeroContent() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('hero_content')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        // Fallback to default content
        return {
          _id: 'hero-1',
          title: 'RITHY CHANVIRAK',
          subtitle: 'Professional Photography Portfolio',
          backgroundImage: undefined,
          overlayOpacity: 0.5
        }
      }

      return {
        _id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        backgroundImage: data.background_image_url ? {
          asset: { _ref: data.background_image_url }
        } : undefined,
        overlayOpacity: data.overlay_opacity
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
      // Fallback to default content
      return {
        _id: 'hero-1',
        title: 'RITHY CHANVIRAK',
        subtitle: 'Professional Photography Portfolio',
        backgroundImage: undefined,
        overlayOpacity: 0.5
      }
    }
  }

  async function fetchServices() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true })

      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation "services" does not exist')) {
          return []
        }
        console.error('Error fetching services:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        })
        return []
      }

      return (data || []).map(service => ({
        _id: service.id,
        number: service.number,
        title: service.title,
        description: service.description,
        icon: service.icon
      }))
    } catch (error) {
      console.error('Error fetching services (catch block):', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        stringified: JSON.stringify(error)
      })
      return []
    }
  }

  async function fetchFeaturedCollections() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Fetch ALL collections (needed to traverse the full hierarchy)
      const { data: allCollections, error: allError } = await supabase
        .from('collections')
        .select('*')
        .order('order', { ascending: true })

      if (allError) {
        console.error('Error fetching collections:', allError)
        return []
      }

      if (!allCollections || allCollections.length === 0) return []

      // Fetch ALL collection-photo links in one query
      const { data: allLinks, error: linksError } = await supabase
        .from('collection_photos')
        .select('collection_id')

      if (linksError) {
        console.error('Error fetching collection_photos:', linksError)
        return []
      }

      // Build direct photo count map
      const directPhotoCountMap = new Map<string, number>()
      for (const link of allLinks || []) {
        directPhotoCountMap.set(link.collection_id, (directPhotoCountMap.get(link.collection_id) || 0) + 1)
      }

      // Build parent → children map for fast traversal
      const childrenMap = new Map<string, string[]>()
      for (const col of allCollections) {
        if (col.parent_id) {
          const siblings = childrenMap.get(col.parent_id) || []
          siblings.push(col.id)
          childrenMap.set(col.parent_id, siblings)
        }
      }

      // Recursively count photos and sub-albums (all depths) using BFS
      const countAll = (rootId: string): { photos: number; subAlbums: number } => {
        let photos = directPhotoCountMap.get(rootId) || 0
        let subAlbums = 0
        const queue = [rootId]
        while (queue.length > 0) {
          const current = queue.shift()!
          const children = childrenMap.get(current) || []
          for (const childId of children) {
            photos += directPhotoCountMap.get(childId) || 0
            subAlbums += 1
            queue.push(childId)
          }
        }
        return { photos, subAlbums }
      }

      // Only return featured top-level collections
      const featuredRoot = allCollections
        .filter(col => col.featured && !col.parent_id)
        .slice(0, 6)

      return featuredRoot.map(collection => {
        const { photos, subAlbums } = countAll(collection.id)
        return { ...collection, totalPhotos: photos, subAlbums }
      })
    } catch (error) {
      console.error('Error fetching featured collections:', error)
      return []
    }
  }

  async function fetchFeaturedVideos() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: featured, error } = await supabase
        .from('videos')
        .select('*')
        .eq('featured', true)
        .eq('is_active', true)
        .order('order', { ascending: true })
        .limit(8)

      if (error) {
        console.error('Error fetching featured videos:', error)
        return []
      }

      // Fallback: if nothing is featured, show the 4 most-recent active videos
      let videos = featured || []
      if (videos.length === 0) {
        const { data: recent } = await supabase
          .from('videos')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4)
        videos = recent || []
      }

      return videos.map(video => ({
        _id: video.id,
        title: video.title,
        slug: { current: video.slug },
        videoUrl: video.video_url,
        videoType: video.video_type,
        thumbnailUrl: video.thumbnail_url,
        category: video.category,
        year: video.year
      }))
    } catch (error) {
      console.error('Error fetching featured videos:', error)
      return []
    }
  }

  async function fetchFeaturedPhotos() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('featured', true)
        // Sort by admin-defined order first, then fall back to newest
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) {
        console.error('Error fetching featured photos:', error)
        return []
      }

      return (photos || []).map(photo => ({
        _id: photo.id,
        title: photo.title,
        slug: { current: photo.id },
        imageUrl: photo.image_url,
        imageId: photo.image_id,
        alt: photo.alt || photo.title
      }))
    } catch (error) {
      console.error('Error fetching featured photos:', error)
      return []
    }
  }

  return (
    <>
      <Hero data={heroData} />
      <main className="unified-background">
        <Portfolio collections={featuredCollections} showTitle={true} />
        <Videos videos={featuredVideos} />
        <Works photos={featuredPhotos} />
        <Services services={services} />
        <CTA />
      </main>
    </>
  )
}
