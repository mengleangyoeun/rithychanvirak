'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Video as VideoType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Video, RefreshCw, Search, X, Filter, Play, Calendar, ExternalLink, MoreVertical } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'
import { toast } from 'sonner'
import { ReorderableStoryboard } from '@/components/reorderable-storyboard'

export default function VideosManagementPage() {
  const supabase = createClient()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterVideoType, setFilterVideoType] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    video_url: '',
    video_type: 'youtube' as 'youtube' | 'vimeo' | 'googledrive' | 'direct',
    thumbnail_url: '',
    description: '',
    category: '',
    year: new Date().getFullYear(),
    tags: '',
    featured: false,
  })
  const [storyboardImages, setStoryboardImages] = useState<Array<{
    id?: string
    image_id: string
    image_url: string
    name: string
  }>>([])

  // Get unique values for filter dropdowns
  const uniqueCategories = useMemo(() => {
    const categories = videos
      .map(v => v.category)
      .filter((category): category is string => Boolean(category))
    return [...new Set(categories)].sort()
  }, [videos])

  const uniqueYears = useMemo(() => {
    const years = videos
      .map(v => v.year)
      .filter((year): year is number => Boolean(year))
    return [...new Set(years)].sort((a, b) => b - a)
  }, [videos])

  // Filter and search videos
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        video.slug.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = filterCategory === 'all' || video.category === filterCategory

      // Video type filter
      const matchesVideoType = filterVideoType === 'all' || video.video_type === filterVideoType

      // Year filter
      const matchesYear = filterYear === 'all' || video.year?.toString() === filterYear

      return matchesSearch && matchesCategory && matchesVideoType && matchesYear
    })
  }, [videos, searchTerm, filterCategory, filterVideoType, filterYear])

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('all')
    setFilterVideoType('all')
    setFilterYear('all')
  }

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('order', { ascending: true })

    if (!error && data) {
      setVideos(data)
    }
    setLoading(false)
  }, [supabase])

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || filterCategory !== 'all' || filterVideoType !== 'all' || filterYear !== 'all'

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const videoData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      year: formData.year || null,
      thumbnail_url: formData.thumbnail_url || null,
      description: formData.description || null,
      category: formData.category || null,
    }

    if (editingVideo) {
      const { error } = await supabase
        .from('videos')
        .update(videoData)
        .eq('id', editingVideo.id)

      if (!error) {
        await saveStoryboardImages(editingVideo.id)
        toast.success('Video updated successfully')
        await fetchVideos()
        resetForm()
      } else {
        toast.error('Failed to update video')
      }
    } else {
      const { data, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select()

      if (!error && data && data[0]) {
        await saveStoryboardImages(data[0].id)
        toast.success('Video created successfully')
        await fetchVideos()
        resetForm()
      } else {
        toast.error('Failed to create video')
      }
    }
  }

  const saveStoryboardImages = async (videoId: string) => {
    if (storyboardImages.length === 0) return

    // Delete existing storyboard images if editing
    if (editingVideo) {
      await supabase
        .from('video_storyboard')
        .delete()
        .eq('video_id', videoId)
    }

    // Insert new storyboard images
    const storyboardData = storyboardImages.map((img, index) => ({
      video_id: videoId,
      image_url: img.image_url,
      alt: img.name,
      order: index,
    }))

    const { error } = await supabase
      .from('video_storyboard')
      .insert(storyboardData)

    if (error) {
      console.error('Error saving storyboard images:', error)
      toast.error('Failed to save storyboard images')
    }
  }

  const handleEdit = async (video: VideoType) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      slug: video.slug,
      video_url: video.video_url,
      video_type: video.video_type,
      thumbnail_url: video.thumbnail_url || '',
      description: video.description || '',
      category: video.category || '',
      year: video.year || new Date().getFullYear(),
      tags: video.tags?.join(', ') || '',
      featured: video.featured || false,
    })

    // Fetch existing storyboard images
    const { data: storyboard } = await supabase
      .from('video_storyboard')
      .select('*')
      .eq('video_id', video.id)
      .order('order', { ascending: true })

    if (storyboard && storyboard.length > 0) {
      setStoryboardImages(storyboard.map(img => ({
        id: img.id,
        image_id: img.image_url.includes('cloudinary')
          ? (() => {
              const urlParts = img.image_url.split('/upload/')
              if (urlParts.length > 1) {
                const afterUpload = urlParts[1]
                // Remove version prefix if present (v123/) and file extension
                const withoutVersion = afterUpload.replace(/^v\d+\//, '')
                return withoutVersion.split('.').slice(0, -1).join('.')
              }
              return ''
            })()
          : '',
        image_url: img.image_url,
        name: img.alt || 'Storyboard Image',
      })))
    }

    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)

      if (!error) {
        toast.success('Video deleted successfully')
        await fetchVideos()
      } else {
        toast.error('Failed to delete video')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      video_url: '',
      video_type: 'youtube',
      thumbnail_url: '',
      description: '',
      category: '',
      year: new Date().getFullYear(),
      tags: '',
      featured: false,
    })
    setStoryboardImages([])
    setEditingVideo(null)
    setShowForm(false)
  }

  const getVideoThumbnail = (video: VideoType) => {
    if (video.thumbnail_url) return video.thumbnail_url

    if (video.video_type === 'youtube') {
      // Extract video ID from various YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
        /(?:youtu\.be\/)([^?\s]+)/,
        /(?:youtube\.com\/embed\/)([^?\s]+)/,
        /(?:youtube\.com\/v\/)([^?\s]+)/,
      ]

      for (const pattern of patterns) {
        const match = video.video_url.match(pattern)
        if (match && match[1]) {
          // Use hqdefault.jpg which is more reliable than maxresdefault.jpg
          return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
        }
      }
    }

    if (video.video_type === 'vimeo') {
      // For Vimeo, we'd need to fetch thumbnail via API, show placeholder for now
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%2300adef"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="white"%3EVimeo Video%3C/text%3E%3C/svg%3E'
    }

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%239ca3af"%3ENo Thumbnail%3C/text%3E%3C/svg%3E'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground mt-1">
            Manage your video content • {filteredVideos.length} of {videos.length} videos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search videos by title, description, category, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Category Filter */}
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Video Type Filter */}
                  <Select value={filterVideoType} onValueChange={setFilterVideoType}>
                    <SelectTrigger className="w-auto min-w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                      <SelectItem value="googledrive">Google Drive</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Year Filter */}
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-auto min-w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {uniqueYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground self-center">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: &ldquo;{searchTerm}&rdquo;
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filterCategory !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {filterCategory}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => setFilterCategory('all')}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filterVideoType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {filterVideoType}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => setFilterVideoType('all')}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
                {filterYear !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Year: {filterYear}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => setFilterYear('all')}
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) resetForm()
        setShowForm(open)
      }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="pb-4 border-b px-6 pt-6">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {editingVideo ? <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              </div>
              {editingVideo ? 'Edit Video' : 'Add New Video'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {editingVideo ? 'Update the video details and metadata below' : 'Fill in the details to create a new video'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="space-y-4 sm:space-y-5 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') })}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFormData({ ...formData, slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') })}
                  title="Generate slug from title"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="video_url">Video URL *</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_type">Type</Label>
                <Select
                  value={formData.video_type}
                  onValueChange={(value: 'youtube' | 'vimeo' | 'googledrive' | 'direct') => setFormData({ ...formData, video_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="googledrive">Google Drive</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Custom Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured video on homepage
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Storyboard Images (optional)</Label>
              <ReorderableStoryboard
                images={storyboardImages}
                onChange={setStoryboardImages}
                maxImages={20}
              />
              <p className="text-xs text-muted-foreground">
                Upload behind-the-scenes photos or video stills • Drag to reorder
              </p>
            </div>

            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                {editingVideo ? 'Update your video information' : 'All fields except title, slug, and video URL are optional'}
              </p>
              <DialogFooter className="gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 sm:flex-none">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Cancel</span>
                </Button>
                <Button type="submit" className="flex-1 sm:flex-none sm:min-w-[120px]">
                  {editingVideo ? (
                    <>
                      <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Update</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Create</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first video</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Video
            </Button>
          </CardContent>
        </Card>
      ) : filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div
                className="relative aspect-video bg-muted cursor-pointer"
                onClick={() => window.open(video.video_url, '_blank')}
              >
                <Image
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  fill
                  className="object-cover"
                />

                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-black ml-1" fill="black" />
                  </div>
                </div>

                {/* Platform badge */}
                <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
                  {video.video_type}
                </Badge>
              </div>

              {/* Content */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {video.year && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {video.year}
                    </span>
                  )}
                  {video.category && (
                    <Badge variant="secondary" className="text-xs">
                      {video.category}
                    </Badge>
                  )}
                  <Badge variant={video.is_active ? "default" : "secondary"} className="text-xs">
                    {video.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(video.video_url, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Watch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(video)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(video)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(video.video_url, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Original
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(video.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Delete Video
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {video.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('videos')
                            .update({ is_active: checked })
                            .eq('id', video.id)

                          if (error) throw error
                          await fetchVideos()
                          toast.success(`Video ${checked ? 'activated' : 'deactivated'}`)
                        } catch (error) {
                          console.error('Error updating video status:', error)
                          toast.error('Failed to update video status')
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
