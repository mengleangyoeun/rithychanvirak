'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Collection, Photo, CollectionPhoto } from '@/types/database'
import { getCollectionFolder } from '@/lib/cloudinary-folders'
import { revalidatePublicPaths } from '@/lib/revalidate-client'

interface CollectionPhotoWithPhoto extends CollectionPhoto {
  photos: Photo
}
import { CloudinaryBulkUpload } from '@/components/cloudinary-bulk-upload'
import { CloudinaryUpload } from '@/components/cloudinary-upload'

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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Plus, Pencil, Folder, RefreshCw, Trash2, ArrowLeft, Loader2,
  Search, Grid3X3, List, Home, FileImage, Settings, Camera, Star, Check,
  MoreVertical, ExternalLink, Eye, ImageIcon, Layers, MoveRight, ChevronRight, X,
  ArrowUp, ArrowDown
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { getOptimizedImageUrl, getThumbnailUrl } from '@/lib/cloudinary'

export interface EnhancedCollection extends Collection {
  previewPhotos?: string[]
  directPhotoCount?: number
  totalPhotoCount?: number
  subAlbumsCount?: number
}
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

// Sortable Featured Item Component
function SortableFeaturedItem({
  collection,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onUnfeature
}: {
  collection: EnhancedCollection
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onUnfeature: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: collection.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-2.5 sm:p-3 bg-zinc-900/90 hover:bg-zinc-900 rounded-xl border transition-all duration-200 ${
        isDragging
          ? 'opacity-60 border-white/60 shadow-2xl z-30 scale-[1.02] ring-1 ring-white/30'
          : 'border-zinc-800 hover:border-zinc-700 shadow-sm'
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 touch-none shrink-0 transition-colors"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 15h8" />
        </svg>
      </div>

      {/* Position Badge */}
      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-700/60">
        #{index + 1}
      </span>

      {/* Album Cover Thumbnail */}
      <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 relative shrink-0">
        {collection.cover_image_url ? (
          <Image src={collection.cover_image_url} alt={collection.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
            <Folder className="w-5 h-5 text-zinc-500" />
          </div>
        )}
      </div>

      {/* Album Title & Meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white truncate">{collection.title}</p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {collection.totalPhotoCount ?? 0} photos
        </p>
      </div>

      {/* Quick Move Up/Down & Unfeature */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp()
          }}
          className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
          title="Move Up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={index === total - 1}
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown()
          }}
          className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
          title="Move Down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onUnfeature()
          }}
          className="h-7 w-7 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors ml-1"
          title="Remove from Featured"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// Sortable Collection Item Component
