'use client'

import { Phone, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { siInstagram, siTelegram, siFacebook, siGmail } from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { LucideIcon } from 'lucide-react'

async function getContactData() {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { data: contactData, error } = await supabase
      .from('contact_info')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching contact data:', error)
      // Fallback to default contact data
      return {
        title: "Let's Connect",
        subtitle: "Get in touch for collaborations, inquiries, or just to say hello",
        socialLinks: []
      }
    }

    return {
      title: "Let's Connect",
      subtitle: "Get in touch for collaborations, inquiries, or just to say hello",
      socialLinks: (contactData || []).map(contact => ({
        icon: contact.icon || contact.type,
        title: contact.label,
        description: `Connect via ${contact.type}`,
        link: contact.value,
        platform: contact.type,
        url: contact.type === 'email' ? `mailto:${contact.value}` :
             contact.type === 'phone' ? `tel:${contact.value}` :
             contact.value.startsWith('http') ? contact.value : `https://${contact.value}`
      }))
    }
  } catch (error) {
    console.error('Error fetching contact data:', error)
    // Fallback to default contact data
    return {
      title: "Let's Connect",
      subtitle: "Get in touch for collaborations, inquiries, or just to say hello",
      socialLinks: []
    }
  }
}

interface ContactData {
  title?: string
  subtitle?: string
  socialLinks: Array<{
    icon: string
    title: string
    description: string
    link: string
    platform: string
    url: string
  }>
}

// Icon mapping
const iconMap: { [key: string]: SimpleIcon | LucideIcon } = {
  Contact: Phone,
  Phone: Phone,
  Telegram: siTelegram,
  MessageCircle: siTelegram,
  Facebook: siFacebook,
  Instagram: siInstagram,
  Gmail: siGmail,
  Mail: Mail
}

// Platform-specific colors
const platformColors: { [key: string]: string } = {
  Contact: 'from-green-500 to-emerald-600',
  Phone: 'from-green-500 to-emerald-600',
  Telegram: 'from-blue-500 to-cyan-600',
  Facebook: 'from-blue-600 to-indigo-700',
  Instagram: 'from-pink-500 to-purple-600',
  Gmail: 'from-red-500 to-orange-600',
  Mail: 'from-gray-600 to-gray-800'
}

export default function ContactPage() {
  const [contactData, setContactData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContactData().then(data => {
      setContactData(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8">
          <Skeleton className="w-full h-full rounded-full" />
        </div>
      </div>
    )
  }

  if (!contactData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Contact</h1>
          <p className="text-muted-foreground">Contact information not available yet.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen unified-background">
      <div className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-5xl mx-auto w-full">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-none"
              style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            >
              {contactData.title || "Let's Connect"}
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              <div className="w-3 h-3 bg-white/40 rounded-full animate-pulse"></div>
              <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>

            {contactData.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl sm:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light"
              >
                {contactData.subtitle}
              </motion.p>
            )}
          </motion.div>

          {/* Social Links Grid */}
          {contactData.socialLinks && contactData.socialLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            >
              {contactData.socialLinks.map((social, index: number) => {
                const IconComponent = iconMap[social.icon] || Phone
                const colorClass = platformColors[social.icon] || platformColors[social.platform] || 'from-gray-500 to-gray-700'
                let url = social.url || social.link || '#'

                // Add tel: prefix for phone numbers (if it's not already a URL)
                const isPhone = social.platform?.toLowerCase() === 'contact' ||
                               social.icon?.toLowerCase().includes('contact') ||
                               social.icon?.toLowerCase().includes('phone')
                if (isPhone && !url.startsWith('http') && !url.startsWith('tel:') && !url.startsWith('mailto:')) {
                  url = `tel:${url}`
                }

                const isExternal = url.startsWith('http')

                return (
                  <motion.a
                    key={social.platform}
                    href={url}
                    target={isExternal ? '_blank' : '_self'}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative"
                  >
                    <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-white/20">

                      {/* Gradient background on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

                      {/* Icon */}
                      <div className="relative mb-4">
                        <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                          {'path' in IconComponent ? (
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d={IconComponent.path} />
                            </svg>
                          ) : (
                            <IconComponent className="w-8 h-8 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Platform name */}
                      <h3 className="text-lg font-bold text-white mb-2 capitalize">
                        {social.platform}
                      </h3>

                      {/* Subtle line */}
                      <div className={`w-12 h-0.5 bg-gradient-to-r ${colorClass} mx-auto opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all duration-300`}></div>
                    </div>
                  </motion.a>
                )
              })}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}
