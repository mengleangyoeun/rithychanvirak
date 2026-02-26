import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldShowEmptyState, shouldShowPhotoGrid } from '../lib/collection-visibility'

test('shows photo grid while loading', () => {
  assert.equal(shouldShowPhotoGrid(true, 0), true)
})

test('shows photo grid when photos exist', () => {
  assert.equal(shouldShowPhotoGrid(false, 5), true)
  assert.equal(shouldShowPhotoGrid(false, 0), false)
})

test('main collection empty state: only when no children and no photos', () => {
  assert.equal(
    shouldShowEmptyState({
      loading: false,
      collectionType: 'main',
      childCollectionsCount: 0,
      photosCount: 0,
    }),
    true
  )
  assert.equal(
    shouldShowEmptyState({
      loading: false,
      collectionType: 'main',
      childCollectionsCount: 1,
      photosCount: 0,
    }),
    false
  )
  assert.equal(
    shouldShowEmptyState({
      loading: false,
      collectionType: 'main',
      childCollectionsCount: 0,
      photosCount: 3,
    }),
    false
  )
})

test('sub collection empty state: only when no photos', () => {
  assert.equal(
    shouldShowEmptyState({
      loading: false,
      collectionType: 'sub',
      childCollectionsCount: 0,
      photosCount: 0,
    }),
    true
  )
  assert.equal(
    shouldShowEmptyState({
      loading: false,
      collectionType: 'sub',
      childCollectionsCount: 0,
      photosCount: 2,
    }),
    false
  )
})

test('never show empty state while loading', () => {
  assert.equal(
    shouldShowEmptyState({
      loading: true,
      collectionType: 'main',
      childCollectionsCount: 0,
      photosCount: 0,
    }),
    false
  )
})
