export function CollectionCardSkeleton() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
      {/* Image skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 animate-pulse" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content skeleton */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Title */}
        <div className="h-7 w-3/4 mb-3 bg-white/20 rounded animate-pulse" />

        {/* Description */}
        <div className="h-4 w-full mb-2 bg-white/15 rounded animate-pulse" />
        <div className="h-4 w-2/3 mb-4 bg-white/15 rounded animate-pulse" />

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 bg-white/15 rounded animate-pulse" />
          <div className="h-4 w-12 bg-white/15 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function CollectionCardSkeletonPortfolio() {
  return (
    <div className="relative h-80 sm:h-96 overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
      {/* Image skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 animate-pulse" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content skeleton */}
      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
        {/* Title */}
        <div className="h-7 sm:h-8 w-3/4 mb-3 bg-white/20 rounded animate-pulse" />

        {/* Description */}
        <div className="h-3 sm:h-4 w-full mb-2 bg-white/15 rounded animate-pulse" />
        <div className="h-3 sm:h-4 w-2/3 mb-3 sm:mb-4 bg-white/15 rounded animate-pulse" />

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-4 w-12 bg-white/15 rounded animate-pulse" />
          <div className="h-4 w-12 bg-white/15 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
