'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Photo } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { CloudinaryUpload } from '@/components/cloudinary-upload'
import { Plus, Pencil, ImageIcon, Search, X, Filter, Eye, ExternalLink, MoreVertical, Calendar, MapPin, Camera, Settings, Star, Info, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getThumbnailUrl } from '@/lib/cloudinary'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function PhotosManagementPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    image_id: '',
    image_width: 0,
    image_height: 0,
    alt: '',
    caption: '',
    description: '',
    camera: '',
    lens: '',
    settings: {
      aperture: '',
      shutter: '',
      iso: '',
      focalLength: ''
    },
    location: '',
    date_taken: '',
    featured: false
  })

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPhotos(data)
      setFilteredPhotos(data)
    }
    setLoading(false)
  }, [supabase])

  // Filter photos
  useEffect(() => {
    let filtered = [...photos]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(photo =>
        photo.title.toLowerCase().includes(searchLower) ||
        photo.description?.toLowerCase().includes(searchLower) ||
        photo.alt?.toLowerCase().includes(searchLower) ||
        photo.camera?.toLowerCase().includes(searchLower) ||
        photo.location?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredPhotos(filtered)
  }, [photos, searchTerm])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const photoData = {
      ...formData,
      settings: Object.fromEntries(
        Object.entries(formData.settings).filter(([, value]) => value !== '')
      ),
      date_taken: formData.date_taken ? new Date(formData.date_taken).toISOString() : null
    }

    if (editingPhoto) {
      const { error } = await supabase
        .from('photos')
        .update(photoData)
        .eq('id', editingPhoto.id)

      if (!error) {
        toast.success('Photo updated successfully')
        await fetchPhotos()
        resetForm()
      } else {
        toast.error('Failed to update photo')
      }
    } else {
      const { data, error } = await supabase
        .from('photos')
        .insert([photoData])
        .select()

      if (!error && data && data[0]) {
        toast.success('Photo created successfully')
        await fetchPhotos()
        resetForm()
      } else {
        toast.error('Failed to create photo')
      }
    }
  }

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo)
    setFormData({
      title: photo.title,
      image_url: photo.image_url,
      image_id: photo.image_id,
      image_width: photo.image_width || 0,
      image_height: photo.image_height || 0,
      alt: photo.alt || '',
      caption: photo.caption || '',
      description: photo.description || '',
      camera: photo.camera || '',
      lens: photo.lens || '',
      settings: {
        aperture: photo.settings?.aperture || '',
        shutter: photo.settings?.shutter || '',
        iso: photo.settings?.iso || '',
        focalLength: photo.settings?.focalLength || ''
      },
      location: photo.location || '',
      date_taken: photo.date_taken ? new Date(photo.date_taken).toISOString().split('T')[0] : '',
      featured: photo.featured || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)

      if (!error) {
        toast.success('Photo deleted successfully')
        await fetchPhotos()
      } else {
        toast.error('Failed to delete photo')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      image_id: '',
      image_width: 0,
      image_height: 0,
      alt: '',
      caption: '',
      description: '',
      camera: '',
      lens: '',
      settings: {
        aperture: '',
        shutter: '',
        iso: '',
        focalLength: ''
      },
      location: '',
      date_taken: '',
      featured: false
    })
    setEditingPhoto(null)
    setShowForm(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
  }

  const hasActiveFilters = searchTerm !== ''

  // Calculate stats
  const featuredCount = photos.filter(p => p.featured).length
  const withExifCount = photos.filter(p => p.camera || p.lens || Object.keys(p.settings || {}).length > 0).length
  const withLocationCount = photos.filter(p => p.location).length

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end - Note: Photos don't have order field yet, this is ready for when you add it
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((photo) => photo.id === active.id)
    const newIndex = photos.findIndex((photo) => photo.id === over.id)

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex)
    setPhotos(reorderedPhotos)

    // TODO: Add updatePhotoOrder function when order field is added to photos table
    toast.info('Drag-and-drop ready! Add "order" field to photos table to persist changes.')
  }

  // Sortable Photo Card Component
  function SortablePhotoCard({ photo }: { photo: Photo }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: photo.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    // Calculate aspect ratio from image dimensions, fallback to 4/5
    const aspectRatio = photo.image_width && photo.image_height
      ? photo.image_width / photo.image_height
      : 4/5

    return (
      <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
        <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
          {/* Drag Handle */}
          <div
            className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing touch-none"
            {...listeners}
            {...attributes}
          >
            <div className="bg-background/95 backdrop-blur-sm p-2 rounded-md shadow-lg border border-border hover:bg-accent hover:border-primary transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="relative bg-muted overflow-hidden" style={{ aspectRatio: aspectRatio.toString() }}>
            {photo.image_id ? (
              <Image
                src={getThumbnailUrl(photo.image_id, 600)}
                alt={photo.alt || photo.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Featured Badge */}
            {photo.featured && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-yellow-500 text-white border-0 shadow-lg">
                  <Star className="w-3 h-3 mr-1 fill-white" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Hover Overlay with Quick Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-white text-black hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(photo)
                  }}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(getThumbnailUrl(photo.image_id, 1200), '_blank')
                  }}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(photo)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(getThumbnailUrl(photo.image_id, 1200), '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Size
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(photo.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-base line-clamp-1">
              {photo.title}
            </h3>

            {/* Meta Info */}
            {(photo.camera || photo.location || photo.date_taken) && (
              <div className="space-y-1.5">
                {photo.camera && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Camera className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{photo.camera}</span>
                  </div>
                )}
                {photo.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{photo.location}</span>
                  </div>
                )}
                {photo.date_taken && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{new Date(photo.date_taken).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            {/* EXIF Badge */}
            {(photo.settings && Object.keys(photo.settings).length > 0) && (
              <Badge variant="secondary" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                EXIF Data
              </Badge>
            )}

            {/* Toggles Section */}
            <div className="space-y-2 pt-3 border-t">
              {/* Featured Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Featured</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                    {photo.featured ? 'Yes' : 'No'}
                  </span>
                  <Switch
                    checked={photo.featured || false}
                    onCheckedChange={async (checked) => {
                      try {
                        const { error } = await supabase
                          .from('photos')
                          .update({ featured: checked })
                          .eq('id', photo.id)

                        if (error) throw error
                        await fetchPhotos()
                        toast.success(`Photo ${checked ? 'marked as featured' : 'removed from featured'}`)
                      } catch (error) {
                        console.error('Error updating featured status:', error)
                        toast.error('Failed to update featured status')
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Photos</h1>
          <p className="text-muted-foreground mt-1">
            Manage your photo content • {filteredPhotos.length} of {photos.length} photos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Photo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photos.length}</div>
            <p className="text-xs text-muted-foreground">All uploaded photos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredCount}</div>
            <p className="text-xs text-muted-foreground">On homepage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With EXIF</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withExifCount}</div>
            <p className="text-xs text-muted-foreground">Camera metadata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withLocationCount}</div>
            <p className="text-xs text-muted-foreground">Location tagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search photos by title, description, camera, location..."
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
                  {/* No collection filter for photos - they belong to collections via junction table */}
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
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="pb-4 border-b px-6 pt-6">
            <DialogTitle className="text-xl flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {editingPhoto ? 'Edit Photo' : 'Add New Photo'}
            </DialogTitle>
            <DialogDescription>
              {editingPhoto ? 'Update the photo details and metadata below' : 'Fill in the details to add a new photo'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col px-6 pt-4">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="metadata" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pb-6">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Upload */}
                    <div className="space-y-4">
                      <Label>Photo Image *</Label>
                      <CloudinaryUpload
                        onUploadComplete={(data) => {
                          setFormData(prev => ({
                            ...prev,
                            image_url: data.image_url,
                            image_id: data.image_id,
                            image_width: data.image_width,
                            image_height: data.image_height
                          }))
                        }}
                        currentImageUrl={formData.image_url}
                        currentImageId={formData.image_id}
                        folder="rithychanvirak/misc"
                      />
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alt">Alt Text</Label>
                        <Input
                          id="alt"
                          value={formData.alt}
                          onChange={(e) => setFormData(prev => ({ ...prev, alt: e.target.value }))}
                          placeholder="Describe the image for accessibility"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caption">Caption</Label>
                        <Input
                          id="caption"
                          value={formData.caption}
                          onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                          placeholder="Short caption for the photo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          placeholder="Detailed description of the photo"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-6 mt-0">
                  {/* Camera & Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Camera Equipment
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="camera">Camera</Label>
                        <Input
                          id="camera"
                          value={formData.camera}
                          onChange={(e) => setFormData(prev => ({ ...prev, camera: e.target.value }))}
                          placeholder="e.g., Canon EOS R5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lens">Lens</Label>
                        <Input
                          id="lens"
                          value={formData.lens}
                          onChange={(e) => setFormData(prev => ({ ...prev, lens: e.target.value }))}
                          placeholder="e.g., 24-70mm f/2.8"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Camera Settings
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="aperture">Aperture</Label>
                          <Input
                            id="aperture"
                            value={formData.settings.aperture}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, aperture: e.target.value }
                            }))}
                            placeholder="e.g., f/2.8"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shutter">Shutter Speed</Label>
                          <Input
                            id="shutter"
                            value={formData.settings.shutter}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, shutter: e.target.value }
                            }))}
                            placeholder="e.g., 1/250"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="iso">ISO</Label>
                          <Input
                            id="iso"
                            value={formData.settings.iso}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, iso: e.target.value }
                            }))}
                            placeholder="e.g., 100"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="focalLength">Focal Length</Label>
                          <Input
                            id="focalLength"
                            value={formData.settings.focalLength}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: { ...prev.settings, focalLength: e.target.value }
                            }))}
                            placeholder="e.g., 50mm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Phnom Penh, Cambodia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_taken" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date Taken
                      </Label>
                      <Input
                        id="date_taken"
                        type="date"
                        value={formData.date_taken}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_taken: e.target.value }))}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Featured Photo
                      </CardTitle>
                      <CardDescription>
                        Control whether this photo appears on the homepage
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={formData.featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="featured" className="cursor-pointer font-medium">
                            Feature this photo on homepage
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Featured photos appear in the infinite scroll showcase on the homepage
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                {editingPhoto ? 'Update your photo information' : 'All fields except title and image are optional'}
              </p>
              <DialogFooter className="gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 sm:flex-none">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Cancel</span>
                </Button>
                <Button type="submit" className="flex-1 sm:flex-none sm:min-w-[120px]">
                  {editingPhoto ? (
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

      {/* Photos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-md">
              <div className="aspect-[4/5] bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first photo</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <SortablePhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
