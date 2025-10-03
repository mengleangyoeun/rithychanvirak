import { DocumentActionComponent, useClient } from 'sanity'
import { TrashIcon } from '@sanity/icons'
import { useState, useEffect } from 'react'

interface Reference {
  _id: string
  _type: string
  title?: string
}

export const SafeDeleteAction: DocumentActionComponent = (props) => {
  const { id, type, onComplete } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [references, setReferences] = useState<Reference[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showForceMode, setShowForceMode] = useState(false)

  useEffect(() => {
    if (dialogOpen) {
      checkReferences()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen])

  const checkReferences = async () => {
    setIsChecking(true)
    try {
      let query = ''

      if (type === 'collection') {
        query = `{
          "subCollections": *[_type == "collection" && references($id)] {_id, _type, title},
          "photos": *[_type == "photo" && references($id)] {_id, _type, title}
        }`
      } else if (type === 'photo') {
        query = `*[references($id)] {_id, _type, title}`
      }

      const result = await client.fetch(query, { id })

      if (type === 'collection') {
        const allRefs = [...(result.subCollections || []), ...(result.photos || [])]
        setReferences(allRefs)
      } else {
        setReferences(result || [])
      }
    } catch (error) {
      console.error('Error checking references:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleForceDelete = async () => {
    if (confirmText !== 'DELETE ALL') {
      return
    }

    setIsDeleting(true)
    try {
      if (type === 'collection') {
        const subCollections = await client.fetch(
          `*[_type == "collection" && references($id)]._id`,
          { id }
        )

        for (const subId of subCollections) {
          const subPhotos = await client.fetch(
            `*[_type == "photo" && collection._ref == $subId]._id`,
            { subId }
          )
          for (const photoId of subPhotos) {
            await client.delete(photoId)
          }
          await client.delete(subId)
        }

        const photos = await client.fetch(
          `*[_type == "photo" && collection._ref == $id]._id`,
          { id }
        )
        for (const photoId of photos) {
          await client.delete(photoId)
        }
      }

      await client.delete(id)
      onComplete()
    } catch (error) {
      console.error('Force delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDelete = async () => {
    if (references.length > 0 && !showForceMode) {
      setShowForceMode(true)
      return
    }

    if (references.length > 0 && showForceMode) {
      await handleForceDelete()
      return
    }

    try {
      await client.delete(id)
      onComplete()
    } catch (error) {
      console.error('Delete error:', error)
    }
    setDialogOpen(false)
  }

  const getDialogMessage = () => {
    if (isChecking) return 'Checking for references...'

    if (references.length > 0 && showForceMode) {
      const refList = references.map(ref =>
        `${ref._type === 'collection' ? '📁' : '📸'} ${ref.title || ref._id}`
      ).join('\n')
      return `⚠️ FORCE DELETE\n\nThis will permanently delete this ${type} and ALL items below (${references.length} items):\n\n${refList}\n\nType "DELETE ALL" in the confirmation prompt to proceed.`
    }

    if (references.length > 0) {
      const refList = references.map(ref =>
        `${ref._type === 'collection' ? '📁 Sub-album' : '📸 Photo'}: ${ref.title || ref._id}`
      ).join('\n')
      return `This ${type} has ${references.length} reference${references.length === 1 ? '' : 's'}:\n\n${refList}\n\nClick "Show Force Delete" to delete everything, or cancel and delete references manually.`
    }

    return `Are you sure you want to delete this ${type}? This action cannot be undone.`
  }

  const getConfirmButtonText = () => {
    if (isChecking) return 'Checking...'
    if (showForceMode) return 'Force Delete All'
    if (references.length > 0) return 'Show Force Delete'
    return 'Delete'
  }

  return {
    label: 'Delete',
    icon: TrashIcon,
    tone: 'critical',
    onHandle: () => {
      setDialogOpen(true)
      setShowForceMode(false)
      setConfirmText('')
      checkReferences()
    },
    dialog: dialogOpen && {
      type: 'confirm',
      tone: 'critical',
      onCancel: () => {
        setDialogOpen(false)
        setShowForceMode(false)
        setConfirmText('')
      },
      onConfirm: async () => {
        if (references.length > 0 && !showForceMode) {
          setShowForceMode(true)
          return
        }

        if (references.length > 0 && showForceMode) {
          const userInput = prompt(`Type "DELETE ALL" to confirm deletion of ${references.length + 1} items:`)
          if (userInput !== 'DELETE ALL') {
            return
          }
          await handleForceDelete()
          return
        }

        await handleDelete()
      },
      message: getDialogMessage(),
      confirmButtonText: getConfirmButtonText()
    }
  }
}
