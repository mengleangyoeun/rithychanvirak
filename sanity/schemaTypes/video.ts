import { defineType, defineField } from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube, Vimeo, Google Drive (share link), or direct video URL',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'videoType',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          { title: 'YouTube', value: 'youtube' },
          { title: 'Vimeo', value: 'vimeo' },
          { title: 'Google Drive', value: 'googledrive' },
          { title: 'Direct URL', value: 'direct' }
        ]
      },
      initialValue: 'youtube',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'thumbnailUrl',
      title: 'Thumbnail Image URL',
      type: 'url',
      description: 'Cloudinary thumbnail image URL (optional, will use video thumbnail if not set)'
    }),
    defineField({
      name: 'thumbnailId',
      title: 'Thumbnail Cloudinary ID',
      type: 'string',
      description: 'Cloudinary public ID for thumbnail transformations'
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Urban Videography', value: 'urban' },
          { title: 'Art Film', value: 'art' },
          { title: 'Documentary', value: 'documentary' },
          { title: 'Commercial', value: 'commercial' },
          { title: 'Music Video', value: 'music' },
          { title: 'Event', value: 'event' },
          { title: 'Other', value: 'other' }
        ]
      }
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.min(2000).max(new Date().getFullYear() + 1)
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this video on the homepage',
      initialValue: false
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
      name: 'storyboard',
      title: 'Grabbed Stills / Storyboard',
      type: 'array',
      description: 'Key frames from the video. Use "Bulk Upload Storyboards" tool to upload multiple images at once.',
      of: [
        {
          type: 'object',
          name: 'storyboardFrame',
          title: 'Storyboard Frame',
          fields: [
            {
              name: 'imageUrl',
              type: 'url',
              title: 'Cloudinary Image URL',
              description: '🔗 Auto-filled by bulk upload',
              validation: (Rule) => Rule.required(),
              readOnly: true
            },
            {
              name: 'imageId',
              type: 'string',
              title: 'Cloudinary Public ID',
              description: '🔗 Auto-filled by bulk upload',
              validation: (Rule) => Rule.required(),
              readOnly: true
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
              description: '✏️ Describe what\'s in this frame (for accessibility)',
              placeholder: 'e.g., "Wide shot of the ceremony"'
            },
            {
              name: 'caption',
              type: 'text',
              title: 'Caption',
              description: '✏️ Optional caption or notes for this frame',
              rows: 2,
              placeholder: 'Add a caption or note about this frame...'
            },
            {
              name: 'timestamp',
              type: 'string',
              title: 'Timestamp',
              description: '⏱️ Time in video (e.g., "1:23" or "00:01:23")',
              placeholder: '00:01:23'
            },
            {
              name: 'order',
              type: 'number',
              title: 'Display Order',
              description: '🔢 Optional: Set custom order (lower numbers appear first)',
              initialValue: 0
            }
          ],
          preview: {
            select: {
              imageUrl: 'imageUrl',
              imageId: 'imageId',
              alt: 'alt',
              caption: 'caption',
              timestamp: 'timestamp',
              order: 'order'
            },
            prepare({ imageUrl, imageId, alt, caption, timestamp, order }) {
              return {
                title: alt || caption || imageId || 'Storyboard frame',
                subtitle: [
                  timestamp && `⏱️ ${timestamp}`,
                  caption && `📝 ${caption}`,
                  order !== undefined && order !== 0 && `#${order}`
                ].filter(Boolean).join(' • '),
                media: imageUrl
              }
            }
          }
        }
      ],
      options: {
        layout: 'grid',
        sortable: true
      }
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0
    })
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      year: 'year',
      category: 'category',
      featured: 'featured'
    },
    prepare({ title, media, year, category, featured }) {
      return {
        title: title,
        subtitle: `${year || 'No year'} • ${category || 'Uncategorized'}${featured ? ' • ⭐ Featured' : ''}`,
        media: media
      }
    }
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    },
    {
      title: 'Year (Newest First)',
      name: 'yearDesc',
      by: [{ field: 'year', direction: 'desc' }]
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }]
    }
  ]
})
