import { defineType, defineField } from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'About Me'
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
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
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short description or title (e.g., "Professional Wedding Photographer")'
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'array',
      of: [{ type: 'block' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'organization', type: 'string', title: 'Organization' },
            { name: 'period', type: 'string', title: 'Period' },
            { name: 'description', type: 'text', title: 'Description' }
          ]
        }
      ]
    }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'awards',
      title: 'Awards & Recognition',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Award Title' },
            { name: 'organization', type: 'string', title: 'Organization' },
            { name: 'year', type: 'string', title: 'Year' }
          ]
        }
      ]
    }),
    defineField({
      name: 'equipment',
      title: 'Equipment',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'category', type: 'string', title: 'Category' },
            { name: 'items', type: 'array', of: [{ type: 'string' }], title: 'Items' }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'profileImage'
    }
  }
})