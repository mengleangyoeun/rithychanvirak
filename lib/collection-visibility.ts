export type CollectionType = 'main' | 'sub' | undefined

interface EmptyStateParams {
  loading: boolean
  collectionType: CollectionType
  childCollectionsCount: number
  photosCount: number
}

export function shouldShowPhotoGrid(loading: boolean, photosCount: number): boolean {
  return loading || photosCount > 0
}

export function shouldShowEmptyState({
  loading,
  childCollectionsCount,
  photosCount,
}: EmptyStateParams): boolean {
  if (loading) return false
  return childCollectionsCount === 0 && photosCount === 0
}
