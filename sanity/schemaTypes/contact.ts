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
                  { title: 'Telegram', value: 'telegram' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'Phone', value: 'phone' }
                ]
              }
            },
            { name: 'url', type: 'url', title: 'URL' },
            { 
              name: 'icon', 
              type: 'string', 
              title: 'Icon Component',
              options: {
                list: [
                  { title: 'Telegram (MessageCircle)', value: 'MessageCircle' },
                  { title: 'Facebook', value: 'Facebook' },
                  { title: 'Instagram', value: 'Instagram' },
                  { title: 'Phone', value: 'Phone' }
                ]
              },
              description: 'Lucide React icon component name'
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
      validation: Rule => Rule.max(4).error('Maximum 4 social links allowed')
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle'
    }
  }
})