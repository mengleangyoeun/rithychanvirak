import { defineType, defineField } from 'sanity'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Service Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'number',
      title: 'Service Number',
      type: 'number',
      description: 'Display order (e.g., 1, 2, 3)',
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'icon',
      title: 'Icon Emoji',
      type: 'string',
      description: 'Optional emoji icon (e.g., 📸, 🎥, ✨)',
      initialValue: '📸'
    }),
    defineField({
      name: 'featured',
      title: 'Featured Service',
      type: 'boolean',
      description: 'Show this service on the homepage',
      initialValue: true
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Is this service currently offered?',
      initialValue: true
    })
  ],
  preview: {
    select: {
      title: 'title',
      number: 'number',
      icon: 'icon',
      active: 'active'
    },
    prepare({ title, number, icon, active }) {
      return {
        title: `${number}. ${title}`,
        subtitle: active ? '✅ Active' : '❌ Inactive',
        media: icon ? undefined : undefined
      }
    }
  },
  orderings: [
    {
      title: 'Service Number',
      name: 'numberAsc',
      by: [{ field: 'number', direction: 'asc' }]
    }
  ]
})
