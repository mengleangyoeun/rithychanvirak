'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Photo, Collection } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CloudinaryUpload } from '@/components/cloudinary-upload'
import { CloudinaryBulkUpload } from '@/components/cloudinary-bulk-upload'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Plus, Pencil, ImageIcon, Search, X, Eye, ExternalLink,
  Calendar, MapPin, Camera,
  Check, Trash2, FolderPlus, ArrowUpDown, RefreshCw, Layers,
  Grid3X3, LayoutGrid, List, SlidersHorizontal, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { getThumbnailUrl } from '@/lib/cloudinary'
import { revalidatePublicPaths } from '@/lib/revalidate-client'

interface UploadedImage {
  image_id: string
  image_url: string
  image_width: number
  image_height: number
  preview: string
  name: string
  camera?: string
  lens?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: string
    focalLength?: string
  }
  location?: string
  date_taken?: string
}

type ViewMode = 'grid' | 'masonry' | 'compact' | 'list'
type ExifFilter = 'all' | 'with-exif' | 'no-exif' | 'with-location'
type SortOption = 'newest' | 'oldest' | 'date-taken-desc' | 'date-taken-asc' | 'title'

export default function PhotosManagementPage() {
  const supabase = createClient()

  // Primary Data
  const [photos, setPhotos] = useState<Photo[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [photoCollectionMap, setPhotoCollectionMap] = useState<Map<string, { id: string; title: string }[]>>(new Map())
  const [loading, setLoading] = useState(true)

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all')
  const [exifFilter, setExifFilter] = useState<ExifFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [visibleCount, setVisibleCount] = useState(24)

  // Selection state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignAlbumModal, setShowAssignAlbumModal] = useState(false)
  const [targetAlbumId, setTargetAlbumId] = useState<string>('')
  const [bulkUploadTargetAlbum, setBulkUploadTargetAlbum] = useState<string>('none')
  const [inspectingPhoto, setInspectingPhoto] = useState<Photo | null>(null)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [deleteTargetPhoto, setDeleteTargetPhoto] = useState<Photo | null>(null)
  const [batchDeleteProgress, setBatchDeleteProgress] = useState<{ current: number; total: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Single Edit Form State
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
    date_taken: ''
  })

  // Load All Photos, Collections, and Links
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Fetch Collections
      const { data: colData } = await supabase
        .from('collections')
        .select('*')
        .order('title', { ascending: true })

      if (colData) setCollections(colData)

      // 2. Fetch ALL photos in batches to bypass PostgREST 1,000-row limit
      const allPhotosList: Photo[] = []
      let photoFrom = 0
      const PHOTO_PAGE_SIZE = 1000
      let hasMorePhotos = true

      while (hasMorePhotos) {
        const { data: photoBatch, error: photosError } = await supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false })
          .range(photoFrom, photoFrom + PHOTO_PAGE_SIZE - 1)

        if (photosError) throw photosError

        if (photoBatch && photoBatch.length > 0) {
          allPhotosList.push(...photoBatch)
          if (photoBatch.length < PHOTO_PAGE_SIZE) {
            hasMorePhotos = false
          } else {
            photoFrom += PHOTO_PAGE_SIZE
          }
        } else {
          hasMorePhotos = false
        }
      }

      setPhotos(allPhotosList)

      // 3. Fetch collection_photos in batches to build photo -> albums mapping
      const linksMap = new Map<string, { id: string; title: string }[]>()
      let from = 0
      const PAGE_SIZE = 1000
      let hasMore = true

      const colTitleMap = new Map<string, string>()
      for (const c of colData || []) {
        colTitleMap.set(c.id, c.title)
      }

      while (hasMore) {
        const { data: linkBatch, error: linkErr } = await supabase
          .from('collection_photos')
          .select('collection_id, photo_id')
          .range(from, from + PAGE_SIZE - 1)

        if (linkErr) {
          console.error('Error fetching collection_photos links:', linkErr)
          break
        }

        if (linkBatch && linkBatch.length > 0) {
          for (const link of linkBatch) {
            if (!link.photo_id || !link.collection_id) continue
            const list = linksMap.get(link.photo_id) || []
            const title = colTitleMap.get(link.collection_id) || 'Album'
            list.push({ id: link.collection_id, title })
            linksMap.set(link.photo_id, list)
          }

          if (linkBatch.length < PAGE_SIZE) {
            hasMore = false
          } else {
            from += PAGE_SIZE
          }
        } else {
          hasMore = false
        }
      }

      setPhotoCollectionMap(linksMap)
    } catch (err) {
      console.error('Failed to load photos library:', err)
      toast.error('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Filter and Sort Logic
  const filteredAndSortedPhotos = useMemo(() => {
    let result = [...photos]

    // 1. Search Query Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.alt?.toLowerCase().includes(q) ||
        p.caption?.toLowerCase().includes(q) ||
        p.camera?.toLowerCase().includes(q) ||
        p.lens?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      )
    }

    // 2. Album Filter
    if (selectedAlbumFilter === 'unassigned') {
      result = result.filter(p => {
        const albums = photoCollectionMap.get(p.id)
        return !albums || albums.length === 0
      })
    } else if (selectedAlbumFilter !== 'all') {
      result = result.filter(p => {
        const albums = photoCollectionMap.get(p.id)
        return albums && albums.some(a => a.id === selectedAlbumFilter)
      })
    }

    // 3. EXIF & Metadata Filter
    if (exifFilter === 'with-exif') {
      result = result.filter(p => p.camera || p.lens || Object.keys(p.settings || {}).length > 0)
    } else if (exifFilter === 'no-exif') {
      result = result.filter(p => !p.camera && !p.lens && Object.keys(p.settings || {}).length === 0)
    } else if (exifFilter === 'with-location') {
      result = result.filter(p => Boolean(p.location && p.location.trim() !== ''))
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (sortBy === 'date-taken-desc') {
        return new Date(b.date_taken || 0).getTime() - new Date(a.date_taken || 0).getTime()
      }
      if (sortBy === 'date-taken-asc') {
        return new Date(a.date_taken || 0).getTime() - new Date(b.date_taken || 0).getTime()
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return result
  }, [photos, searchTerm, selectedAlbumFilter, exifFilter, sortBy, photoCollectionMap])

  // Stats Telemetry
  const stats = useMemo(() => {
    const total = photos.length
    const withExif = photos.filter(p => p.camera || p.lens || Object.keys(p.settings || {}).length > 0).length
    const withLocation = photos.filter(p => Boolean(p.location && p.location.trim() !== '')).length
    const unassigned = photos.filter(p => {
      const albums = photoCollectionMap.get(p.id)
      return !albums || albums.length === 0
    }).length

    return { total, withExif, withLocation, unassigned }
  }, [photos, photoCollectionMap])

  // Selection Handlers
  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedPhotoIds.size === filteredAndSortedPhotos.length) {
      setSelectedPhotoIds(new Set())
    } else {
      setSelectedPhotoIds(new Set(filteredAndSortedPhotos.map(p => p.id)))
    }
  }

  const clearSelection = () => {
    setSelectedPhotoIds(new Set())
  }

  // Edit Single Photo Setup
  const openEditModal = (photo: Photo) => {
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
      date_taken: photo.date_taken ? new Date(photo.date_taken).toISOString().split('T')[0] : ''
    })
    setShowEditModal(true)
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
      date_taken: ''
    })
    setEditingPhoto(null)
    setShowEditModal(false)
  }

  // Submit Single Photo Create / Update
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.image_url) {
      toast.error('Title and Photo image are required')
      return
    }

    try {
      setActionLoading(true)
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

        if (error) throw error

        toast.success(`Photo "${formData.title}" updated successfully`)
      } else {
        const { error } = await supabase
          .from('photos')
          .insert([photoData])

        if (error) throw error

        toast.success(`Photo "${formData.title}" added to library`)
      }

      await revalidatePublicPaths(['/', '/gallery'])
      await fetchAllData()
      resetForm()
    } catch (error) {
      console.error('Error saving photo:', error)
      toast.error('Failed to save photo')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Bulk Upload Finish
  const handleBulkUploadComplete = async (uploadedImages: UploadedImage[]) => {
    try {
      setActionLoading(true)

      const photosToInsert = uploadedImages.map((img, index) => ({
        title: img.name || `Photo ${Date.now() + index}`,
        image_url: img.image_url,
        image_id: img.image_id,
        image_width: img.image_width,
        image_height: img.image_height,
        alt: img.name,
        camera: img.camera,
        lens: img.lens,
        settings: img.settings,
        location: img.location,
        date_taken: img.date_taken,
        order: photos.length + index
      }))

      const { data: insertedPhotos, error: photoError } = await supabase
        .from('photos')
        .insert(photosToInsert)
        .select()

      if (photoError) throw photoError

      // If user selected a target album during bulk upload, link them
      if (bulkUploadTargetAlbum && bulkUploadTargetAlbum !== 'none' && insertedPhotos) {
        const collectionLinks = insertedPhotos.map((p, idx) => ({
          collection_id: bulkUploadTargetAlbum,
          photo_id: p.id,
          order: idx
        }))

        await supabase.from('collection_photos').insert(collectionLinks)
      }

      toast.success(`${uploadedImages.length} photos uploaded to library`)
      await revalidatePublicPaths(['/', '/gallery'])
      await fetchAllData()
      setShowUploadModal(false)
    } catch (err) {
      console.error('Error during bulk upload:', err)
      toast.error('Failed to process uploaded photos')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Single Photo
  const confirmDeleteSinglePhoto = async () => {
    if (!deleteTargetPhoto) return

    try {
      setActionLoading(true)

      if (deleteTargetPhoto.image_id) {
        const cloudinaryResponse = await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicIds: [deleteTargetPhoto.image_id] }),
        })

        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to delete image from Cloudinary')
        }
      }

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', deleteTargetPhoto.id)

      if (error) throw error

      toast.success(`Photo "${deleteTargetPhoto.title}" permanently deleted`)
      if (selectedPhotoIds.has(deleteTargetPhoto.id)) {
        setSelectedPhotoIds(prev => {
          const next = new Set(prev)
          next.delete(deleteTargetPhoto.id)
          return next
        })
      }

      if (inspectingPhoto?.id === deleteTargetPhoto.id) {
        setInspectingPhoto(null)
      }

      await revalidatePublicPaths(['/', '/gallery'])
      await fetchAllData()
    } catch (error) {
      console.error('Permanent photo delete error:', error)
      toast.error('Failed to permanently delete photo')
    } finally {
      setActionLoading(false)
      setDeleteTargetPhoto(null)
    }
  }

  // Batch Delete Selected Photos
  const handleBatchDelete = async () => {
    if (selectedPhotoIds.size === 0) return

    const selectedPhotosList = photos.filter(p => selectedPhotoIds.has(p.id))
    if (selectedPhotosList.length === 0) return

    try {
      setActionLoading(true)
      setBatchDeleteProgress({ current: 0, total: selectedPhotosList.length })

      const CHUNK_SIZE = 25
      for (let start = 0; start < selectedPhotosList.length; start += CHUNK_SIZE) {
        const chunk = selectedPhotosList.slice(start, start + CHUNK_SIZE)
        const publicIds = chunk.map(p => p.image_id).filter(Boolean)

        if (publicIds.length > 0) {
          const cloudinaryResponse = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds }),
          })

          if (!cloudinaryResponse.ok) {
            console.warn('One or more Cloudinary items could not be deleted')
          }
        }

        const ids = chunk.map(p => p.id)
        const { error } = await supabase
          .from('photos')
          .delete()
          .in('id', ids)

        if (error) throw error

        setBatchDeleteProgress({
          current: Math.min(start + chunk.length, selectedPhotosList.length),
          total: selectedPhotosList.length
        })
      }

      toast.success(`${selectedPhotosList.length} photos permanently deleted`)
      setSelectedPhotoIds(new Set())
      await revalidatePublicPaths(['/', '/gallery'])
      await fetchAllData()
    } catch (err) {
      console.error('Batch delete error:', err)
      toast.error('Failed to delete some photos')
    } finally {
      setActionLoading(false)
      setBatchDeleteProgress(null)
    }
  }

  // Batch Assign Selected Photos to an Album
  const handleAssignToAlbum = async () => {
    if (!targetAlbumId || selectedPhotoIds.size === 0) return

    try {
      setActionLoading(true)
      const targetCol = collections.find(c => c.id === targetAlbumId)
      const selectedIds = Array.from(selectedPhotoIds)

      // Fetch existing links to prevent duplicates
      const { data: existingLinks } = await supabase
        .from('collection_photos')
        .select('photo_id')
        .eq('collection_id', targetAlbumId)

      const existingPhotoIds = new Set((existingLinks || []).map(l => l.photo_id))
      const newLinks = selectedIds
        .filter(photoId => !existingPhotoIds.has(photoId))
        .map((photoId, idx) => ({
          collection_id: targetAlbumId,
          photo_id: photoId,
          order: existingPhotoIds.size + idx
        }))

      if (newLinks.length > 0) {
        const { error } = await supabase.from('collection_photos').insert(newLinks)
        if (error) throw error
        toast.success(`Assigned ${newLinks.length} photos to "${targetCol?.title || 'Album'}"`)
      } else {
        toast.info('All selected photos are already in this album')
      }

      setShowAssignAlbumModal(false)
      setTargetAlbumId('')
      clearSelection()
      await revalidatePublicPaths(['/', '/gallery', `/collection/${targetCol?.slug}`])
      await fetchAllData()
    } catch (err) {
      console.error('Failed to assign photos to album:', err)
      toast.error('Failed to assign photos to album')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Photos Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {photos.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Central repository of all high-resolution portfolio photographs and camera telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={loading}
            className="rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white h-9 px-3 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowUploadModal(true)}
            size="sm"
            className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold h-9 px-4 text-xs sm:text-sm shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Photos */}
        <button
          type="button"
          onClick={() => {
            setSelectedAlbumFilter('all')
            setExifFilter('all')
            setSearchTerm('')
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
            selectedAlbumFilter === 'all' && exifFilter === 'all' && !searchTerm
              ? 'bg-zinc-900 border-white/40 ring-1 ring-white/20'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Media</span>
            <ImageIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.total}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Global photographic assets</p>
        </button>

        {/* With EXIF */}
        <button
          type="button"
          onClick={() => setExifFilter(exifFilter === 'with-exif' ? 'all' : 'with-exif')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
            exifFilter === 'with-exif'
              ? 'bg-zinc-900 border-amber-500/50 ring-1 ring-amber-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">With EXIF</span>
            <Camera className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.withExif}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Telemetry & camera body tagged</p>
        </button>

        {/* Location Tagged */}
        <button
          type="button"
          onClick={() => setExifFilter(exifFilter === 'with-location' ? 'all' : 'with-location')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
            exifFilter === 'with-location'
              ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Geo-Tagged</span>
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.withLocation}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Location metadata recorded</p>
        </button>

        {/* Unassigned */}
        <button
          type="button"
          onClick={() => setSelectedAlbumFilter(selectedAlbumFilter === 'unassigned' ? 'all' : 'unassigned')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
            selectedAlbumFilter === 'unassigned'
              ? 'bg-zinc-900 border-purple-500/50 ring-1 ring-purple-500/30'
              : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unassigned</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.unassigned}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Photos not linked to an album</p>
        </button>
      </div>

      {/* Search, Filter & View Mode Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3.5 sm:p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by title, camera, lens, location, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-9 h-10 text-xs sm:text-sm rounded-xl border-zinc-800 bg-zinc-900/90 text-white placeholder:text-zinc-500 focus:border-zinc-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Album Selector */}
            <Select value={selectedAlbumFilter} onValueChange={setSelectedAlbumFilter}>
              <SelectTrigger className="w-[160px] sm:w-[180px] h-10 text-xs sm:text-sm rounded-xl border-zinc-800 bg-zinc-900/90 text-zinc-200">
                <SelectValue placeholder="All Albums" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-white max-h-60">
                <SelectItem value="all">All Albums ({photos.length})</SelectItem>
                <SelectItem value="unassigned">Unassigned Only ({stats.unassigned})</SelectItem>
                <SelectSeparator className="bg-zinc-800" />
                {collections.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* EXIF Filter */}
            <Select value={exifFilter} onValueChange={(val) => setExifFilter(val as ExifFilter)}>
              <SelectTrigger className="w-[130px] sm:w-[140px] h-10 text-xs sm:text-sm rounded-xl border-zinc-800 bg-zinc-900/90 text-zinc-200">
                <SelectValue placeholder="Metadata" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
                <SelectItem value="all">All Meta</SelectItem>
                <SelectItem value="with-exif">Has EXIF</SelectItem>
                <SelectItem value="no-exif">Missing EXIF</SelectItem>
                <SelectItem value="with-location">Has Location</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-[140px] sm:w-[160px] h-10 text-xs sm:text-sm rounded-xl border-zinc-800 bg-zinc-900/90 text-zinc-200">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
                <SelectItem value="newest">Newest Uploaded</SelectItem>
                <SelectItem value="oldest">Oldest Uploaded</SelectItem>
                <SelectItem value="date-taken-desc">Date Taken (Newest)</SelectItem>
                <SelectItem value="date-taken-asc">Date Taken (Oldest)</SelectItem>
                <SelectItem value="title">Title (A - Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-9 w-9 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-transparent'}`}
                title="Fixed Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('compact')}
                className={`h-9 w-9 p-0 rounded-lg ${viewMode === 'compact' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-transparent'}`}
                title="Compact Square Tiles"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-9 w-9 p-0 rounded-lg ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-transparent'}`}
                title="Detailed List"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Pill Row */}
        {(searchTerm || selectedAlbumFilter !== 'all' || exifFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-800/60">
            <span className="text-xs text-zinc-500">Active filters:</span>
            {searchTerm && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
                Search: &ldquo;{searchTerm}&rdquo;
                <button type="button" onClick={() => setSearchTerm('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAlbumFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
                Album: {selectedAlbumFilter === 'unassigned' ? 'Unassigned' : collections.find(c => c.id === selectedAlbumFilter)?.title || 'Selected'}
                <button type="button" onClick={() => setSelectedAlbumFilter('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {exifFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 flex items-center gap-1.5">
                Meta: {exifFilter}
                <button type="button" onClick={() => setExifFilter('all')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedAlbumFilter('all')
                setExifFilter('all')
              }}
              className="h-7 text-xs text-zinc-400 hover:text-white px-2 rounded-lg"
            >
              Reset all
            </Button>
          </div>
        )}
      </div>

      {/* Multi-Select Floating Toolbar */}
      {selectedPhotoIds.size > 0 && (
        <div className="sticky top-4 z-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shadow-md">
              {selectedPhotoIds.size}
            </span>
            <span className="text-sm font-semibold text-white">
              {selectedPhotoIds.size === 1 ? 'Photo' : 'Photos'} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="text-xs text-zinc-400 hover:text-white h-7 px-2"
            >
              {selectedPhotoIds.size === filteredAndSortedPhotos.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button
              onClick={() => setShowAssignAlbumModal(true)}
              size="sm"
              className="rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 text-xs font-semibold h-8 px-3.5 border border-zinc-700"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
              Assign to Album
            </Button>

            <Button
              onClick={handleBatchDelete}
              size="sm"
              variant="destructive"
              disabled={actionLoading}
              className="rounded-xl text-xs font-semibold h-8 px-3.5 shadow-md"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              {batchDeleteProgress
                ? `Deleting ${batchDeleteProgress.current}/${batchDeleteProgress.total}`
                : `Delete Permanently (${selectedPhotoIds.size})`}
            </Button>

            <Button
              onClick={clearSelection}
              variant="ghost"
              size="sm"
              className="rounded-xl text-zinc-400 hover:text-white h-8 px-2 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 15 }).map((_, idx) => (
            <div key={`photo-skel-${idx}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
              <div className="aspect-[4/5] bg-zinc-800/60" />
              <div className="p-3 space-y-2 bg-zinc-950/80">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedPhotos.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {searchTerm || selectedAlbumFilter !== 'all' || exifFilter !== 'all'
              ? 'No photos match your filters'
              : 'No photos uploaded yet'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-6">
            {searchTerm || selectedAlbumFilter !== 'all' || exifFilter !== 'all'
              ? 'Try resetting the search query or changing your album / metadata filters.'
              : 'Start by uploading your high-resolution portfolio photography.'}
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload First Photo
          </Button>
        </div>
      ) : (
        <>
          {/* Grid / Compact / List Renderings */}
          {viewMode === 'list' ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/60 overflow-hidden shadow-lg">
              {filteredAndSortedPhotos.slice(0, visibleCount).map(photo => {
                const isSelected = selectedPhotoIds.has(photo.id)
                const albums = photoCollectionMap.get(photo.id) || []

                return (
                  <div
                    key={photo.id}
                    className={`flex items-center gap-3.5 p-3 sm:p-4 hover:bg-zinc-900/60 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-zinc-900/90' : ''
                    }`}
                    onClick={() => setInspectingPhoto(photo)}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelectPhoto(photo.id)
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-white border-white text-black'
                          : 'border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-500'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </button>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative shrink-0">
                      <Image
                        src={photo.image_id ? getThumbnailUrl(photo.image_id, 300) : photo.image_url}
                        alt={photo.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                          {photo.title}
                        </p>
                        {photo.image_width && photo.image_height && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {photo.image_width}×{photo.image_height}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                        {photo.camera && (
                          <span className="flex items-center gap-1">
                            <Camera className="w-3 h-3 text-zinc-500" /> {photo.camera}
                          </span>
                        )}
                        {photo.lens && (
                          <span className="hidden md:inline text-zinc-500">• {photo.lens}</span>
                        )}
                        {photo.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-500" /> {photo.location}
                          </span>
                        )}
                        {photo.date_taken && (
                          <span className="hidden sm:flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            {new Date(photo.date_taken).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Album Tags */}
                    <div className="hidden lg:flex items-center gap-1.5 max-w-[200px] overflow-hidden">
                      {albums.length > 0 ? (
                        albums.slice(0, 2).map(a => (
                          <span key={a.id} className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 truncate">
                            {a.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-600 italic">Unassigned</span>
                      )}
                      {albums.length > 2 && (
                        <span className="text-[10px] text-zinc-500">+{albums.length - 2}</span>
                      )}
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(photo)}
                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Edit Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTargetPhoto(photo)}
                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={
              viewMode === 'compact'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5'
            }>
              {filteredAndSortedPhotos.slice(0, visibleCount).map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.id)
                const albums = photoCollectionMap.get(photo.id) || []

                // Aspect ratio calculation
                const aspectRatio = photo.image_width && photo.image_height
                  ? photo.image_width / photo.image_height
                  : 4/5
                const boundedAspectRatio = Math.min(1.4, Math.max(0.75, aspectRatio))

                return (
                  <div
                    key={photo.id}
                    className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden select-none cursor-pointer flex flex-col ${
                      isSelected
                        ? 'bg-zinc-900 border-white/60 shadow-lg ring-1 ring-white/40'
                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 shadow-sm hover:shadow-xl'
                    }`}
                    onClick={() => setInspectingPhoto(photo)}
                  >
                    {/* Media Image Area */}
                    <div
                      className="relative overflow-hidden bg-zinc-950"
                      style={{
                        aspectRatio: viewMode === 'compact' ? '1/1' : `${boundedAspectRatio}`
                      }}
                    >
                      <Image
                        src={photo.image_id ? getThumbnailUrl(photo.image_id, 600) : photo.image_url}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Badges & Checkbox */}
                      <div className="absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectPhoto(photo.id)
                          }}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-white border-white text-black shadow-md'
                              : 'border-white/40 bg-black/50 text-transparent hover:border-white hover:bg-black/70 backdrop-blur-md opacity-80 group-hover:opacity-100'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        </button>

                        {/* EXIF / Resolution Badge */}
                        <div className="flex items-center gap-1.5">
                          {photo.camera && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-md flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5 text-amber-400" />
                              <span className="truncate max-w-[80px]">{photo.camera.split(' ')[0]}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover Overlay with Action Buttons */}
                      <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-[2px]">
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setInspectingPhoto(photo)
                          }}
                          className="rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold h-8 px-3 shadow-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Inspect
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(photo)
                          }}
                          className="rounded-xl border-white/30 bg-black/60 text-white hover:bg-black hover:border-white text-xs h-8 w-8 shadow-lg"
                          title="Edit Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTargetPhoto(photo)
                          }}
                          className="rounded-xl border-white/30 bg-black/60 text-white hover:bg-red-600 hover:border-red-500 text-xs h-8 w-8 shadow-lg"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Info Section (if not compact) */}
                    {viewMode !== 'compact' && (
                      <div className="p-3.5 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-col justify-between flex-1">
                        <div>
                          <p className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-primary transition-colors text-left" title={photo.title}>
                            {photo.title}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                            {photo.camera && (
                              <span className="truncate max-w-[120px] text-zinc-400">{photo.camera}</span>
                            )}
                            {photo.location && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="truncate max-w-[100px] text-zinc-400">{photo.location}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Associated Album Tag */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-900 flex items-center justify-between gap-1">
                          {albums.length > 0 ? (
                            <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                              📁 {albums[0].title} {albums.length > 1 ? `(+${albums.length - 1})` : ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-600 italic">No album</span>
                          )}

                          {photo.date_taken && (
                            <span className="text-[10px] text-zinc-500 shrink-0">
                              {new Date(photo.date_taken).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Load More Button */}
          {visibleCount < filteredAndSortedPhotos.length && (
            <div className="flex flex-col items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(prev => prev + 24)}
                className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 px-6 h-10 font-semibold"
              >
                Load More Photos ({filteredAndSortedPhotos.length - visibleCount} remaining)
              </Button>
              <p className="text-xs text-zinc-500">
                Showing {Math.min(visibleCount, filteredAndSortedPhotos.length)} of {filteredAndSortedPhotos.length} photos
              </p>
            </div>
          )}
        </>
      )}

      {/* Upload Modal (Bulk & Single) */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <DialogHeader className="p-5 pb-4 border-b border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Plus className="w-5 h-5 text-zinc-400" />
              Upload Photos to Library
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
              Upload multiple high-resolution photos with automatic EXIF extraction, or configure an individual photo.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="bulk" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-3 border-b border-zinc-800">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl">
                <TabsTrigger value="bulk" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black">
                  Bulk Drag & Drop
                </TabsTrigger>
                <TabsTrigger value="single" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black">
                  Single Photo Details
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Bulk Tab */}
            <TabsContent value="bulk" className="flex-1 overflow-y-auto p-5 space-y-4 m-0">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-300">
                  Optional: Automatically assign uploaded photos to an album
                </Label>
                <Select value={bulkUploadTargetAlbum} onValueChange={setBulkUploadTargetAlbum}>
                  <SelectTrigger className="w-full h-10 rounded-xl border-zinc-800 bg-zinc-900/90 text-zinc-200">
                    <SelectValue placeholder="Do not assign to an album" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
                    <SelectItem value="none">None (Save to Global Library only)</SelectItem>
                    {collections.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <CloudinaryBulkUpload
                  onUploadComplete={handleBulkUploadComplete}
                  folder="rithychanvirak/misc"
                />
              </div>
            </TabsContent>

            {/* Single Photo Tab */}
            <TabsContent value="single" className="flex-1 overflow-y-auto p-5 m-0">
              <form onSubmit={handleSingleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-zinc-300">Photo Image *</Label>
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

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="upload-title" className="text-xs font-semibold text-zinc-300">Title *</Label>
                      <Input
                        id="upload-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Sunset over Angkor Wat"
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="upload-caption" className="text-xs font-semibold text-zinc-300">Caption</Label>
                      <Input
                        id="upload-caption"
                        value={formData.caption}
                        onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Brief summary or story"
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="upload-desc" className="text-xs font-semibold text-zinc-300">Description</Label>
                      <Textarea
                        id="upload-desc"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed technical or artistic notes"
                        rows={3}
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="rounded-xl border-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-5"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Add Photo
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Single Photo Details Dialog */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        if (!open) resetForm()
        setShowEditModal(open)
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <DialogHeader className="p-5 pb-4 border-b border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Pencil className="w-5 h-5 text-amber-400" />
              Edit Photo Details
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
              Update metadata, EXIF camera settings, and location information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl mb-4">
                <TabsTrigger value="basic" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black">
                  Basic Information
                </TabsTrigger>
                <TabsTrigger value="camera" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black">
                  Camera & EXIF
                </TabsTrigger>
                <TabsTrigger value="location" className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black">
                  Location & Date
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-zinc-300">Image Asset</Label>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                      {formData.image_url && (
                        <Image src={formData.image_url} alt={formData.title} fill className="object-cover" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-title" className="text-xs font-semibold text-zinc-300">Title *</Label>
                      <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-caption" className="text-xs font-semibold text-zinc-300">Caption</Label>
                      <Input
                        id="edit-caption"
                        value={formData.caption}
                        onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-alt" className="text-xs font-semibold text-zinc-300">Alt Text (Accessibility)</Label>
                      <Input
                        id="edit-alt"
                        value={formData.alt}
                        onChange={(e) => setFormData(prev => ({ ...prev, alt: e.target.value }))}
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="edit-description" className="text-xs font-semibold text-zinc-300">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Camera & EXIF Tab */}
              <TabsContent value="camera" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" /> Equipment
                    </h4>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-camera" className="text-xs font-semibold text-zinc-300">Camera Body</Label>
                      <Input
                        id="edit-camera"
                        value={formData.camera}
                        onChange={(e) => setFormData(prev => ({ ...prev, camera: e.target.value }))}
                        placeholder="e.g., Sony A7R V"
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-lens" className="text-xs font-semibold text-zinc-300">Lens</Label>
                      <Input
                        id="edit-lens"
                        value={formData.lens}
                        onChange={(e) => setFormData(prev => ({ ...prev, lens: e.target.value }))}
                        placeholder="e.g., FE 24-70mm F2.8 GM II"
                        className="rounded-xl border-zinc-800 bg-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" /> Exposure Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-aperture" className="text-xs font-semibold text-zinc-300">Aperture</Label>
                        <Input
                          id="edit-aperture"
                          value={formData.settings.aperture}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, aperture: e.target.value }
                          }))}
                          placeholder="e.g., f/2.8"
                          className="rounded-xl border-zinc-800 bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-shutter" className="text-xs font-semibold text-zinc-300">Shutter Speed</Label>
                        <Input
                          id="edit-shutter"
                          value={formData.settings.shutter}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, shutter: e.target.value }
                          }))}
                          placeholder="e.g., 1/500s"
                          className="rounded-xl border-zinc-800 bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-iso" className="text-xs font-semibold text-zinc-300">ISO</Label>
                        <Input
                          id="edit-iso"
                          value={formData.settings.iso}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, iso: e.target.value }
                          }))}
                          placeholder="e.g., 100"
                          className="rounded-xl border-zinc-800 bg-zinc-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-focal" className="text-xs font-semibold text-zinc-300">Focal Length</Label>
                        <Input
                          id="edit-focal"
                          value={formData.settings.focalLength}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, focalLength: e.target.value }
                          }))}
                          placeholder="e.g., 35mm"
                          className="rounded-xl border-zinc-800 bg-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Location & Date Tab */}
              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-location" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Location
                    </Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Siem Reap, Cambodia"
                      className="rounded-xl border-zinc-800 bg-zinc-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-date" className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Date Taken
                    </Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={formData.date_taken}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_taken: e.target.value }))}
                      className="rounded-xl border-zinc-800 bg-zinc-900"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="rounded-xl border-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* High-Resolution Photo Inspector Lightbox */}
      <Dialog open={!!inspectingPhoto} onOpenChange={(open) => !open && setInspectingPhoto(null)}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] p-0 flex flex-col md:flex-row overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          {inspectingPhoto && (
            <>
              {/* Photo Display Left */}
              <div className="flex-1 bg-black flex items-center justify-center p-4 relative min-h-[300px] md:min-h-[500px]">
                <div className="relative w-full h-full min-h-[280px] md:min-h-[450px]">
                  <Image
                    src={inspectingPhoto.image_id ? getThumbnailUrl(inspectingPhoto.image_id, 1200) : inspectingPhoto.image_url}
                    alt={inspectingPhoto.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Telemetry Sidebar Right */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-zinc-950">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{inspectingPhoto.title}</h3>
                    {inspectingPhoto.caption && (
                      <p className="text-xs text-zinc-400 mt-1 italic">{inspectingPhoto.caption}</p>
                    )}
                  </div>

                  {/* Telemetry Grid */}
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Camera Telemetry</h4>
                    
                    {inspectingPhoto.camera && (
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-medium truncate">{inspectingPhoto.camera}</span>
                      </div>
                    )}

                    {inspectingPhoto.lens && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400 pl-6">
                        <span className="truncate">{inspectingPhoto.lens}</span>
                      </div>
                    )}

                    {inspectingPhoto.settings && Object.keys(inspectingPhoto.settings).length > 0 && (
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px]">
                        {inspectingPhoto.settings.aperture && (
                          <div>
                            <span className="text-zinc-500">Aperture: </span>
                            <span className="text-white font-mono font-semibold">{inspectingPhoto.settings.aperture}</span>
                          </div>
                        )}
                        {inspectingPhoto.settings.shutter && (
                          <div>
                            <span className="text-zinc-500">Shutter: </span>
                            <span className="text-white font-mono font-semibold">{inspectingPhoto.settings.shutter}</span>
                          </div>
                        )}
                        {inspectingPhoto.settings.iso && (
                          <div>
                            <span className="text-zinc-500">ISO: </span>
                            <span className="text-white font-mono font-semibold">{inspectingPhoto.settings.iso}</span>
                          </div>
                        )}
                        {inspectingPhoto.settings.focalLength && (
                          <div>
                            <span className="text-zinc-500">Focal: </span>
                            <span className="text-white font-mono font-semibold">{inspectingPhoto.settings.focalLength}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {inspectingPhoto.location && (
                      <div className="flex items-center gap-2 text-xs text-zinc-300 pt-1">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{inspectingPhoto.location}</span>
                      </div>
                    )}

                    {inspectingPhoto.date_taken && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{new Date(inspectingPhoto.date_taken).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}

                    {inspectingPhoto.image_width && inspectingPhoto.image_height && (
                      <div className="text-[11px] font-mono text-zinc-500">
                        Dimensions: {inspectingPhoto.image_width} × {inspectingPhoto.image_height} px
                      </div>
                    )}
                  </div>

                  {/* Associated Albums */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Albums</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(photoCollectionMap.get(inspectingPhoto.id) || []).length > 0 ? (
                        (photoCollectionMap.get(inspectingPhoto.id) || []).map(a => (
                          <span key={a.id} className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {a.title}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Not in any album</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inspector Actions */}
                <div className="space-y-2 pt-3 border-t border-zinc-800">
                  <Button
                    onClick={() => {
                      const p = inspectingPhoto
                      setInspectingPhoto(null)
                      openEditModal(p)
                    }}
                    className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold h-9 text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit Photo Details
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open(inspectingPhoto.image_url, '_blank')}
                    className="w-full rounded-xl border-zinc-800 hover:bg-zinc-900 text-zinc-300 h-9 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    Open Full High-Res
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Assign to Album Dialog */}
      <Dialog open={showAssignAlbumModal} onOpenChange={setShowAssignAlbumModal}>
        <DialogContent className="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-zinc-400" />
              Assign Photos to Album
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Link the {selectedPhotoIds.size} selected photos to a destination album.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-300">Select Target Album</Label>
              <Select value={targetAlbumId} onValueChange={setTargetAlbumId}>
                <SelectTrigger className="w-full h-10 rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200">
                  <SelectValue placeholder="Choose an album" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950 text-white max-h-60">
                  {collections.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAssignAlbumModal(false)}
              className="rounded-xl border-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssignToAlbum}
              disabled={!targetAlbumId || actionLoading}
              className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold"
            >
              {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Assign Photos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTargetPhoto}
        onOpenChange={(open) => !open && setDeleteTargetPhoto(null)}
        title="Delete Photo Permanently"
        description={`Are you sure you want to delete "${deleteTargetPhoto?.title}"? This photo will be removed from Cloudinary and unlinked from all albums. This action cannot be undone.`}
        confirmText="Delete Photo"
        variant="destructive"
        onConfirm={confirmDeleteSinglePhoto}
      />
    </div>
  )
}