function SortableCollectionItem({
  item,
  selectedItems,
  setSelectedItems,
  dragDisabled,
  onEdit,
  onDelete,
  onRename,
  onShowProperties,
  onOpenFolder
}: {
  item: FileExplorerItem
  selectedItems: Set<string>
  setSelectedItems: (items: Set<string>) => void
  dragDisabled: boolean
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
  } = useSortable({ id: item.id, disabled: dragDisabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const colData = item.data as EnhancedCollection
  const previewImages = (colData?.previewPhotos && colData.previewPhotos.length > 0)
    ? colData.previewPhotos
    : (colData?.cover_image_url ? [colData.cover_image_url] : [])

  const isSelected = selectedItems.has(item.id)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={`group relative rounded-2xl border transition-all duration-200 ease-out flex flex-col overflow-hidden select-none cursor-pointer ${
            isSelected
              ? 'bg-zinc-900 border-white/60 shadow-lg ring-1 ring-white/40'
              : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 shadow-sm hover:shadow-xl'
          } ${isDragging ? 'opacity-40 scale-[0.98] z-30' : ''}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[data-no-nav]')) {
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
          {/* Card Media Preview */}
          <div className="aspect-[4/3] relative overflow-hidden bg-zinc-950">
            {previewImages.length > 0 ? (
              <div className="w-full h-full relative">
                {previewImages.slice(0, 3).reverse().map((url: string, i: number, arr: string[]) => {
                  const offset = arr.length - 1 - i
                  let transformClass = 'z-30 group-hover:scale-105'
                  if (offset === 1) transformClass = 'z-20 scale-[0.93] -translate-y-2.5 opacity-75 shadow-md'
                  if (offset === 2) transformClass = 'z-10 scale-[0.86] -translate-y-5 opacity-50 shadow-lg'

                  return (
                    <Image
                      key={i}
                      src={url}
                      alt={item.name}
                      fill
                      className={`object-cover absolute inset-0 transition-all duration-300 ${transformClass}`}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  )
                })}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900/60 to-zinc-950 text-zinc-600 gap-2">
                <Folder className="w-12 h-12 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                <span className="text-[11px] font-medium text-zinc-500">Empty Album</span>
              </div>
            )}

            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

            {/* Top Badges & Select Controls */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20">
              {/* Checkbox */}
              <button
                type="button"
                data-no-nav
                onClick={(e) => {
                  e.stopPropagation()
                  const next = new Set(selectedItems)
                  if (next.has(item.id)) {
                    next.delete(item.id)
                  } else {
                    next.add(item.id)
                  }
                  setSelectedItems(next)
                }}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white border-white text-black shadow-md'
                    : 'border-white/40 bg-black/40 text-transparent hover:border-white hover:bg-black/60 backdrop-blur-md'
                }`}
                aria-label={isSelected ? 'Deselect album' : 'Select album'}
              >
                <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <div className="flex items-center gap-1.5">
                {colData?.featured && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 backdrop-blur-md shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-amber-300" /> Featured
                  </span>
                )}

                {/* Drag Handle */}
                <div
                  data-no-nav
                  {...attributes}
                  {...listeners}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg bg-black/40 border border-white/20 backdrop-blur-md text-white/80 transition-colors ${
                    dragDisabled
                      ? 'cursor-not-allowed opacity-30'
                      : 'cursor-grab active:cursor-grabbing hover:text-white hover:bg-black/60'
                  }`}
                  title="Drag to reorder"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 15h8" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Hover Quick Action Buttons */}
            <div className="absolute inset-0 z-20 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
              <Button
                type="button"
                data-no-nav
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenFolder(item.id)
                }}
                className="rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold h-8 px-3 shadow-lg"
              >
                Open Album
              </Button>
              <Button
                type="button"
                data-no-nav
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="rounded-xl border-white/30 bg-black/60 text-white hover:bg-black hover:border-white text-xs h-8 w-8 shadow-lg"
                title="Edit Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Card Bottom Meta */}
          <div className="p-3.5 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-primary transition-colors text-left" title={item.name}>
                {item.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                {colData?.subAlbumsCount ? (
                  <span>{colData.subAlbumsCount} sub-albums · {colData.totalPhotoCount ?? 0} photos</span>
                ) : (
                  <span>{colData?.directPhotoCount ?? colData?.totalPhotoCount ?? 0} photos</span>
                )}
              </div>
            </div>

            {/* Mobile / Direct More Menu */}
            <div data-no-nav>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 border-zinc-800 bg-zinc-950 text-white">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Album
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRename(item)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShowProperties(item)}>
                    <Layers className="w-4 h-4 mr-2" />
                    Properties
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={() => onDelete(item.id)}
                    className="text-red-400 focus:text-red-300 focus:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="border-zinc-800 bg-zinc-950 text-white">
        <ContextMenuItem onClick={() => onOpenFolder(item.id)}>
          <Folder className="w-4 h-4 mr-2" />
          Open Album
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(item)}>
          <Settings className="w-4 h-4 mr-2" />
          Edit Settings
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRename(item)}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onShowProperties(item)}>
          <Layers className="w-4 h-4 mr-2" />
          Properties
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-zinc-800" />
        <ContextMenuItem
          onClick={() => onDelete(item.id)}
          className="text-red-400 focus:text-red-300 focus:bg-red-950/50"
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
  const getCurrentCollectionPublicPath = () => {
    const currentCollectionId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
    if (!currentCollectionId) return null
    const currentCollection = allCollections.find((collection) => collection.id === currentCollectionId)
    return currentCollection ? `/collection/${currentCollection.slug}` : null
  }

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    if (searchQuery.trim().length > 0 || selectedItems.size > 0 || loadingStates.renaming || loadingStates.deleting) {
      return
    }

    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeItem = currentItems.find((item) => item.id === active.id)
      const overItem = currentItems.find((item) => item.id === over.id)
      if (!activeItem || !overItem || activeItem.type !== 'folder' || overItem.type !== 'folder') {
        return
      }

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
      const folderItems = items.filter((item) => item.type === 'folder')
      const updates = folderItems.map((item, index) => ({
        id: item.id,
        order: index
      }))

      for (const update of updates) {
        await supabase
          .from('collections')
          .update({ order: update.order })
          .eq('id', update.id)
      }

      await revalidatePublicPaths(['/', '/gallery'])

      toast.success('Collection order updated')
    } catch (error: unknown) {
      console.error('Error updating order:', error)
      toast.error('Failed to update collection order')
      // Revert the local state on error
      updateCurrentItems()
    }
  }

  const updateFeaturedOrder = async (orderedFeatured: Collection[]) => {
    try {
      const updatedAll = [...allCollections];
      orderedFeatured.forEach((c, index) => {
        const target = updatedAll.find(item => item.id === c.id);
        if (target) target.order = index;
      });
      setAllCollections(updatedAll);
      
      if (currentPath.length === 0) {
        const updatedCurrent = currentItems.map(item => {
          if (item.type === 'folder') {
            const found = orderedFeatured.find(f => f.id === item.id);
            if (found) return { ...item, data: { ...item.data, order: orderedFeatured.indexOf(found) } };
          }
          return item;
        }).sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          if (a.type === 'folder' && b.type === 'folder') {
            return ((a.data as Collection).order || 0) - ((b.data as Collection).order || 0);
          }
          return new Date((b.data as Photo).created_at || 0).getTime() - new Date((a.data as Photo).created_at || 0).getTime();
        });
        setCurrentItems(updatedCurrent);
      }

      for (let i = 0; i < orderedFeatured.length; i++) {
        await supabase.from('collections').update({ order: i }).eq('id', orderedFeatured[i].id);
      }
      await revalidatePublicPaths(['/', '/gallery'])
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
      loadAllCollections()
    }
  }
  const handleFeaturedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const featuredItems = allCollections
      .filter(c => c.featured && !c.parent_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const oldIndex = featuredItems.findIndex(f => f.id === active.id)
    const newIndex = featuredItems.findIndex(f => f.id === over.id)

    const newArray = arrayMove(featuredItems, oldIndex, newIndex)
    updateFeaturedOrder(newArray)
  }

  const moveFeaturedItem = (index: number, direction: 'up' | 'down') => {
    const featuredItems = allCollections
      .filter(c => c.featured && !c.parent_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= featuredItems.length) return

    const newArray = arrayMove(featuredItems, index, targetIndex)
    updateFeaturedOrder(newArray)
  }

  const handleUnfeature = async (collection: Collection) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ featured: false })
        .eq('id', collection.id)

      if (error) throw error

      toast.success(`Removed "${collection.title}" from featured`)
      await revalidatePublicPaths(['/', '/gallery'])
      await loadAllCollections()
    } catch (err) {
      console.error('Error removing from featured:', err)
      toast.error('Failed to update featured album')
    }
  }

  // Core state
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [allCollections, setAllCollections] = useState<EnhancedCollection[]>([])
  const [currentItems, setCurrentItems] = useState<FileExplorerItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Photo management state
  const [collectionPhotos, setCollectionPhotos] = useState<Photo[]>([])
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [showPhotoEdit, setShowPhotoEdit] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [photoDeleteProgress, setPhotoDeleteProgress] = useState<{ current: number; total: number } | null>(null)
  const [photoRenderCount, setPhotoRenderCount] = useState(120)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    description: string
    confirmText: string
    action: () => Promise<void>
  } | null>(null)

  // UI state
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showFeaturedOrder, setShowFeaturedOrder] = useState(false)
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
  const [coverCollectionImages, setCoverCollectionImages] = useState<Photo[]>([])
  const [coverAllImages, setCoverAllImages] = useState<Photo[]>([])
  const [coverImagesLoading, setCoverImagesLoading] = useState(false)
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

  // Core data loading with accurate recursive photo counting
  const loadAllCollections = useCallback(async () => {
    try {
      setError(null)
      setLoadingStates(prev => ({ ...prev, loading: true }))

      // 1. Fetch all collections
      const { data: allCollectionsData, error: colError } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (colError) throw colError

      // 2. Fetch all collection_photos in batches to bypass PostgREST 1,000-row limit
      const allCollectionPhotoLinks: {
        collection_id: string
        photo_id: string
        order: number
        photos: { id: string; image_url?: string } | { id: string; image_url?: string }[] | null
      }[] = []

      let from = 0
      const PAGE_SIZE = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: linksError } = await supabase
          .from('collection_photos')
          .select(`
            collection_id,
            photo_id,
            order,
            photos ( id, image_url )
          `)
          .range(from, from + PAGE_SIZE - 1)

        if (linksError) {
          console.error('Error fetching collection_photos batch:', linksError)
          break
        }

        if (batch && batch.length > 0) {
          allCollectionPhotoLinks.push(...(batch as unknown as typeof allCollectionPhotoLinks))
          if (batch.length < PAGE_SIZE) {
            hasMore = false
          } else {
            from += PAGE_SIZE
          }
        } else {
          hasMore = false
        }
      }

      // 3. Build maps for direct photo IDs and preview collage images
      const directPhotoIdsMap = new Map<string, Set<string>>()
      const directPhotosMap = new Map<string, { url: string; order: number }[]>()

      for (const link of allCollectionPhotoLinks) {
        if (!link.collection_id) continue

        const rawPhoto = link.photos
        const photo = Array.isArray(rawPhoto) ? rawPhoto[0] : rawPhoto
        const photoId = link.photo_id || photo?.id

        if (photoId) {
          const idSet = directPhotoIdsMap.get(link.collection_id) || new Set<string>()
          idSet.add(photoId)
          directPhotoIdsMap.set(link.collection_id, idSet)

          const imageUrl = photo?.image_url
          if (imageUrl) {
            const list = directPhotosMap.get(link.collection_id) || []
            list.push({ url: imageUrl, order: link.order || 0 })
            directPhotosMap.set(link.collection_id, list)
          }
        }
      }

      // 4. Build parent -> children map for hierarchy traversal
      const childrenMap = new Map<string, string[]>()
      for (const col of allCollectionsData || []) {
        if (col.parent_id && col.parent_id.trim() !== '') {
          const siblings = childrenMap.get(col.parent_id) || []
          siblings.push(col.id)
          childrenMap.set(col.parent_id, siblings)
        }
      }

      // 5. Build recursive preview photos getter
      const getPreviews = (rootId: string) => {
        const allPreviewPhotos: { url: string; order: number }[] = [...(directPhotosMap.get(rootId) || [])]
        const queue = [rootId]
        while (queue.length > 0) {
          const current = queue.shift()!
          const children = childrenMap.get(current) || []
          for (const childId of children) {
            allPreviewPhotos.push(...(directPhotosMap.get(childId) || []))
            queue.push(childId)
          }
        }
        return allPreviewPhotos
          .sort((a, b) => a.order - b.order)
          .slice(0, 3)
          .map(p => p.url)
      }

      // 6. Build recursive unique photo counter
      const getCounts = (rootId: string) => {
        const photoIds = new Set<string>(directPhotoIdsMap.get(rootId) || [])
        let totalSubAlbums = 0
        const queue = [rootId]
        while (queue.length > 0) {
          const current = queue.shift()!
          const children = childrenMap.get(current) || []
          for (const childId of children) {
            const childPhotoIds = directPhotoIdsMap.get(childId) || []
            childPhotoIds.forEach((id) => photoIds.add(id))
            totalSubAlbums += 1
            queue.push(childId)
          }
        }
        const direct = (directPhotoIdsMap.get(rootId) || new Set()).size
        const total = photoIds.size
        const directSubCount = (childrenMap.get(rootId) || []).length
        return { direct, total, subCount: directSubCount, totalSubAlbums }
      }

      const enhancedCollections: EnhancedCollection[] = (allCollectionsData || []).map(col => {
        let finalPreviewPhotos = getPreviews(col.id)
        if (col.cover_image_url) {
          const filtered = finalPreviewPhotos.filter(url => url !== col.cover_image_url)
          finalPreviewPhotos = [col.cover_image_url, ...filtered].slice(0, 3)
        }
        const { direct, total, subCount } = getCounts(col.id)
        return {
          ...col,
          previewPhotos: finalPreviewPhotos,
          directPhotoCount: direct,
          totalPhotoCount: total,
          subAlbumsCount: subCount
        }
      })

      setAllCollections(enhancedCollections)
    } catch (error: unknown) {
      console.error('Error loading collections:', error)
      setError('Failed to load collections')
      toast.error('Failed to load collections')
    } finally {
      setLoadingStates(prev => ({ ...prev, loading: false }))
    }
  }, [supabase])

  useEffect(() => {
    loadAllCollections()
  }, [loadAllCollections])

  // Keep selection aligned with currently visible items.
  useEffect(() => {
    setSelectedItems((prev) => {
      if (prev.size === 0) return prev
      const visibleIds = new Set(currentItems.map((item) => item.id))
      const next = new Set(Array.from(prev).filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [currentItems])

  // Keep selected photos aligned with currently loaded collection photos.
  useEffect(() => {
    setSelectedPhotos((prev) => {
      if (prev.size === 0) return prev
      const visibleIds = new Set(collectionPhotos.map((photo) => photo.id))
      const next = new Set(Array.from(prev).filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [collectionPhotos])

  // Update current items when path or collections change
  useEffect(() => {
    updateCurrentItems()
    loadCollectionPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, allCollections, searchQuery])

  // Performance: render photos incrementally for very large albums.
  useEffect(() => {
    setPhotoRenderCount(120)
  }, [currentPath, collectionPhotos.length])

  const renderedCollectionPhotos = useMemo(
    () => collectionPhotos.slice(0, photoRenderCount),
    [collectionPhotos, photoRenderCount]
  )

  const handleSetAsCover = async (photo: Photo) => {
    const currentCollectionId = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null
    if (!currentCollectionId) return

    try {
      const { error } = await supabase
        .from('collections')
        .update({ cover_image_url: photo.image_url })
        .eq('id', currentCollectionId)

      if (error) throw error

      toast.success(`Set "${photo.title}" as album cover`)
      await revalidatePublicPaths(['/', '/gallery', getCurrentCollectionPublicPath()].filter(Boolean) as string[])
      await loadAllCollections()
    } catch (err) {
      console.error('Error setting cover image:', err)
      toast.error('Failed to set album cover')
    }
  }

  const updateCurrentItems = useCallback(() => {
    const isRoot = currentPath.length === 0
    const currentFolderId = !isRoot ? currentPath[currentPath.length - 1] : null

    // Get subfolders
    const subfolders = allCollections
      .filter(collection => {
        if (isRoot) {
          return !collection.parent_id || collection.parent_id.trim() === ''
        }
        return collection.parent_id === currentFolderId
      })
      .map(collection => ({
        id: collection.id,
        name: collection.title,
        type: 'folder' as ItemType,
        modified: new Date(collection.created_at).toLocaleDateString(),
        data: collection
      }))

    // Get photos in current folder (if it's a collection)
    const photos: FileExplorerItem[] = []

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
      // Get all photos associated with this collection in batches
      const allLoadedPhotos: Photo[] = []
      let from = 0
      const PAGE_SIZE = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('collection_photos')
          .select(`
            order,
            photos (*)
          `)
          .eq('collection_id', currentCollectionId)
          .order('order', { ascending: true })
          .range(from, from + PAGE_SIZE - 1)

        if (error) throw error

        if (data && data.length > 0) {
          const batchPhotos: Photo[] = []
          for (const row of data as unknown as { order: number; photos: Photo | Photo[] | null }[]) {
            if (!row.photos) continue
            const photo = Array.isArray(row.photos) ? row.photos[0] : row.photos
            if (photo && photo.id) {
              batchPhotos.push(photo)
            }
          }
          allLoadedPhotos.push(...batchPhotos)

          if (data.length < PAGE_SIZE) {
            hasMore = false
          } else {
            from += PAGE_SIZE
          }
        } else {
          hasMore = false
        }
      }

      setCollectionPhotos(allLoadedPhotos)
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
    setSelectedPhotos(new Set())
  }

  const openFolder = (folderId: string) => {
    setCurrentPath([...currentPath, folderId])
    setSelectedItems(new Set())
    setSelectedPhotos(new Set())
  }

  const goUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
      setSelectedItems(new Set())
      setSelectedPhotos(new Set())
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
      await revalidatePublicPaths(['/', '/gallery'])
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
      await revalidatePublicPaths(['/', '/gallery'])
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
      await revalidatePublicPaths(['/', '/gallery'])
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
      await revalidatePublicPaths(['/', '/gallery'])
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

  const handleDeleteItem = (itemId: string) => {
    const col = allCollections.find(c => c.id === itemId)
    const title = col?.title || 'this album'
    setConfirmAction({
      title: 'Delete Album',
      description: `Are you sure you want to delete "${title}"? Any nested sub-albums will be moved to the root level.`,
      confirmText: 'Delete Album',
      action: async () => {
        await deleteItems([itemId])
      }
    })
  }

  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return
    setConfirmAction({
      title: 'Delete Selected Albums',
      description: `Are you sure you want to delete ${selectedItems.size} album${selectedItems.size > 1 ? 's' : ''}?`,
      confirmText: 'Delete Albums',
      action: async () => {
        await deleteItems(Array.from(selectedItems))
      }
    })
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
      await revalidatePublicPaths(['/', '/gallery'])
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
      await revalidatePublicPaths(
        ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
      )
      setShowPhotoUpload(false)
      await loadCollectionPhotos()
      await loadAllCollections()
    } catch (error: unknown) {
      console.error('Error adding photos to collection:', error)
      toast.error('Failed to add photos to collection')
    }
  }

  const removePhotoFromCollection = (photoId: string) => {
    setConfirmAction({
      title: 'Remove Photo from Album',
      description: 'Are you sure you want to remove this photo from this collection? The original photo will remain in your global media library.',
      confirmText: 'Remove Photo',
      action: async () => {
        const { error } = await supabase
          .from('collection_photos')
          .delete()
          .eq('photo_id', photoId)
          .eq('collection_id', currentPath[currentPath.length - 1])

        if (error) throw error

        toast.success('Photo removed from collection')
        await revalidatePublicPaths(
          ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
        )
        setSelectedPhotos((prev) => {
          if (!prev.has(photoId)) return prev
          const next = new Set(prev)
          next.delete(photoId)
          return next
        })
        await loadCollectionPhotos()
        await loadAllCollections()
      }
    })
  }

  const permanentlyDeletePhoto = (photo: Photo) => {
    setConfirmAction({
      title: 'Delete Photo Permanently',
      description: `Permanently delete "${photo.title}"? This photo will be removed from Cloudinary and all albums. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      action: async () => {
        try {
          setLoadingStates(prev => ({ ...prev, deleting: true }))

          const cloudinaryResponse = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds: [photo.image_id] }),
          })

          if (!cloudinaryResponse.ok) {
            throw new Error('Failed to delete image from Cloudinary')
          }

          const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', photo.id)

          if (error) throw error

          toast.success('Photo permanently deleted')
          await revalidatePublicPaths(
            ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
          )
          await loadCollectionPhotos()
          await loadAllCollections()
        } catch (error: unknown) {
          console.error('Permanent photo delete error:', error)
          toast.error('Failed to permanently delete photo')
        } finally {
          setLoadingStates(prev => ({ ...prev, deleting: false }))
        }
      }
    })
  }

  const removeSelectedPhotosFromCollection = () => {
    if (selectedPhotos.size === 0 || currentPath.length === 0) return

    setConfirmAction({
      title: 'Remove Photos from Album',
      description: `Are you sure you want to remove ${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} from this collection?`,
      confirmText: 'Remove Photos',
      action: async () => {
        try {
          setLoadingStates(prev => ({ ...prev, deleting: true }))

          const { error } = await supabase
            .from('collection_photos')
            .delete()
            .eq('collection_id', currentPath[currentPath.length - 1])
            .in('photo_id', Array.from(selectedPhotos))

          if (error) throw error

          toast.success(`${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''} removed from collection`)
          await revalidatePublicPaths(
            ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
          )
          setSelectedPhotos(new Set())
          await loadCollectionPhotos()
          await loadAllCollections()
        } catch (error: unknown) {
          console.error('Error removing selected photos:', error)
          toast.error('Failed to remove selected photos')
        } finally {
          setLoadingStates(prev => ({ ...prev, deleting: false }))
        }
      }
    })
  }

  const permanentlyDeleteSelectedPhotos = () => {
    if (selectedPhotos.size === 0) return

    const selectedPhotoRows = collectionPhotos.filter((photo) => selectedPhotos.has(photo.id))
    if (selectedPhotoRows.length === 0) return

    setConfirmAction({
      title: 'Delete Photos Permanently',
      description: `Permanently delete ${selectedPhotoRows.length} photo${selectedPhotoRows.length > 1 ? 's' : ''}? This will delete them from Cloudinary and all albums. This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      action: async () => {
        try {
          setLoadingStates(prev => ({ ...prev, deleting: true }))
          setPhotoDeleteProgress({ current: 0, total: selectedPhotoRows.length })

          const CHUNK_SIZE = 25
          for (let start = 0; start < selectedPhotoRows.length; start += CHUNK_SIZE) {
            const chunk = selectedPhotoRows.slice(start, start + CHUNK_SIZE)
            const publicIds = chunk
              .map((photo) => photo.image_id)
              .filter((id): id is string => Boolean(id))

            const cloudinaryResponse = await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicIds }),
            })

            if (!cloudinaryResponse.ok) {
              throw new Error('Failed to delete one or more images from Cloudinary')
            }

            const photoIds = chunk.map((photo) => photo.id)
            const { error } = await supabase
              .from('photos')
              .delete()
              .in('id', photoIds)

            if (error) throw error

            setPhotoDeleteProgress({ current: Math.min(start + chunk.length, selectedPhotoRows.length), total: selectedPhotoRows.length })
          }

          toast.success(`${selectedPhotoRows.length} photo${selectedPhotoRows.length > 1 ? 's' : ''} permanently deleted`)
          await revalidatePublicPaths(
            ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
          )
          setSelectedPhotos(new Set())
          await loadCollectionPhotos()
          await loadAllCollections()
        } catch (error: unknown) {
          console.error('Permanent selected photo delete error:', error)
          toast.error('Failed to permanently delete selected photos')
        } finally {
          setLoadingStates(prev => ({ ...prev, deleting: false }))
          setPhotoDeleteProgress(null)
        }
      }
    })
  }

  const toggleSelectAllPhotos = () => {
    if (collectionPhotos.length === 0) return
    if (selectedPhotos.size === collectionPhotos.length) {
      setSelectedPhotos(new Set())
      return
    }
    setSelectedPhotos(new Set(collectionPhotos.map((photo) => photo.id)))
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
      await revalidatePublicPaths(
        ['/', '/gallery', getCurrentCollectionPublicPath()].filter((path): path is string => Boolean(path))
      )
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
    const selectableIds = currentItems
      .filter((item) => item.type === 'folder')
      .map((item) => item.id)

    if (selectableIds.length > 0 && selectedItems.size === selectableIds.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(selectableIds))
    }
  }

  const openCoverImageSelector = async () => {
    if (!editingItem || editingItem.type !== 'folder') {
      setShowImageSelector(true)
      return
    }

    try {
      setCoverImagesLoading(true)
      setShowImageSelector(true)

      const [allPhotosResult, collectionPhotosResult] = await Promise.all([
        supabase
          .from('photos')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('collection_photos')
          .select(`
            photos (*)
          `)
          .eq('collection_id', editingItem.id)
          .order('order', { ascending: true })
      ])

      if (allPhotosResult.error) throw allPhotosResult.error
      if (collectionPhotosResult.error) throw collectionPhotosResult.error

      const inCollection = (collectionPhotosResult.data as unknown as CollectionPhotoWithPhoto[] | null)
        ?.map((item) => item.photos)
        .filter(Boolean) || []

      setCoverCollectionImages(inCollection)
      setCoverAllImages(allPhotosResult.data || [])
    } catch (error) {
      console.error('Error loading cover selector images:', error)
      toast.error('Failed to load images for cover selection')
      setCoverCollectionImages([])
      setCoverAllImages([])
    } finally {
      setCoverImagesLoading(false)
    }
  }




  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 shadow-sm">
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
            onClick={loadAllCollections}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {currentPath.length > 0 ? (currentPathNames[currentPathNames.length - 1] || 'Album') : 'Albums & Collections'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {currentPath.length > 0
              ? `Manage photos, sub-albums, and album settings`
              : `Organize your photo albums, manage cover images, and homepage featured albums`}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentPath.length === 0 ? (
            <>
              <Button
                onClick={() => setShowFeaturedOrder(true)}
                size="sm"
                variant="outline"
                className="rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 h-9 text-xs sm:text-sm"
              >
                <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-300" />
                Featured Order
              </Button>
              <Button
                onClick={() => setShowCreateFolder(true)}
                size="sm"
                className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold h-9 text-xs sm:text-sm px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Album
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={goUp}
                size="sm"
                variant="outline"
                className="rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 h-9 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={() => setShowPhotoUpload(true)}
                size="sm"
                className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold h-9 text-xs sm:text-sm px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Upload Photos
              </Button>
              <Button
                onClick={() => setShowCreateFolder(true)}
                size="sm"
                variant="outline"
                className="rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white h-9 text-xs sm:text-sm"
              >
                <Folder className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                New Sub-Album
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Navigation & Search Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Navigation & Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={goUp}
                disabled={currentPath.length === 0}
                className="h-9 w-9 p-0 rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
                title="Go back up"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToPath(0)}
                className={`h-9 w-9 p-0 rounded-xl border-zinc-800 ${currentPath.length === 0 ? 'bg-zinc-800 text-white' : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                title="Root Albums"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllCollections}
                disabled={loadingStates.loading}
                className="h-9 w-9 p-0 rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                title="Refresh albums"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStates.loading ? 'animate-spin text-white' : ''}`} />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-zinc-800 hidden sm:block" />

            {/* Breadcrumb Path */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none py-1">
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap text-xs sm:text-sm">
                  {currentPathNames.map((name: string, index: number) => {
                    const isLast = index === currentPathNames.length - 1
                    return (
                      <div key={index} className="flex items-center shrink-0">
                        {index > 0 && <BreadcrumbSeparator className="text-zinc-600 mx-1.5" />}
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="font-semibold text-white truncate max-w-[160px] sm:max-w-[240px]">
                              {name}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              className="cursor-pointer text-zinc-400 hover:text-white transition-colors truncate max-w-[120px] sm:max-w-[180px]"
                              onClick={() => navigateToPath(index)}
                            >
                              {name}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Right: Search & View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full sm:w-56 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Filter albums & photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl border-zinc-800 bg-zinc-900/80 text-white placeholder:text-zinc-500 focus:border-zinc-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-transparent'}`}
                title="Grid view"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white hover:bg-transparent'}`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Album Selection Toolbar */}
      {selectedItems.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-700 bg-zinc-900/90 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
              {selectedItems.size}
            </span>
            <span>{selectedItems.size === 1 ? 'Album' : 'Albums'} selected</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkMoveDialog(true)}
              className="flex-1 sm:flex-none rounded-xl border-zinc-700 hover:bg-zinc-800 text-xs h-8"
            >
              <MoveRight className="w-3.5 h-3.5 mr-1.5" />
              Move To...
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex-1 sm:flex-none rounded-xl text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete ({selectedItems.size})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
              className="rounded-xl text-xs text-zinc-400 hover:text-white h-8"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div>
        {/* If inside an album: Render Album Hero Header */}
        {currentPath.length > 0 && (() => {
          const currentFolderId = currentPath[currentPath.length - 1]
          const currentCollection = allCollections.find(c => c.id === currentFolderId)
          const subfolders = currentItems.filter(item => item.type === 'folder')

          return (
            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Cover thumbnail or Folder icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative shadow-md">
                    {currentCollection?.cover_image_url ? (
                      <Image src={currentCollection.cover_image_url} alt={currentCollection.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-gradient-to-b from-zinc-900 to-zinc-950">
                        <Folder className="w-7 h-7 text-zinc-500" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                        {currentCollection?.title || 'Album'}
                      </h2>
                      {currentCollection?.featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-amber-300" /> Featured on Home
                        </span>
                      )}
                    </div>
                    {currentCollection?.description && (
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-1">
                        {currentCollection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1.5 flex-wrap">
                      <span className="text-white font-medium">{collectionPhotos.length} {collectionPhotos.length === 1 ? 'photo' : 'photos'}</span>
                      {subfolders.length > 0 && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span>{subfolders.length} {subfolders.length === 1 ? 'sub-album' : 'sub-albums'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Button
                    onClick={() => {
                      if (currentCollection) {
                        setEditingItem({
                          id: currentCollection.id,
                          name: currentCollection.title,
                          type: 'folder',
                          data: currentCollection
                        })
                        setEditFormData({
                          title: currentCollection.title,
                          description: currentCollection.description || '',
                          cover_image_url: currentCollection.cover_image_url || '',
                          parent_id: currentCollection.parent_id || '',
                          featured: currentCollection.featured || false
                        })
                        setShowEditDialog(true)
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-zinc-800 hover:bg-zinc-900 h-9 text-xs sm:text-sm"
                  >
                    <Settings className="w-4 h-4 mr-1.5 text-zinc-400" />
                    Album Settings
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Loading State */}
        {loadingStates.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-zinc-800/60" />
                <div className="p-3.5 space-y-2 bg-zinc-950/80">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Sub-Albums Section (or Root Albums when at root) */}
            {currentItems.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-zinc-500" />
                      {currentPath.length > 0
                        ? `Sub-Albums (${currentItems.filter(i => i.type === 'folder').length})`
                        : `Albums & Collections (${currentItems.filter(i => i.type === 'folder').length})`}
                    </h3>
                    {currentItems.filter(i => i.type === 'folder').length > 1 && (
                      <Button
                        onClick={toggleSelectAll}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-zinc-800 hover:bg-zinc-900 h-7 text-xs px-2.5 text-zinc-300"
                      >
                        {selectedItems.size > 0 && selectedItems.size === currentItems.filter(i => i.type === 'folder').length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                    )}
                  </div>
                  {currentPath.length > 0 && (
                    <Button
                      onClick={() => setShowCreateFolder(true)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-zinc-400 hover:text-white h-7"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      New Sub-Album
                    </Button>
                  )}
                </div>

                {viewMode === 'grid' ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={currentItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {currentItems.map((item) => (
                          <SortableCollectionItem
                            key={item.id}
                            item={item}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            dragDisabled={
                              item.type !== 'folder' ||
                              searchQuery.trim().length > 0 ||
                              selectedItems.size > 0 ||
                              loadingStates.renaming ||
                              loadingStates.deleting
                            }
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
                            onDelete={(itemId) => handleDeleteItem(itemId)}
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
                  <div className="space-y-2">
                    {currentItems.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={`flex items-center gap-3 p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-colors duration-150 ${
                              selectedItems.has(item.id) ? 'bg-zinc-800 border-white/40 shadow' : ''
                            }`}
                            onClick={() => {
                              if (item.type === 'folder') {
                                openFolder(item.id)
                              }
                            }}
                          >
                            {item.type === 'folder' ? (
                              item.data && 'cover_image_url' in item.data && item.data.cover_image_url ? (
                                <div className="w-10 h-10 flex-shrink-0 relative overflow-hidden rounded-xl border border-zinc-800">
                                  <Image
                                    src={item.data.cover_image_url}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                                  <Folder className="w-5 h-5" />
                                </div>
                              )
                            ) : (
                              <FileImage className="w-10 h-10 text-zinc-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                              <p className="text-xs text-zinc-400">
                                {(item.data as EnhancedCollection)?.totalPhotoCount ?? 0} photos
                              </p>
                            </div>
                            <span className="text-xs text-zinc-500 mr-2">
                              {item.modified}
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-600" />
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="border-zinc-800 bg-zinc-950 text-white">
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
                            Edit Album
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
                            <Layers className="w-4 h-4 mr-2" />
                            Properties
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-zinc-800" />
                          <ContextMenuItem
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-950/50"
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
            )}

            {/* Photos Section (When viewing inside an album) */}
            {currentPath.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-zinc-500" />
                      Photos in Album ({collectionPhotos.length})
                    </h3>
                    {collectionPhotos.length > 0 && (
                      <Button
                        onClick={toggleSelectAllPhotos}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-zinc-800 hover:bg-zinc-900 h-7 text-xs px-2.5 text-zinc-300"
                      >
                        {selectedPhotos.size === collectionPhotos.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>

                  {selectedPhotos.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={removeSelectedPhotosFromCollection}
                        size="sm"
                        variant="outline"
                        disabled={loadingStates.deleting}
                        className="rounded-xl border-zinc-800 hover:bg-zinc-900 h-8 text-xs text-amber-400 hover:text-amber-300"
                      >
                        {loadingStates.deleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Remove Selected ({selectedPhotos.size})
                      </Button>
                      <Button
                        onClick={permanentlyDeleteSelectedPhotos}
                        size="sm"
                        variant="destructive"
                        disabled={loadingStates.deleting}
                        className="rounded-xl h-8 text-xs"
                      >
                        {loadingStates.deleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        {photoDeleteProgress
                          ? `Deleting ${photoDeleteProgress.current}/${photoDeleteProgress.total}`
                          : `Delete Permanently (${selectedPhotos.size})`}
                      </Button>
                    </div>
                  )}
                </div>

                {collectionPhotos.length === 0 ? (
                  currentItems.length === 0 ? (
                    /* Completely Empty Album */
                    <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
                        <Folder className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-semibold text-white mb-1">This album is empty</h3>
                      <p className="text-sm text-zinc-400 max-w-sm mb-6">
                        Upload your first photos to this album or create sub-albums to organize your content.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setShowPhotoUpload(true)}
                          className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-xs sm:text-sm px-5"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Photos
                        </Button>
                        <Button
                          onClick={() => setShowCreateFolder(true)}
                          variant="outline"
                          className="rounded-xl border-zinc-800 hover:bg-zinc-900 text-xs sm:text-sm px-5"
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          New Sub-Album
                        </Button>
                      </div>
                    </div>
                  ) : null
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {renderedCollectionPhotos.map((photo) => {
                        const currentFolderId = currentPath[currentPath.length - 1]
                        const currentCollection = allCollections.find(c => c.id === currentFolderId)
                        const isCover = currentCollection?.cover_image_url === photo.image_url
                        const isSelected = selectedPhotos.has(photo.id)

                        return (
                          <ContextMenu key={photo.id}>
                            <ContextMenuTrigger asChild>
                              <div className={`relative group aspect-[4/3] rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'border-white/60 bg-zinc-900 shadow-lg ring-1 ring-white/40'
                                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:shadow-xl'
                              }`}>
                                {/* Checkbox */}
                                <div className="absolute top-2 left-2 z-20">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedPhotos((prev) => {
                                        const next = new Set(prev)
                                        if (next.has(photo.id)) next.delete(photo.id)
                                        else next.add(photo.id)
                                        return next
                                      })
                                    }}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-white border-white text-black shadow-md'
                                        : 'border-white/40 bg-black/40 text-transparent hover:border-white backdrop-blur-sm'
                                    }`}
                                    aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                                  >
                                    <Check className={`w-3 h-3 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                  </button>
                                </div>

                                {/* Thumbnail */}
                                <Image
                                  src={getThumbnailUrl(photo.image_id, 450)}
                                  alt={photo.alt || photo.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                />

                                {/* Top-Right Badges */}
                                <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                                  {isCover && (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                                      <Star className="w-2.5 h-2.5 fill-emerald-300" /> Cover
                                    </span>
                                  )}
                                  {(photo.camera || photo.settings) && (
                                    <div className="bg-black/60 text-zinc-300 border border-white/20 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                                      <Camera className="w-2.5 h-2.5 text-zinc-400" />
                                      <span>EXIF</span>
                                    </div>
                                  )}
                                </div>

                                {/* Hover Action Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px] z-10">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedPhoto(photo)
                                      setShowPhotoPreview(true)
                                    }}
                                    className="h-8 w-8 rounded-xl bg-zinc-800/90 text-white hover:bg-zinc-700 border border-zinc-700 shadow-md"
                                    title="Preview Fullscreen"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSetAsCover(photo)
                                    }}
                                    className="h-8 w-8 rounded-xl bg-zinc-800/90 text-white hover:bg-zinc-700 border border-zinc-700 shadow-md"
                                    title="Set as Album Cover"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingPhoto({...photo})
                                      setShowPhotoEdit(true)
                                    }}
                                    className="h-8 w-8 rounded-xl bg-zinc-800/90 text-white hover:bg-zinc-700 border border-zinc-700 shadow-md"
                                    title="Edit Details"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removePhotoFromCollection(photo.id)
                                    }}
                                    className="h-8 w-8 rounded-xl bg-red-900/80 text-red-200 hover:bg-red-800 border border-red-700 shadow-md"
                                    title="Remove from Album"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                {/* Bottom Info Banner */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-6 z-10 pointer-events-none">
                                  <p className="text-white text-xs truncate font-medium">{photo.title}</p>
                                  {photo.camera && (
                                    <p className="text-zinc-400 text-[11px] truncate mt-0.5">{photo.camera}</p>
                                  )}
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="border-zinc-800 bg-zinc-950 text-white">
                              <ContextMenuItem onClick={() => {
                                setSelectedPhoto(photo)
                                setShowPhotoPreview(true)
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Fullscreen
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => handleSetAsCover(photo)}>
                                <ImageIcon className="w-4 h-4 mr-2 text-amber-400" />
                                Set as Album Cover
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => {
                                setEditingPhoto({...photo})
                                setShowPhotoEdit(true)
                              }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Details
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => window.open(photo.image_url, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Original
                              </ContextMenuItem>
                              <ContextMenuSeparator className="bg-zinc-800" />
                              <ContextMenuItem
                                onClick={() => removePhotoFromCollection(photo.id)}
                                className="text-amber-400 focus:text-amber-300 focus:bg-amber-950/50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove from Collection
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => permanentlyDeletePhoto(photo)}
                                className="text-red-400 focus:text-red-300 focus:bg-red-950/50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        )
                      })}
                    </div>

                    {collectionPhotos.length > renderedCollectionPhotos.length && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setPhotoRenderCount((prev) => prev + 120)}
                          className="rounded-xl border-zinc-800 hover:bg-zinc-900"
                        >
                          Load More ({collectionPhotos.length - renderedCollectionPhotos.length} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Root Empty State (when 0 root albums exist) */}
            {currentPath.length === 0 && currentItems.length === 0 && (
              <div className="p-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center my-8">
                <Folder className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-1">
                  {searchQuery ? 'No albums match your search' : 'No albums created yet'}
                </h3>
                <p className="text-sm text-zinc-400 max-w-sm mb-6">
                  {searchQuery ? 'Try searching for a different keyword or clear the filter.' : 'Create your first album to begin organizing your photography galleries.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateFolder(true)}
                    className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Album
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {/* Create Folder Dialog */}
      {/* Featured Order Dialog */}
      <Dialog open={showFeaturedOrder} onOpenChange={setShowFeaturedOrder}>
        <DialogContent className="sm:max-w-[540px] max-h-[85vh] p-0 flex flex-col overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl">
          <DialogHeader className="p-5 pb-4 border-b border-zinc-800">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Featured Albums Order
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
              Reorder albums to control how they appear on the homepage grid (up to 9 featured albums).
            </DialogDescription>
          </DialogHeader>

          {/* Single clean scrollable list */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[55vh] space-y-2.5">
            {(() => {
              const featuredItems = allCollections
                .filter(c => c.featured && !c.parent_id)
                .sort((a, b) => (a.order || 0) - (b.order || 0))

              if (featuredItems.length === 0) {
                return (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30">
                    <Star className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
                    <p className="text-sm font-semibold text-white">No featured albums</p>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Mark albums as &quot;Featured on Home&quot; in Album Settings to showcase them on your homepage.
                    </p>
                  </div>
                )
              }

              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleFeaturedDragEnd}
                >
                  <SortableContext
                    items={featuredItems.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {featuredItems.map((c, idx) => (
                        <SortableFeaturedItem
                          key={c.id}
                          collection={c}
                          index={idx}
                          total={featuredItems.length}
                          onMoveUp={() => moveFeaturedItem(idx, 'up')}
                          onMoveDown={() => moveFeaturedItem(idx, 'down')}
                          onUnfeature={() => handleUnfeature(c)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )
            })()}
          </div>

          <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-zinc-800 bg-zinc-950 flex flex-row items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {allCollections.filter(c => c.featured && !c.parent_id).length} of 9 featured slots used
            </span>
            <Button
              onClick={() => setShowFeaturedOrder(false)}
              className="rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-xs sm:text-sm px-5 h-9"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Enter a name for the new album collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-sm font-medium text-zinc-200">Album Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Landscapes 2026"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFolder()
                  }
                }}
                autoFocus
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
                className="rounded-xl border-zinc-800 hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || loadingStates.creating}
                className="rounded-xl bg-white text-black hover:bg-zinc-200"
              >
                {loadingStates.creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Album
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

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rename-input" className="text-sm font-medium text-zinc-200">New Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameItem()
                  }
                }}
                autoFocus
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
                className="rounded-xl border-zinc-800 hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={renameItem}
                disabled={!renameValue.trim() || loadingStates.renaming}
                className="rounded-xl bg-white text-black hover:bg-zinc-200"
              >
                {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
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
                    <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden rounded-xl border border-zinc-800">
                      <Image
                        src={propertiesItem.data.cover_image_url}
                        alt={propertiesItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Folder className="w-10 h-10 text-zinc-400" />
                  )
                ) : (
                  <FileImage className="w-10 h-10 text-zinc-400" />
                )}
                <div>
                  <h3 className="font-semibold text-white">{propertiesItem.name}</h3>
                  <p className="text-xs text-zinc-400 capitalize">
                    {propertiesItem.type}
                  </p>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Type:</span>
                  <span className="text-sm font-medium text-white capitalize">
                    {propertiesItem.type}
                  </span>
                </div>

                {propertiesItem.modified && (
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-400">Modified:</span>
                    <span className="text-sm font-medium text-white">
                      {propertiesItem.modified}
                    </span>
                  </div>
                )}

                {propertiesItem.size && (
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-400">Size:</span>
                    <span className="text-sm font-medium text-white">
                      {propertiesItem.size} bytes
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowProperties(false)}
              className="rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-zinc-800">
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update collection settings, hierarchy, and cover imagery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto px-5 py-4 sm:px-6 sm:py-6 flex-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm font-medium text-zinc-200">Title *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Collection Title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium text-zinc-200">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Optional brief description of this album..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-parent" className="text-sm font-medium text-zinc-200">Parent Album</Label>
                <Select
                  value={editFormData.parent_id || 'none'}
                  onValueChange={(value) => setEditFormData({ ...editFormData, parent_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white rounded-xl">
                    <SelectValue placeholder="Select parent (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="none">Root level (No parent)</SelectItem>
                    {allCollections
                      .filter(collection => editingItem ? collection.id !== editingItem.id : true)
                      .map(collection => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cover Image Section */}
            <div className="space-y-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/70">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-cover" className="text-sm font-medium text-zinc-200">Cover Image</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCoverImageSelector}
                  className="rounded-lg h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                >
                  Browse Photos
                </Button>
              </div>

              <Input
                id="edit-cover"
                value={editFormData.cover_image_url}
                onChange={(e) => setEditFormData({ ...editFormData, cover_image_url: e.target.value })}
                placeholder="https://... or choose from gallery"
              />

              <div className="rounded-xl border border-zinc-800/80 p-3 bg-zinc-950/50">
                <p className="text-xs text-zinc-400 mb-2 font-medium">
                  Upload new cover photo:
                </p>
                <CloudinaryUpload
                  currentImageUrl={editFormData.cover_image_url || undefined}
                  cropAspect={3/2}
                  onUploadComplete={(data) => {
                    setEditFormData((prev) => ({ ...prev, cover_image_url: data.image_url }))
                    toast.success('Cover image uploaded')
                  }}
                  folder={
                    editingItem && editingItem.type === 'folder'
                      ? getCollectionFolder(editingItem.data as Collection)
                      : 'rithychanvirak/covers'
                  }
                />
              </div>

              {editFormData.cover_image_url && (
                <div className="relative aspect-[3/2] w-36 rounded-lg overflow-hidden border border-zinc-800 mt-2">
                  <Image
                    src={editFormData.cover_image_url}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Featured Setting */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="space-y-0.5">
                <Label htmlFor="featured-toggle" className="text-sm font-medium text-white cursor-pointer">
                  Featured on Homepage
                </Label>
                <p className="text-xs text-zinc-400">
                  Highlight this album in the homepage curated portfolio
                </p>
              </div>
              <Switch
                id="featured-toggle"
                checked={editFormData.featured}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, featured: checked })}
              />
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setEditingItem(null)
                setEditFormData({ title: '', description: '', cover_image_url: '', parent_id: '', featured: false })
              }}
              className="rounded-xl border-zinc-800 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={editItem}
              disabled={!editFormData.title.trim() || loadingStates.renaming}
              className="rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              {loadingStates.renaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Selector Dialog */}
      <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-zinc-800">
            <DialogTitle>Select Cover Image</DialogTitle>
            <DialogDescription>
              Choose a cover photo from this album or across all portfolio uploads.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-5 py-4 sm:px-6 overflow-y-auto">
            {coverImagesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                <p className="text-sm">Loading portfolio images...</p>
              </div>
            ) : (
              <Tabs defaultValue={coverCollectionImages.length > 0 ? "current" : "all"} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="current">
                    In This Album ({coverCollectionImages.length})
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All Photos ({coverAllImages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                  {coverCollectionImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {coverCollectionImages.map((photo) => {
                        const isSelected = editFormData.cover_image_url === photo.image_url
                        return (
                          <div
                            key={`collection-${photo.id}`}
                            className={`group relative aspect-[4/3] cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-white shadow-lg ring-2 ring-white/20'
                                : 'border-zinc-800 hover:border-zinc-500'
                            }`}
                            onClick={() => {
                              setEditFormData((prev) => ({ ...prev, cover_image_url: photo.image_url }))
                              setShowImageSelector(false)
                            }}
                          >
                            <Image
                              src={photo.image_url}
                              alt={photo.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-white text-black p-1 rounded-full shadow-md z-10">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                              <p className="text-xs text-white truncate font-medium">{photo.title}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-zinc-500">
                      No photos uploaded directly into this album yet. Switch to &ldquo;All Photos&rdquo; to choose from the global library.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all">
                  {coverAllImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {coverAllImages.map((photo) => {
                        const isSelected = editFormData.cover_image_url === photo.image_url
                        return (
                          <div
                            key={`all-${photo.id}`}
                            className={`group relative aspect-[4/3] cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-white shadow-lg ring-2 ring-white/20'
                                : 'border-zinc-800 hover:border-zinc-500'
                            }`}
                            onClick={() => {
                              setEditFormData((prev) => ({ ...prev, cover_image_url: photo.image_url }))
                              setShowImageSelector(false)
                            }}
                          >
                            <Image
                              src={photo.image_url}
                              alt={photo.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-white text-black p-1 rounded-full shadow-md z-10">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                              <p className="text-xs text-white truncate font-medium">{photo.title}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-sm text-zinc-500">
                      No photos found in the library.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className="px-5 py-3 sm:px-6 border-t border-zinc-800 bg-zinc-950 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageSelector(false)}
              className="rounded-xl border-zinc-800 hover:bg-zinc-900"
            >
              Cancel
            </Button>
          </div>
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full sm:max-w-6xl sm:max-h-[90vh] p-4 sm:p-6 overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-base sm:text-lg lg:text-xl">{selectedPhoto?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              Photo details and metadata
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 sm:gap-6">
              {/* Image */}
              <div className="relative h-[48vh] sm:h-[56vh] lg:h-[68vh] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getOptimizedImageUrl(selectedPhoto.image_id, 1800)}
                  alt={selectedPhoto.alt || selectedPhoto.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Metadata Sidebar */}
              <div className="w-full min-w-0 space-y-6 overflow-y-auto pr-1 lg:max-h-[68vh]">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Title:</span>
                      <span className="text-sm font-medium text-right truncate">{selectedPhoto.title}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Dimensions:</span>
                      <span className="text-sm font-medium text-right">{selectedPhoto.image_width} x {selectedPhoto.image_height}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-sm text-muted-foreground">Date Taken:</span>
                      <span className="text-sm font-medium text-right">
                        {selectedPhoto.date_taken ? new Date(selectedPhoto.date_taken).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    {selectedPhoto.location && (
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm font-medium text-right truncate">{selectedPhoto.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Camera Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Camera Settings</h3>
                  <div className="space-y-3">
                    {selectedPhoto.camera && (
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Camera:</span>
                        <span className="text-sm font-medium text-right truncate">{selectedPhoto.camera}</span>
                      </div>
                    )}
                    {selectedPhoto.lens && (
                      <div className="flex justify-between gap-3">
                        <span className="text-sm text-muted-foreground">Lens:</span>
                        <span className="text-sm font-medium text-right truncate">{selectedPhoto.lens}</span>
                      </div>
                    )}
                    {selectedPhoto.settings && (
                      <>
                        {selectedPhoto.settings.aperture && (
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-muted-foreground">Aperture:</span>
                            <span className="text-sm font-medium text-right">{selectedPhoto.settings.aperture}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.shutter && (
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-muted-foreground">Shutter:</span>
                            <span className="text-sm font-medium text-right">{selectedPhoto.settings.shutter}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.iso && (
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-muted-foreground">ISO:</span>
                            <span className="text-sm font-medium text-right">{selectedPhoto.settings.iso}</span>
                          </div>
                        )}
                        {selectedPhoto.settings.focalLength && (
                          <div className="flex justify-between gap-3">
                            <span className="text-sm text-muted-foreground">Focal Length:</span>
                            <span className="text-sm font-medium text-right">{selectedPhoto.settings.focalLength}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {selectedPhoto.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground break-words">{selectedPhoto.description}</p>
                  </div>
                )}
              </div>
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
                        src={getOptimizedImageUrl(editingPhoto.image_id, 900)}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.title || 'Confirm Action'}
        description={confirmAction?.description || 'Are you sure you want to continue?'}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        variant="destructive"
        onConfirm={async () => {
          if (confirmAction) {
            await confirmAction.action()
          }
        }}
      />
    </div>
  )
}
