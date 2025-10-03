import { defineType, defineField } from 'sanity'

export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'Cloudinary image URL',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'imageId',
      title: 'Cloudinary Public ID',
      type: 'string',
      description: 'Used for image transformations',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'imageWidth',
      title: 'Image Width',
      type: 'number',
      description: 'Original image width in pixels'
    }),
    defineField({
      name: 'imageHeight',
      title: 'Image Height',
      type: 'number',
      description: 'Original image height in pixels'
    }),
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      description: 'Important for SEO and accessibility',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      description: 'The collection this photo belongs to (can be main collection or sub-album)',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Photo',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'captureDate',
      title: 'Capture Date',
      type: 'date'
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Where was this photo taken?'
    }),
    defineField({
      name: 'camera',
      title: 'Camera',
      type: 'string',
      description: 'Auto-filled from EXIF data if available'
    }),
    defineField({
      name: 'lens',
      title: 'Lens',
      type: 'string',
      description: 'Auto-filled from EXIF data if available'
    }),
    defineField({
      name: 'settings',
      title: 'Camera Settings',
      type: 'object',
      description: 'Auto-filled from EXIF data if available',
      fields: [
        { name: 'aperture', type: 'string', title: 'Aperture (f-stop)' },
        { name: 'shutter', type: 'string', title: 'Shutter Speed' },
        { name: 'iso', type: 'string', title: 'ISO' },
        { name: 'focalLength', type: 'string', title: 'Focal Length' }
      ]
    }),
    defineField({
      name: 'exifData',
      title: 'EXIF Metadata',
      type: 'object',
      description: 'Raw EXIF data from the image',
      readOnly: true,
      fields: [
        { name: 'make', type: 'string', title: 'Camera Make' },
        { name: 'model', type: 'string', title: 'Camera Model' },
        { name: 'lensModel', type: 'string', title: 'Lens Model' },
        { name: 'fNumber', type: 'number', title: 'F-Number' },
        { name: 'exposureTime', type: 'string', title: 'Exposure Time' },
        { name: 'iso', type: 'number', title: 'ISO' },
        { name: 'focalLength', type: 'number', title: 'Focal Length (mm)' },
        { name: 'dateTimeOriginal', type: 'string', title: 'Date Taken' },
        { name: 'software', type: 'string', title: 'Software' }
      ]
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order within the collection (lower numbers first)'
    })
  ],
  preview: {
    select: {
      title: 'title',
      imageUrl: 'imageUrl',
      imageId: 'imageId',
      collectionTitle: 'collection.title',
      featured: 'featured',
      order: 'order'
    },
    prepare({ title, imageUrl, imageId, collectionTitle, featured, order }) {
      const parts = []

      // Collection
      if (collectionTitle) {
        parts.push(`📁 ${collectionTitle}`)
      } else {
        parts.push('⚠️ No collection')
      }

      // Featured badge
      if (featured) {
        parts.push('⭐ Featured')
      }

      // Order number
      if (order !== undefined) {
        parts.push(`#${order}`)
      }

      return {
        title: title,
        subtitle: parts.join(' • '),
        imageUrl: imageId
          ? `https://res.cloudinary.com/dzu1sie4g/image/upload/c_thumb,w_200,h_200,g_auto/${imageId}`
          : imageUrl
      }
    }
  },
  orderings: [
    {
      title: '🎯 By Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    },
    {
      title: '📁 By Collection',
      name: 'collectionOrder',
      by: [
        { field: 'collection', direction: 'asc' },
        { field: 'order', direction: 'asc' }
      ]
    },
    {
      title: '⭐ Featured First',
      name: 'featuredFirst',
      by: [
        { field: 'featured', direction: 'desc' },
        { field: '_createdAt', direction: 'desc' }
      ]
    },
    {
      title: '📅 Newest First',
      name: 'newestFirst',
      by: [{ field: '_createdAt', direction: 'desc' }]
    },
    {
      title: '📅 Oldest First',
      name: 'oldestFirst',
      by: [{ field: '_createdAt', direction: 'asc' }]
    },
    {
      title: '📸 By Capture Date',
      name: 'captureDateDesc',
      by: [{ field: 'captureDate', direction: 'desc' }]
    },
    {
      title: 'A-Z Alphabetical',
      name: 'alphabetical',
      by: [{ field: 'title', direction: 'asc' }]
    }
  ]
})