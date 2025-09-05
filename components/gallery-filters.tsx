'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Filter, Grid, Columns, LayoutGrid, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Collection {
  _id: string
  title: string
  slug: { current: string }
  description?: string
}

interface GalleryFiltersProps {
  collections: Collection[]
  totalPhotos: number
  filteredCount: number
  searchTerm: string
  selectedCollection: string
  sortBy: 'newest' | 'oldest' | 'title'
  layout: 'grid' | 'masonry' | 'justified'
  onSearchChange: (term: string) => void
  onCollectionChange: (collection: string) => void
  onSortChange: (sort: 'newest' | 'oldest' | 'title') => void
  onLayoutChange: (layout: 'grid' | 'masonry' | 'justified') => void
  onClearFilters: () => void
}

export function GalleryFilters({
  collections,
  totalPhotos,
  filteredCount,
  searchTerm,
  selectedCollection,
  sortBy,
  layout,
  onSearchChange,
  onCollectionChange,
  onSortChange,
  onLayoutChange,
  onClearFilters
}: GalleryFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const hasActiveFilters = searchTerm || selectedCollection !== 'all' || sortBy !== 'newest'

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search your moments..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 h-12 border-0 bg-secondary focus:bg-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl text-foreground placeholder:text-muted-foreground transition-all duration-300"
              />
              {searchTerm && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Collection Filter */}
            <Select value={selectedCollection} onValueChange={onCollectionChange}>
              <SelectTrigger className="w-full sm:w-56 h-12 border-0 bg-secondary hover:bg-card focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all duration-300">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-2xl">
                <SelectItem value="all" className="rounded-lg">All Collections ({totalPhotos})</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection._id} value={collection.slug.current} className="rounded-lg">
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Popover>
              <PopoverTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline" 
                    className="h-12 border-0 bg-secondary hover:bg-card hover:shadow-lg transition-all duration-300 rounded-xl"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse"
                      >
                        •
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-2xl border-0 shadow-2xl" align="start">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Sort Order
                    </label>
                    <Select value={sortBy} onValueChange={onSortChange}>
                      <SelectTrigger className="w-full rounded-xl border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
                        <SelectItem value="oldest" className="rounded-lg">Oldest First</SelectItem>
                        <SelectItem value="title" className="rounded-lg">Title A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      onClick={onClearFilters}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-4">
            {/* Layout Controls */}
            <div className="flex bg-secondary rounded-2xl p-1 border border-border">
              {[
                { value: 'grid', icon: Grid, label: 'Grid' },
                { value: 'masonry', icon: Columns, label: 'Masonry' },
                { value: 'justified', icon: LayoutGrid, label: 'Justified' }
              ].map(({ value, icon: Icon, label }) => (
                <motion.button
                  key={value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onLayoutChange(value as 'masonry' | 'grid' | 'justified')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    layout === value 
                      ? 'bg-foreground text-background shadow-lg' 
                      : 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-md'
                  }`}
                  title={`${label} Layout`}
                >
                  <Icon className="h-4 w-4" />
                </motion.button>
              ))}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground font-medium whitespace-nowrap bg-secondary px-4 py-3 rounded-xl border border-border">
              {filteredCount === totalPhotos ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {totalPhotos} photos
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {filteredCount} of {totalPhotos}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-500/20 rounded-2xl"
        >
          <span className="text-sm text-foreground font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Active filters:
          </span>
          
          {searchTerm && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-full shadow-lg"
            >
              <Search className="w-3 h-3" />
              &quot;{searchTerm}&quot;
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSearchChange('')}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.span>
          )}
          
          {selectedCollection !== 'all' && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-full shadow-lg"
            >
              <Grid className="w-3 h-3" />
              {collections.find(c => c.slug.current === selectedCollection)?.title}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onCollectionChange('all')}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.span>
          )}
          
          {sortBy !== 'newest' && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-full shadow-lg"
            >
              Sort: {sortBy === 'oldest' ? 'Oldest First' : 'Title A-Z'}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSortChange('newest')}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </motion.button>
            </motion.span>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearFilters}
            className="text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 font-medium ml-2 px-3 py-1 rounded-full transition-all duration-200"
          >
            Clear all
          </motion.button>
        </motion.div>
      )}

      {/* Quick Collection Pills */}
      {selectedCollection === 'all' && collections.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 px-6 py-4 bg-gradient-to-r from-card to-secondary border border-border rounded-2xl"
        >
          <span className="text-sm text-foreground font-semibold flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Quick access:
          </span>
          {collections.slice(0, 6).map((collection, index) => (
            <motion.button
              key={collection._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCollectionChange(collection.slug.current)}
              className="px-4 py-2 bg-card text-foreground text-sm border border-border rounded-full hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {collection.title}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
}