import dynamic from 'next/dynamic'
import { Hero } from "@/components/sections/hero"
import { client } from '@/sanity/lib/client'

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

async function getFeaturedPhotos() {
  return client.fetch(`
    *[_type == "photo" && featured == true && defined(imageUrl)] | order(_createdAt desc)[0...6] {
      _id,
      title,
      slug,
      imageUrl,
      imageId,
      alt,
      description,
      collection-> {
        title,
        slug
      }
    }
  `)
}

async function getFeaturedCollections() {
  return client.fetch(`
    *[_type == "collection" && featured == true && collectionType == "main" && status == "published"] | order(order asc)[0...3] {
      _id,
      title,
      slug,
      description,
      coverImage,
      "subAlbums": count(*[_type == "collection" && parentCollection._ref == ^._id]),
      "totalPhotos": count(*[_type == "photo" && (
        collection._ref == ^._id ||
        collection->parentCollection._ref == ^._id
      )])
    }
  `)
}

async function getHeroData() {
  return client.fetch(`
    *[_type == "hero"][0] {
      _id,
      title,
      subtitle,
      backgroundImage,
      overlayOpacity
    }
  `)
}

async function getFeaturedVideos() {
  return client.fetch(`
    *[_type == "video" && featured == true] | order(order asc, year desc)[0...6] {
      _id,
      title,
      slug,
      videoUrl,
      videoType,
      thumbnailUrl,
      thumbnailId,
      category,
      year
    }
  `)
}

async function getFeaturedServices() {
  return client.fetch(`
    *[_type == "service" && featured == true && active == true] | order(number asc) {
      _id,
      number,
      title,
      description,
      icon,
      featured
    }
  `)
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

export default async function HomePage() {
  const [photosData, collectionsData, heroData, videosData, servicesData] = await Promise.all([
    getFeaturedPhotos().catch(() => []),
    getFeaturedCollections().catch(() => []),
    getHeroData().catch(() => null),
    getFeaturedVideos().catch(() => []),
    getFeaturedServices().catch(() => [])
  ])

  // Collections already have totalPhotos from Sanity query
  const collectionsWithTotals = collectionsData || []

  return (
    <>
      <Hero data={heroData} />
      <main className="unified-background">
        <Portfolio collections={collectionsWithTotals} />
        <Works photos={photosData} />
        <Videos videos={videosData} />
        <Services services={servicesData} />
        <CTA />
      </main>
    </>
  )
}
