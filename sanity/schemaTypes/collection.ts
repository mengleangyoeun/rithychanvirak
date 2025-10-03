import { defineType, defineField } from 'sanity'

export const collection = defineType({
  name: 'collection',
  title: 'Collection',
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
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text'
        }
      ]
    }),
    defineField({
      name: 'collectionType',
      title: 'Collection Type',
      type: 'string',
      options: {
        list: [
          { title: 'Main Collection', value: 'main' },
          { title: 'Sub-Album', value: 'sub' }
        ]
      },
      initialValue: 'main',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'parentCollection',
      title: 'Parent Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      hidden: ({ document }) => document?.collectionType !== 'sub',
      validation: Rule => Rule.custom((parent, context) => {
        const { document } = context
        if (document?.collectionType === 'sub' && !parent) {
          return 'Sub-albums must have a parent collection'
        }
        if (document?.collectionType === 'main' && parent) {
          return 'Main collections cannot have a parent'
        }
        return true
      })
    }),
    defineField({
      name: 'featured',
      title: 'Featured Collection',
      type: 'boolean',
      initialValue: false,
      description: 'Only main collections can be featured'
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' }
        ]
      },
      initialValue: 'draft'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    })
  ],
  preview: {
    select: {
      title: 'title',
      collectionType: 'collectionType',
      media: 'coverImage',
      parentTitle: 'parentCollection.title',
      status: 'status',
      order: 'order'
    },
    prepare({ title, collectionType, media, parentTitle, status, order }) {
      // Build a clear subtitle with all info
      const parts = []

      // Collection type
      if (collectionType === 'sub') {
        parts.push(`📁 Sub-album${parentTitle ? ` of ${parentTitle}` : ''}`)
      } else {
        parts.push('📂 Main Collection')
      }

      // Status badge
      if (status === 'published') {
        parts.push('✅ Published')
      } else if (status === 'draft') {
        parts.push('📝 Draft')
      } else if (status === 'archived') {
        parts.push('📦 Archived')
      }

      // Order number
      if (order !== undefined) {
        parts.push(`#${order}`)
      }

      return {
        title: title,
        subtitle: parts.join(' • '),
        media: media
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
      title: '📂 Main Collections First',
      name: 'typeOrder',
      by: [
        { field: 'collectionType', direction: 'asc' },
        { field: 'order', direction: 'asc' }
      ]
    },
    {
      title: '✅ Published First',
      name: 'statusPublished',
      by: [
        { field: 'status', direction: 'desc' },
        { field: 'order', direction: 'asc' }
      ]
    },
    {
      title: '📝 Drafts First',
      name: 'statusDraft',
      by: [
        { field: 'status', direction: 'asc' },
        { field: 'order', direction: 'asc' }
      ]
    },
    {
      title: 'A-Z Alphabetical',
      name: 'alphabetical',
      by: [{ field: 'title', direction: 'asc' }]
    }
  ]
})