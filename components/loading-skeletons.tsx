import { Skeleton } from '@/components/ui/skeleton'

export function GalleryLoadingSkeleton() {
  return (
    <div className="min-h-screen unified-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-16">
          <Skeleton className="h-20 w-96 mx-auto mb-6" />
          <Skeleton className="h-6 w-[500px] mx-auto mb-8" />
          <Skeleton className="h-12 w-96 mx-auto rounded-full" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative aspect-[4/3]">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PhotoGridSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="break-inside-avoid mb-4">
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function VideoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative aspect-video">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

export function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen unified-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <Skeleton className="h-10 w-40 mb-8" />

        {/* Header */}
        <div className="mb-16">
          <Skeleton className="h-16 w-[600px] mb-4" />
          <Skeleton className="h-6 w-[800px] mb-6" />
          <div className="flex gap-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Photos */}
        <PhotoGridSkeleton />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="text-center mb-16 py-24">
      <Skeleton className="h-24 w-[500px] mx-auto mb-6" />
      <Skeleton className="h-6 w-[600px] mx-auto" />
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-32 w-[700px] mx-auto mb-6" />
        <Skeleton className="h-8 w-[500px] mx-auto" />
      </div>
    </div>
  )
}
