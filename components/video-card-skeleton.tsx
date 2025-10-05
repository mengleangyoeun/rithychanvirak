export function VideoCardSkeleton() {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
      {/* Video thumbnail skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 animate-pulse" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20"></div>

      {/* Play button skeleton */}
      <div className="absolute inset-0 flex items-center justify-center z-30">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md animate-pulse" />
      </div>

      {/* Info overlay skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Title */}
            <div className="h-7 w-3/4 bg-white/20 rounded mb-3 animate-pulse" />

            {/* Description */}
            <div className="h-4 w-full bg-white/15 rounded mb-2 animate-pulse" />
            <div className="h-4 w-2/3 bg-white/15 rounded mb-3 animate-pulse" />

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-20 bg-white/15 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-white/15 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
