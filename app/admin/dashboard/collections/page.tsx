'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Collection, Photo, CollectionPhoto } from '@/types/database'
import { getCollectionFolder } from '@/lib/cloudinary-folders'

interface CollectionPhotoWithPhoto extends CollectionPhoto {
  photos: Photo
}
import { CloudinaryBulkUpload } from '@/components/cloudinary-bulk-upload'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  Plus, Pencil, Folder, RefreshCw, Trash2, ArrowLeft, Loader2,
  Search, Grid3X3, List, Home, FileImage, Settings, Camera
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { getThumbnailUrl } from '@/lib/cloudinary'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ViewMode = 'grid' | 'list' | 'details'
type ItemType = 'folder' | 'file'

// Sortable Collection Item Component
function SortableCollectionItem({
  item,
  selectedItems,
  setSelectedItems,
  onEdit,
  onDelete,
  onRename,
  onShowProperties,
  onOpenFolder
}: {
  item: FileExplorerItem
  selectedItems: Set<string>
  setSelectedItems: (items: Set<string>) => void
  onEdit: (item: FileExplorerItem) => void
  onDelete: (itemId: string) => void
  onRename: (item: FileExplorerItem) => void
  onShowProperties: (item: FileExplorerItem) => void
  onOpenFolder: (folderId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          className={`group relative rounded-lg border cursor-pointer hover:shadow-lg transition-all duration-200 ${
            selectedItems.has(item.id) ? 'bg-accent border-primary shadow-md' : 'border-border hover:border-primary/50'
          } ${isDragging ? 'opacity-50' : ''}`}
          onClick={(e) => {
            // If checkbox was clicked, don't navigate
            if ((e.target as HTMLElement).closest('[data-checkbox]') || (e.target as HTMLElement).closest('[data-drag-handle]')) {
              e.stopPropagation()
              return
            }
            if (item.type === 'folder') {
              onOpenFolder(item.id)
            }
          }}
          onDoubleClick={() => {
            if (item.type === 'folder') {
              onOpenFolder(item.id)
            }
          }}
        >
          {/* Drag Handle */}
          <div
            data-drag-handle
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-black/20 rounded"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM3 8h14a1 1 0 010 2H3a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2z"/>
            </svg>
          </div>

          {/* Selection Checkbox */}
          <div
            data-checkbox
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation()
              const newSelected = new Set(selectedItems)
              if (newSelected.has(item.id)) {
                newSelected.delete(item.id)
              } else {
                newSelected.add(item.id)
              }
              setSelectedItems(newSelected)
            }}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selectedItems.has(item.id)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-white/50 bg-black/20 hover:border-white/70'
            }`}>
              {selectedItems.has(item.id) && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg bg-muted">
            {item.type === 'folder' ? (
              item.data && 'cover_image_url' in item.data && item.data.cover_image_url ? (
                <Image
                  src={item.data.cover_image_url}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <Folder className="w-24 h-24 text-blue-500" />
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <FileImage className="w-24 h-24 text-gray-500" />
              </div>
            )}
          </div>
          <div className="p-3 bg-background rounded-b-lg">
            <p className="text-sm font-medium text-center truncate" title={item.name}>
              {item.name}
            </p>
            {item.type === 'folder' && (
              <p className="text-xs text-muted-foreground text-center mt-1">
                Album
              </p>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(item)}>
          <Settings className="w-4 h-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRename(item)}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onShowProperties(item)}>
          <Settings className="w-4 h-4 mr-2" />
          Properties
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(item.id)}
          className="text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface FileExplorerItem {
  id: string
  name: string
  type: ItemType
  size?: number
  modified?: string
  thumbnail?: string
  data: Collection | Photo
}

export default function CollectionsPage() {
  const supabase = createClient()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = currentItems.findIndex((item) => item.id === active.id)
      const newIndex = currentItems.findIndex((item) => item.id === over.id)

      const reorderedItems = arrayMove(currentItems, oldIndex, newIndex)
      setCurrentItems(reorderedItems)

      // Update order in database
      updateCollectionOrder(reorderedItems)
    }
  }

  // Update collection order in database
  const updateCollectionOrder = async (items: FileExplorerItem[]) => {
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        order: index
      }))

      for (const update of updates) {
        await supabase
          .from('collections')
          .update({ order: update.order })
          .eq('id', update.id)
      }

      // Revalidate homepage to show new order immediately
      try {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/' })
        })
      } catch (revalidateError) {
        console.warn('Failed to revalidate homepage:', revalidateError)
        // Don't fail the whole operation if revalidation fails
      }

      toast.success('Collection order updated')
    } catch (error: unknown) {
      console.error('Error updating order:', error)
      toast.error('Failed to update collection order')
      // Revert the local state on error
      updateCurrentItems()
    }
  }

  // Core state
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [allCollections, setAllCollections] = useState<Collection[]>([])
  const [currentItems, setCurrentItems] = useState<FileExplorerItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Photo management state
  const [collectionPhotos, setCollectionPhotos] = useState<Photo[]>([])
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [showPhotoEdit, setShowPhotoEdit] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)

  // UI state
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showProperties, setShowProperties] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false)
  const [renamingItem, setRenamingItem] = useState<FileExplorerItem | null>(null)
  const [propertiesItem, setPropertiesItem] = useState<FileExplorerItem | null>(null)
  const [editingItem, setEditingItem] = useState<FileExplorerItem | null>(null)
  const [bulkMoveTarget, setBulkMoveTarget] = useState('')

  // Form state
  const [newFolderName, setNewFolderName] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    cover_image_url: '',
    parent_id: '',
    featured: false
  })
  const [availableImages, setAvailableImages] = useState<Photo[]>([])
  const [showImageSelector, setShowImageSelector] = useState(false)

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    loading: false,
    creating: false,
    renaming: false,
    deleting: false,
    uploading: false
  })

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Optimized data loading with error handling
  const loadInitialData = useCallback(async () => {
    try {
      setError(null)
      setLoadingStates(prev => ({ ...prev, loading: true }))

      // Parallel data loading
      const [collectionsResult, imagesResult] = await Promise.allSettled([
        supabase.from('collections').select('*').order('created_at', { ascending: false }),
        supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(50)
      ])

      // Handle collections
      if (collectionsResult.status === 'fulfilled') {
        setAllCollections(collectionsResult.value.data || [])
      } else {
        console.error('Error loading collections:', collectionsResult.reason)
        setError('Failed to load collections')
      }

      // Handle available images
      if (imagesResult.status === 'fulfilled') {
        setAvailableImages(imagesResult.value.data || [])
      } else {
        console.error('Error loading available images:', imagesResult.reason)
        // Don't set error for images as it's not critical
      }

    } catch (err) {
      console.error('Error in loadInitialData:', err)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoadingStates(prev => ({ ...prev, loading: false }))
    }
  }, [supabase])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Update current items when path or collections change
  useEffect(() => {
    updateCurrentItems()
    loadCollectionPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, allCollections, searchQuery])


  // Core functions
  const loadAllCollections = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, loading: true }))

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAllCollections(data || [])
    } catch (error: unknown) {
      console.error('Error loading collections:', error)
      toast.error('Failed to load collections')
    } finally {
      setLoadingStates(prev => ({ ...prev, loading: false }))
    }
  }

  const updateCurrentItems = useCallback(() => {
    const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

    // Get subfolders
    const subfolders = allCollections
      .filter(collection => collection.parent_id === currentFolderId)
      .map(collection => ({
        id: collection.id,
        name: collection.title,
        type: 'folder' as ItemType,
        modified: new Date(collection.created_at).toLocaleDateString(),
        data: collection
      }))

    // Get photos in current folder (if it's a collection)
    const photos: FileExplorerItem[] = []
    if (currentFolderId) {
      // This would need to be implemented to fetch photos for the current collection
      // For now, we'll leave it empty
    }

    // Combine and filter by search
    let allItems = [...subfolders, ...photos]

    if (searchQuery) {
      allItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setCurrentItems(allItems)
  }, [currentPath, allCollections, searchQuery])

  const loadCollectionPhotos = useCallback(async () => {
    const currentCollectionId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

    if (!currentCollectionId) {
      setCollectionPhotos([])
      return
    }

    try {
      // Get photos associated with this collection
      const { data, error } = await supabase
        .from('collection_photos')
        .select(`
          order,
          photos (*)
        `)
        .eq('collection_id', currentCollectionId)
        .order('order', { ascending: true })

      if (error) throw error

      const photos = (data as unknown as CollectionPhotoWithPhoto[] | null)?.map(cp => cp.photos).filter(Boolean) || []
      setCollectionPhotos(photos)
    } catch (error: unknown) {
      console.error('Error loading collection photos:', error)
      toast.error('Failed to load photos')
    }
  }, [currentPath, supabase])

  // Memoized breadcrumb computation
  const currentPathNames = useMemo(() => {
    const names: string[] = ['Home']

    for (const pathId of currentPath) {
      const collection = allCollections.find(c => c.id === pathId)
      if (collection) {
        names.push(collection.title)
      }
    }

    return names
  }, [currentPath, allCollections])

  const navigateToPath = (pathIndex: number) => {
    setCurrentPath(currentPath.slice(0, pathIndex))
    setSelectedItems(new Set())
  }

  const openFolder = (folderId: string) => {
    setCurrentPath([...currentPath, folderId])
    setSelectedItems(new Set())
  }

  const goUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
      setSelectedItems(new Set())
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      setLoadingStates(prev => ({ ...prev, creating: true }))

      const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

      const { error } = await supabase
        .from('collections')
        .insert([{
          title: newFolderName.trim(),
          slug: newFolderName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          parent_id: currentFolderId
        }])

      if (error) throw error

      toast.success('Folder created successfully')
      setNewFolderName('')
      setShowCreateFolder(false)
      await loadAllCollections()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create folder'
      toast.error(message)
      console.error('Create folder error:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, creating: false }))
    }
  }

  const renameItem = async () => {
    if (!renamingItem || !renameValue.trim()) return

    try {
      setLoadingStates(prev => ({ ...prev, renaming: true }))

      if (renamingItem.type === 'folder') {
        const { error } = await supabase
          .from('collections')
          .update({
            title: renameValue.trim(),
            slug: renameValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
          })
          .eq('id', renamingItem.id)

        if (error) throw error
      }

      toast.success('Renamed successfully')
      setRenamingItem(null)
      setRenameValue('')
      setShowRenameDialog(false)
      await loadAllCollections()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to rename'
      toast.error(message)
      console.error('Rename error:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, renaming: false }))
    }
  }

  const editItem = async () => {
    if (!editingItem) return

    try {
      setLoadingStates(prev => ({ ...prev, renaming: true })) // reusing renaming state

      const { error } = await supabase
        .from('collections')
        .update({
          title: editFormData.title.trim(),
          slug: editFormData.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          description: editFormData.description.trim() || null,
          cover_image_url: editFormData.cover_image_url.trim() || null,
          parent_id: editFormData.parent_id || null,
          featured: editFormData.featured
        })
        .eq('id', editingItem.id)

      if (error) throw error

      toast.success('Collection updated successfully')
      setEditingItem(null)
      setEditFormData({ title: '', description: '', cover_image_url: '', parent_id: '', featured: false })
      setShowEditDialog(false)
      await loadAllCollections()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update collection'
      toast.error(message)
      console.error('Edit error:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, renaming: false }))
    }
  }

  const deleteItems = async (itemIds: string[]) => {
    try {
      setLoadingStates(prev => ({ ...prev, deleting: true }))

      // Delete collections
      const collectionIds = itemIds.filter(id =>
        allCollections.some(c => c.id === id)
      )

      if (collectionIds.length > 0) {
        const { error } = await supabase
          .from('collections')
          .delete()
          .in('id', collectionIds)

        if (error) throw error
      }

      toast.success(`${itemIds.length} item${itemIds.length > 1 ? 's' : ''} deleted`)
      setSelectedItems(new Set())
      await loadAllCollections()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete items'
      toast.error(message)
      console.error('Delete error:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }))
    }
  }

  const bulkMoveItems = async () => {
    if (selectedItems.size === 0 || !bulkMoveTarget) return

    try {
      setLoadingStates(prev => ({ ...prev, renaming: true })) // reusing loading state

      const targetParentId = bulkMoveTarget === 'none' ? null : bulkMoveTarget

      const { error } = await supabase
        .from('collections')
        .update({ parent_id: targetParentId })
        .in('id', Array.from(selectedItems))

      if (error) throw error

      toast.success(`${selectedItems.size} collection${selectedItems.size > 1 ? 's' : ''} moved successfully`)
      setSelectedItems(new Set())
      setBulkMoveTarget('')
      setShowBulkMoveDialog(false)
      await loadAllCollections()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to move collections'
      toast.error(message)
      console.error('Bulk move error:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, renaming: false }))
    }
  }

  const handlePhotoUpload = async (uploadedImages: UploadedImage[]) => {
    const currentCollectionId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null

    if (!currentCollectionId) {
      toast.error('No collection selected')
      return
    }

    try {
      // First, save photos to the photos table
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
        order: collectionPhotos.length + index
      }))

      const { data: insertedPhotos, error: photoError } = await supabase
        .from('photos')
        .insert(photosToInsert)
        .select()

      if (photoError) throw photoError

      // Then, associate photos with the collection
      if (insertedPhotos) {
        const collectionPhotosToInsert = insertedPhotos.map((photo, index) => ({
          collection_id: currentCollectionId,
          photo_id: photo.id,
          order: collectionPhotos.length + index
        }))

        const { error: associationError } = await supabase
          .from('collection_photos')
          .insert(collectionPhotosToInsert)

        if (associationError) throw associationError
      }

      toast.success(`${uploadedImages.length} photo${uploadedImages.length > 1 ? 's' : ''} added to collection`)
      await loadCollectionPhotos()
      setShowPhotoUpload(false)
    } catch (error: unknown) {
      console.error('Error adding photos to collection:', error)
      toast.error('Failed to add photos to collection')
    }
  }

  const removePhotoFromCollection = async (photoId: string) => {
    if (!confirm('Remove this photo from the collection?')) return

    try {
      const { error } = await supabase
        .from('collection_photos')
        .delete()
        .eq('photo_id', photoId)
        .eq('collection_id', currentPath[currentPath.length - 1])

      if (error) throw error

      toast.success('Photo removed from collection')
      await loadCollectionPhotos()
    } catch (error: unknown) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    }
  }

  const updatePhoto = async () => {
    if (!editingPhoto) return

    try {
      setLoadingStates(prev => ({ ...prev, renaming: true }))

      const photoData = {
        title: editingPhoto.title,
        description: editingPhoto.description,
        alt: editingPhoto.alt,
        caption: editingPhoto.caption,
        camera: editingPhoto.camera,
        lens: editingPhoto.lens,
        settings: Object.fromEntries(
          Object.entries(editingPhoto.settings || {}).filter(([, value]) => value !== '')
        ),
        location: editingPhoto.location,
        date_taken: editingPhoto.date_taken ? new Date(editingPhoto.date_taken).toISOString() : null
      }

      const { error } = await supabase
        .from('photos')
        .update(photoData)
        .eq('id', editingPhoto.id)

      if (error) throw error

      toast.success('Photo updated successfully')
      setEditingPhoto(null)
      setShowPhotoEdit(false)
      await loadCollectionPhotos()
    } catch (error: unknown) {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
    } finally {
      setLoadingStates(prev => ({ ...prev, renaming: false }))
    }
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === currentItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(currentItems.map(item => item.id)))
    }
  }




  return (
    <div className="h-full flex flex-col">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 m-4">
          <div className="flex items-center gap-2 text-destructive">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            className="mt-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-4 border-b bg-background">
        {/* Top row on mobile: Navigation + Breadcrumbs */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goUp}
              disabled={currentPath.length === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath(0)}
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllCollections}
              disabled={loadingStates.loading}
            >
              <RefreshCw className={`w-4 h-4 ${loadingStates.loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <Breadcrumb>
              <BreadcrumbList className="flex-wrap">
                {currentPathNames.map((name: string, index: number) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === currentPathNames.length - 1 ? (
                        <BreadcrumbPage className="text-sm">{name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          className="cursor-pointer text-sm"
                          onClick={() => navigateToPath(index)}
                        >
                          {name}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Bottom row on mobile: Search, View mode, Select All, Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-48 md:w-64"
            />
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* View mode toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Select All */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedItems.size === currentItems.length && currentItems.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="select-all" className="text-sm cursor-pointer hidden sm:inline">
              Select All
            </label>
          </div>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Actions */}
          <div className="flex gap-1 sm:gap-2">
            <Button onClick={() => setShowCreateFolder(true)} size="sm" className="text-xs sm:text-sm">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Folder</span>
            </Button>
            {currentPath.length > 0 && (
              <Button onClick={() => setShowPhotoUpload(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
                <FileImage className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Photos</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border-b bg-muted/50">
          <span className="text-sm font-medium">
            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkMoveDialog(true)}
              className="flex-1 sm:flex-none"
            >
              Move To
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedItems.size} collection${selectedItems.size > 1 ? 's' : ''}?`)) {
                  deleteItems(Array.from(selectedItems))
                }
              }}
              className="flex-1 sm:flex-none"
            >
              Delete
            </Button>
          </div>
          <div className="flex-1 hidden sm:block" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedItems(new Set())}
            className="w-full sm:w-auto"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* File Explorer Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {loadingStates.loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Folder className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No items found' : 'This folder is empty'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Create a new folder or upload some files'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateFolder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4">
                {viewMode === 'grid' ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={currentItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                        {currentItems.map((item) => (
                          <SortableCollectionItem
                            key={item.id}
                            item={item}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            onEdit={(item) => {
                              setEditingItem(item)
                              setEditFormData({
                                title: item.name,
                                description: (item.data as Collection).description || '',
                                cover_image_url: (item.data as Collection).cover_image_url || '',
                                parent_id: (item.data as Collection).parent_id || '',
                                featured: (item.data as Collection).featured || false
                              })
                              setShowEditDialog(true)
                            }}
                            onDelete={(itemId) => deleteItems([itemId])}
                            onRename={(item) => {
                              setRenamingItem(item)
                              setRenameValue(item.name)
                              setShowRenameDialog(true)
                            }}
                            onShowProperties={(item) => {
                              setPropertiesItem(item)
                              setShowProperties(true)
                            }}
                            onOpenFolder={openFolder}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-1">
                    {currentItems.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger>
                          <div
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent ${
                              selectedItems.has(item.id) ? 'bg-accent' : ''
                            }`}
                            onClick={() => {
                              if (item.type === 'folder') {
                                openFolder(item.id)
                              }
                            }}
                          >
                            {item.type === 'folder' ? (
                              item.data && 'cover_image_url' in item.data && item.data.cover_image_url ? (
                                <div className="w-8 h-8 flex-shrink-0 relative overflow-hidden rounded">
                                  <Image
                                    src={item.data.cover_image_url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <Folder className="w-8 h-8 text-blue-500 flex-shrink-0" />
                              )
                            ) : (
                              <FileImage className="w-8 h-8 text-gray-500 flex-shrink-0" />
                            )}
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {item.modified}
                            </span>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => {
                            setEditingItem(item)
                            setEditFormData({
                              title: item.name,
                              description: (item.data as Collection).description || '',
                              cover_image_url: (item.data as Collection).cover_image_url || '',
                              parent_id: (item.data as Collection).parent_id || '',
                              featured: (item.data as Collection).featured || false
                            })
                            setShowEditDialog(true)
                          }}>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => {
                            setRenamingItem(item)
                            setRenameValue(item.name)
                            setShowRenameDialog(true)
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Rename
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => {
                            setPropertiesItem(item)
                            setShowProperties(true)
                          }}>
                            <Settings className="w-4 h-4 mr-2" />
                            Properties
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => deleteItems([item.id])}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Photos Section - Show when viewing a collection */}
        {currentPath.length > 0 && (
          <div className="border-t bg-background">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Photos in Collection</h3>
                <Button onClick={() => setShowPhotoUpload(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              </div>

              {collectionPhotos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileImage className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No photos in this collection yet</p>
                  <Button
                    onClick={() => setShowPhotoUpload(true)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Photos
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {collectionPhotos.map((photo) => (
                    <ContextMenu key={photo.id}>
                      <ContextMenuTrigger>
                        <div className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:shadow-lg transition-all">
                          <Image
                            src={getThumbnailUrl(photo.image_id)}
                            alt={photo.alt || photo.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPhoto(photo)
                                  setShowPhotoPreview(true)
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removePhotoFromCollection(photo.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs truncate font-medium">{photo.title}</p>
                            {photo.camera && (
                              <p className="text-white/80 text-xs truncate">{photo.camera}</p>
                            )}
                          </div>
                          {/* EXIF Badge */}
                          {(photo.camera || photo.settings) && (
                            <div className="absolute top-2 right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs px-2 py-1 rounded-full shadow-lg border border-amber-300/50 flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              <span className="font-medium">EXIF</span>
                            </div>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => {
                          setSelectedPhoto(photo)
                          setShowPhotoPreview(true)
                        }}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => {
                          setEditingPhoto({...photo})
                          setShowPhotoEdit(true)
                        }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Details
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => window.open(photo.image_url, '_blank')}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open Original
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => removePhotoFromCollection(photo.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from Collection
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFolder()
                  }
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateFolder(false)
                  setNewFolderName('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || loadingStates.creating}
              >
                {loadingStates.creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Folder
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {renamingItem?.type}</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{renamingItem?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">New Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameItem()
                  }
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRenameDialog(false)
                  setRenamingItem(null)
                  setRenameValue('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={renameItem}
                disabled={!renameValue.trim() || loadingStates.renaming}
              >
                {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Rename
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Properties Dialog */}
      <Dialog open={showProperties} onOpenChange={setShowProperties}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Properties</DialogTitle>
          </DialogHeader>

          {propertiesItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {propertiesItem.type === 'folder' ? (
                  propertiesItem.data && 'cover_image_url' in propertiesItem.data && propertiesItem.data.cover_image_url ? (
                    <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden rounded">
                      <Image
                        src={propertiesItem.data.cover_image_url}
                        alt={propertiesItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Folder className="w-12 h-12 text-blue-500" />
                  )
                ) : (
                  <FileImage className="w-12 h-12 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold">{propertiesItem.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {propertiesItem.type}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {propertiesItem.type}
                  </span>
                </div>

                {propertiesItem.modified && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Modified:</span>
                    <span className="text-sm text-muted-foreground">
                      {propertiesItem.modified}
                    </span>
                  </div>
                )}

                {propertiesItem.size && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Size:</span>
                    <span className="text-sm text-muted-foreground">
                      {propertiesItem.size} bytes
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowProperties(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update the collection details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cover">Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-cover"
                  value={editFormData.cover_image_url}
                  onChange={(e) => setEditFormData({ ...editFormData, cover_image_url: e.target.value })}
                  placeholder="https://... or select from existing images"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowImageSelector(true)}
                >
                  Browse Images
                </Button>
              </div>
              {editFormData.cover_image_url && (
                <div className="mt-2">
                  <Image
                    src={editFormData.cover_image_url}
                    alt="Cover preview"
                    width={100}
                    height={75}
                    className="object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Collection</Label>
              <Select
                value={editFormData.parent_id || 'none'}
                onValueChange={(value) => setEditFormData({ ...editFormData, parent_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root level)</SelectItem>
                  {allCollections
                    .filter(collection => editingItem ? collection.id !== editingItem.id : true) // Can't be its own parent
                    .map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={editFormData.featured}
                onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured album on homepage
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingItem(null)
                  setEditFormData({ title: '', description: '', cover_image_url: '', parent_id: '', featured: false })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editItem}
                disabled={!editFormData.title.trim() || loadingStates.renaming}
              >
                {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Collection
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Selector Dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Cover Image</DialogTitle>
            <DialogDescription>
              Choose an existing image to use as the collection cover
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {availableImages.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 hover:border-primary transition-colors"
                  onClick={() => {
                    setEditFormData({ ...editFormData, cover_image_url: photo.image_url })
                    setShowImageSelector(false)
                  }}
                >
                  <Image
                    src={photo.image_url}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                      Select
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {availableImages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No images available. Upload some photos first.
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Photos to Collection</DialogTitle>
            <DialogDescription>
              Upload photos to add them to the current collection
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <CloudinaryBulkUpload
              onUploadComplete={handlePhotoUpload}
              folder={currentPath.length > 0 ? getCollectionFolder(allCollections.find(c => c.id === currentPath[currentPath.length - 1]) || { slug: 'untitled' }) : 'rithychanvirak/misc'}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhotoUpload(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={showBulkMoveDialog} onOpenChange={setShowBulkMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Collections</DialogTitle>
            <DialogDescription>
              Move {selectedItems.size} collection{selectedItems.size > 1 ? 's' : ''} to a new location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-move-target">New Parent Collection</Label>
              <Select value={bulkMoveTarget} onValueChange={setBulkMoveTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Root level (no parent)</SelectItem>
                  {allCollections
                    .filter(collection => !selectedItems.has(collection.id)) // Can't move to selected items
                    .map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBulkMoveDialog(false)
                  setBulkMoveTarget('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={bulkMoveItems}
                disabled={!bulkMoveTarget || loadingStates.renaming}
              >
                {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Move Collections
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={showPhotoPreview} onOpenChange={setShowPhotoPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full sm:max-w-6xl sm:max-h-[90vh] p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-base sm:text-lg lg:text-xl">{selectedPhoto?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              Photo details and metadata
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 max-h-[75vh] lg:max-h-[80vh]">
              {/* Image */}
              <div className="flex-1 relative min-h-[300px] lg:min-h-[400px] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <Image
                  src={getThumbnailUrl(selectedPhoto.image_id)}
                  alt={selectedPhoto.alt || selectedPhoto.title}
                  width={selectedPhoto.image_width || 1200}
                  height={selectedPhoto.image_height || 800}
                  className="max-w-full max-h-full object-contain"
                  priority
                />
              </div>

              {/* Metadata Sidebar */}
              <div className="w-full lg:w-80 space-y-6 max-h-[400px] lg:max-h-none overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Title:</span>
                      <span className="text-sm font-medium">{selectedPhoto.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dimensions:</span>
                      <span className="text-sm font-medium">{selectedPhoto.image_width} × {selectedPhoto.image_height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date Taken:</span>
                      <span className="text-sm font-medium">
                        {selectedPhoto.date_taken ? new Date(selectedPhoto.date_taken).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    {selectedPhoto.location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm font-medium">{selectedPhoto.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Camera Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Camera Settings</h3>
                  <div className="space-y-3">
                    {selectedPhoto.camera && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Camera:</span>
                        <span className="text-sm font-medium">{selectedPhoto.camera}</span>
                      </div>
                    )}
                    {selectedPhoto.lens && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lens:</span>
                        <span className="text-sm font-medium">{selectedPhoto.lens}</span>
                      </div>
                    )}
                    {selectedPhoto.settings && (
                      <>
                        {selectedPhoto.settings.aperture && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Aperture:</span>
                            <span className="text-sm font-medium">{selectedPhoto.settings.aperture}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.shutter && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Shutter:</span>
                            <span className="text-sm font-medium">{selectedPhoto.settings.shutter}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.iso && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">ISO:</span>
                            <span className="text-sm font-medium">{selectedPhoto.settings.iso}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.focalLength && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Focal Length:</span>
                            <span className="text-sm font-medium">{selectedPhoto.settings.focalLength}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPhoto.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedPhoto.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhotoPreview(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedPhoto) {
                  setEditingPhoto({...selectedPhoto})
                  setShowPhotoEdit(true)
                  setShowPhotoPreview(false)
                }
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Edit Dialog */}
      <Dialog open={showPhotoEdit} onOpenChange={setShowPhotoEdit}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[1600px] max-h-[90vh] p-0 flex flex-col gap-0">
          <DialogHeader className="shrink-0 pb-3 border-b px-4 sm:px-6 pt-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base sm:text-lg font-bold">Edit Photo Details</DialogTitle>
            </div>
          </DialogHeader>

          {editingPhoto && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_1fr] gap-4 sm:gap-6">
                  {/* Column 1: Image Preview */}
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                      <Image
                        src={getThumbnailUrl(editingPhoto.image_id)}
                        alt={editingPhoto.alt || editingPhoto.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Column 2: Basic Info */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="photo-title">Title *</Label>
                      <Input
                        id="photo-title"
                        value={editingPhoto.title}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, title: e.target.value} : null)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-alt">Alt Text</Label>
                      <Input
                        id="photo-alt"
                        value={editingPhoto.alt || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, alt: e.target.value} : null)}
                        placeholder="Describe the image for accessibility"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-caption">Caption</Label>
                      <Input
                        id="photo-caption"
                        value={editingPhoto.caption || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, caption: e.target.value} : null)}
                        placeholder="Short caption for the photo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-description">Description</Label>
                      <Textarea
                        id="photo-description"
                        value={editingPhoto.description || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, description: e.target.value} : null)}
                        rows={2}
                        placeholder="Detailed description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-location">Location</Label>
                      <Input
                        id="photo-location"
                        value={editingPhoto.location || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, location: e.target.value} : null)}
                        placeholder="e.g., Phnom Penh"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-date_taken">Date Taken</Label>
                      <Input
                        id="photo-date_taken"
                        type="date"
                        value={editingPhoto.date_taken ? new Date(editingPhoto.date_taken).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, date_taken: e.target.value} : null)}
                      />
                    </div>
                  </div>

                  {/* Column 3: Camera & Settings */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="photo-camera">Camera</Label>
                      <Input
                        id="photo-camera"
                        value={editingPhoto.camera || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, camera: e.target.value} : null)}
                        placeholder="e.g., Canon EOS R5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="photo-lens">Lens</Label>
                      <Input
                        id="photo-lens"
                        value={editingPhoto.lens || ''}
                        onChange={(e) => setEditingPhoto(editingPhoto ? {...editingPhoto, lens: e.target.value} : null)}
                        placeholder="e.g., 24-70mm f/2.8"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="photo-aperture">Aperture</Label>
                        <Input
                          id="photo-aperture"
                          value={editingPhoto.settings?.aperture || ''}
                          onChange={(e) => setEditingPhoto(editingPhoto ? {
                            ...editingPhoto,
                            settings: { ...editingPhoto.settings, aperture: e.target.value }
                          } : null)}
                          placeholder="e.g., 2.8"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo-shutter">Shutter Speed</Label>
                        <Input
                          id="photo-shutter"
                          value={editingPhoto.settings?.shutter || ''}
                          onChange={(e) => setEditingPhoto(editingPhoto ? {
                            ...editingPhoto,
                            settings: { ...editingPhoto.settings, shutter: e.target.value }
                          } : null)}
                          placeholder="e.g., 1/250"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo-iso">ISO</Label>
                        <Input
                          id="photo-iso"
                          value={editingPhoto.settings?.iso || ''}
                          onChange={(e) => setEditingPhoto(editingPhoto ? {
                            ...editingPhoto,
                            settings: { ...editingPhoto.settings, iso: e.target.value }
                          } : null)}
                          placeholder="e.g., 100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo-focalLength">Focal Length</Label>
                        <Input
                          id="photo-focalLength"
                          value={editingPhoto.settings?.focalLength || ''}
                          onChange={(e) => setEditingPhoto(editingPhoto ? {
                            ...editingPhoto,
                            settings: { ...editingPhoto.settings, focalLength: e.target.value }
                          } : null)}
                          placeholder="e.g., 50mm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="shrink-0 bg-background border-t p-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => {
              setShowPhotoEdit(false)
              setEditingPhoto(null)
            }}>
              Cancel
            </Button>
            <Button onClick={updatePhoto} disabled={!editingPhoto?.title.trim() || loadingStates.renaming}>
              {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
