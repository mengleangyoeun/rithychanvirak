export function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[150px] md:auto-rows-[200px] gap-3 md:gap-4" style={{ gridAutoFlow: 'dense' }}>
      {Array.from({ length: 12 }).map((_, index) => {
        // Conservative spans matching actual photo grid logic
        const colSpan = index % 8 === 0 ? 'col-span-2' : 'col-span-1' // Very few wide ones
        const rowSpan = index % 4 === 0 ? 'row-span-2' : 'row-span-1' // Some tall portraits

        return (
          <div
            key={index}
            className={`${colSpan} ${rowSpan}`}
          >
            <div className="relative h-full overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 animate-pulse" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
