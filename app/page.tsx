import { Hero } from "@/components/sections/hero"
import { Portfolio } from "@/components/sections/portfolio"
import { Videos } from "@/components/sections/videos"
import { Services } from "@/components/sections/services"
import { getFeaturedCollections } from "@/lib/collections"

// Force dynamic rendering and revalidate on every request since we use Supabase cookies
export const revalidate = 0

export default async function HomePage() {
  // Fetch content from database
  const [heroData, services, featuredCollections, featuredVideos] = await Promise.all([
    fetchHeroContent(),
    fetchServices(),
    getFeaturedCollections(),
    fetchFeaturedVideos()
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



  return (
    <>
      <Hero data={heroData} />
      
      {/* Seamless Connecting Line Bridge */}
      <div id="portfolio-section" className="relative flex flex-col items-center -mt-2 mb-6">
        <div className="w-px h-10 bg-gradient-to-b from-white/25 via-zinc-700 to-zinc-800" />
        <div className="flex items-center gap-3 my-1.5">
          <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-zinc-800 to-zinc-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 font-medium">
            SELECTED WORKS
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <div className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-zinc-800 to-zinc-700" />
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-24 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
          
          {/* Featured Collections span full width */}
          <div className="md:col-span-2 lg:col-span-4">
             <Portfolio collections={featuredCollections} showTitle={true} />
          </div>

          {/* Videos span full width */}
          <div className="md:col-span-2 lg:col-span-4">
             <Videos videos={featuredVideos} />
          </div>

          {/* Services span full width */}
          <div className="md:col-span-2 lg:col-span-4">
             <Services services={services} />
          </div>
          
        </div>
      </main>
    </>
  )
}
