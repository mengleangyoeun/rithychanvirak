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


// Revalidate every 60 seconds (ISR)
export const revalidate = 60

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
          console.log('Services table not found - run migration first')
          return []
        }
        console.error('Error fetching services:', error)
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
      console.error('Error fetching services:', error)
      return []
    }
  }

  async function fetchFeaturedCollections() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // Fetch featured collections with photo and sub-album counts
      const { data: collections, error } = await supabase
        .from('collections')
        .select('*')
        .eq('featured', true)
        .is('parent_id', null) // Only top-level collections
        .order('order', { ascending: true })
        .limit(6)

      if (error) {
        console.error('Error fetching featured collections:', error)
        return []
      }

      if (!collections || collections.length === 0) {
        return []
      }

      // Fetch stats for each collection
      const collectionsWithStats = await Promise.all(
        collections.map(async (collection) => {
          // Count photos in collection
          const { count: photoCount } = await supabase
            .from('collection_photos')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id)

          // Count sub-albums
          const { count: subAlbumCount } = await supabase
            .from('collections')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', collection.id)

          return {
            ...collection,
            totalPhotos: photoCount || 0,
            subAlbums: subAlbumCount || 0
          }
        })
      )

      return collectionsWithStats
    } catch (error) {
      console.error('Error fetching featured collections:', error)
      return []
    }
  }

  async function fetchFeaturedVideos() {
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .eq('featured', true)
        .order('order', { ascending: true })
        .limit(8)

      if (error) {
        console.error('Error fetching featured videos:', error)
        return []
      }

      // Transform to match the Videos component interface
      return (videos || []).map(video => ({
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
        .order('order', { ascending: true })
        .limit(12)

      if (error) {
        console.error('Error fetching featured photos:', error)
        return []
      }

      // Transform to match the Works component interface
      return (photos || []).map(photo => ({
        _id: photo.id,
        title: photo.title,
        slug: { current: photo.id }, // Use ID as slug for now
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
