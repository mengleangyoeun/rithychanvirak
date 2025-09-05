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
      type: 'string'
    }),
    defineField({
      name: 'lens',
      title: 'Lens',
      type: 'string'
    }),
    defineField({
      name: 'settings',
      title: 'Camera Settings',
      type: 'object',
      fields: [
        { name: 'aperture', type: 'string', title: 'Aperture (f-stop)' },
        { name: 'shutter', type: 'string', title: 'Shutter Speed' },
        { name: 'iso', type: 'string', title: 'ISO' },
        { name: 'focalLength', type: 'string', title: 'Focal Length' }
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
      collectionTitle: 'collection.title'
    },
    prepare({ title, imageUrl, collectionTitle }) {
      return {
        title: title,
        subtitle: collectionTitle ? `In ${collectionTitle}` : 'No collection assigned'
      }
    }
  },
  orderings: [
    {
      title: 'Order (Ascending)',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    },
    {
      title: 'Collection then Order',
      name: 'collectionOrder',
      by: [
        { field: 'collection', direction: 'asc' },
        { field: 'order', direction: 'asc' }
      ]
    },
    {
      title: 'Capture Date (Newest First)',
      name: 'captureDateDesc',
      by: [{ field: 'captureDate', direction: 'desc' }]
    }
  ]
})