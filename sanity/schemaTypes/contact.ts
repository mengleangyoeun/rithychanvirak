import { defineType, defineField } from 'sanity'

export const contact = defineType({
  name: 'contact',
  title: 'Contact Information',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: "Let's Connect"
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      initialValue: 'Choose your preferred way to reach out'
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'platform',
              type: 'string',
              title: 'Platform',
              options: {
                list: [
                  { title: 'Contact', value: 'contact' },
                  { title: 'Telegram', value: 'telegram' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'Gmail', value: 'gmail' }
                ]
              }
            },
            { name: 'url', type: 'string', title: 'URL' },
            {
              name: 'icon',
              type: 'string',
              title: 'Icon Component',
              options: {
                list: [
                  { title: 'Contact (Phone)', value: 'Contact' },
                  { title: 'Telegram', value: 'Telegram' },
                  { title: 'Facebook', value: 'Facebook' },
                  { title: 'Instagram', value: 'Instagram' },
                  { title: 'Gmail', value: 'Gmail' }
                ]
              },
              description: 'Icon component name'
            }
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url'
            }
          }
        }
      ],
      validation: Rule => Rule.max(5).error('Maximum 5 social links allowed')
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle'
    }
  }
})