'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Mail, Phone, Camera, Heart, Globe, MapPin } from 'lucide-react'
import { siInstagram, siTelegram, siFacebook, siGmail } from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SocialLink {
  platform: string
  url: string
  icon: string
}

interface FooterData {
  socialLinks: SocialLink[]
  brandTitle: string
  brandDescription: string
  copyrightText: string
  madeByName?: string
  madeByUrl?: string
}

const iconMap: Record<string, SimpleIcon | LucideIcon> = {
  contact: Phone,
  phone: Phone,
  telegram: siTelegram,
  messagecircle: siTelegram,
  facebook: siFacebook,
  instagram: siInstagram,
  gmail: siGmail,
  mail: Mail,
  email: Mail,
  website: Globe,
  location: MapPin,
}

const colorMap: Record<string, string> = {
  contact: 'hover:text-green-400',
  phone: 'hover:text-green-400',
  telegram: 'hover:text-blue-400',
  facebook: 'hover:text-blue-500',
  instagram: 'hover:text-pink-400',
  gmail: 'hover:text-red-400',
  mail: 'hover:text-red-400',
  email: 'hover:text-red-400',
  website: 'hover:text-cyan-400',
  location: 'hover:text-amber-400',
}

const normalizeContactUrl = (type: string, value: string): string => {
  if (!value) return '#'
  if (value.startsWith('http') || value.startsWith('tel:') || value.startsWith('mailto:')) return value
  if (type === 'email') return `mailto:${value}`
  if (type === 'phone' || type === 'contact') return `tel:${value}`
  return `https://${value}`
}

async function getFooterData(): Promise<FooterData> {
  try {
    const supabase = createClient()

    const [contactResult, settingsResult] = await Promise.all([
      supabase
        .from('contact_info')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true }),
      supabase
        .from('site_settings')
        .select('*')
    ])

    const settingsMap = new Map<string, string>()
    for (const setting of settingsResult.data || []) {
      if (typeof setting.value === 'string') {
        settingsMap.set(setting.key, setting.value)
      }
    }

    const brandTitle = settingsMap.get('footer_brand_title') || 'RITHY CHANVIRAK'
    const brandDescription =
      settingsMap.get('footer_brand_description') ||
      'Capturing moments that tell compelling stories through creativity and passion.'
    const copyrightText =
      settingsMap.get('footer_copyright') ||
      `© ${new Date().getFullYear()} ${brandTitle}. All rights reserved.`

    const madeByName = settingsMap.get('footer_made_by_name') || undefined
    const madeByUrl = settingsMap.get('footer_made_by_url') || undefined

    const socialLinks: SocialLink[] = (contactResult.data || []).map((contact) => {
      const type = (contact.type || '').toLowerCase()
      const icon = (contact.icon || contact.type || 'phone') as string
      return {
        platform: type || 'contact',
        url: normalizeContactUrl(type, contact.value),
        icon,
      }
    })

    return {
      socialLinks,
      brandTitle,
      brandDescription,
      copyrightText,
      madeByName,
      madeByUrl,
    }
  } catch (error) {
    console.error('Footer data fetch error:', error)
    return {
      socialLinks: [],
      brandTitle: 'RITHY CHANVIRAK',
      brandDescription:
        'Capturing moments that tell compelling stories through creativity and passion.',
      copyrightText: `© ${new Date().getFullYear()} RITHY CHANVIRAK. All rights reserved.`,
    }
  }
}

export function Footer() {
  const [footerData, setFooterData] = useState<FooterData | null>(null)
  const quickLinks = useMemo(
    () => [
      { href: '/', label: 'Home' },
      { href: '/gallery', label: 'Gallery' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    []
  )

  useEffect(() => {
    getFooterData().then(setFooterData)
  }, [])

  const emailLink = footerData?.socialLinks.find((l) => l.platform === 'email' || l.icon === 'mail' || l.icon === 'gmail')
  const phoneLink = footerData?.socialLinks.find((l) => l.platform === 'phone' || l.platform === 'contact' || l.icon === 'phone')

  return (
    <footer className="bg-gradient-to-b from-black to-zinc-950 text-white border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-wide" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                {footerData?.brandTitle || 'RITHY CHANVIRAK'}
              </h3>
            </div>
            <p className="text-zinc-300 leading-relaxed mb-6 max-w-xl">
              {footerData?.brandDescription || 'Capturing moments that tell compelling stories through creativity and passion.'}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {footerData?.socialLinks.map((link, idx) => {
                const key = (link.icon || '').toLowerCase()
                const IconComponent = iconMap[key]
                const hasMappedIcon = Boolean(IconComponent)
                const customIconText = !hasMappedIcon ? link.icon?.trim() : ''
                const colorClass = colorMap[key] || 'hover:text-zinc-200'
                const isExternal = link.url.startsWith('http')
                return (
                  <motion.a
                    key={`${link.platform}-${idx}`}
                    href={link.url}
                    target={isExternal ? '_blank' : '_self'}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    whileHover={{ scale: 1.06, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-11 h-11 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 transition-all duration-200 ${colorClass}`}
                    aria-label={link.platform}
                  >
                    {hasMappedIcon && IconComponent && 'path' in IconComponent ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d={IconComponent.path} />
                      </svg>
                    ) : hasMappedIcon && IconComponent ? (
                      (() => {
                        const LucideIconComponent = IconComponent as LucideIcon
                        return <LucideIconComponent className="w-4 h-4" />
                      })()
                    ) : customIconText ? (
                      <span className="text-base leading-none">{customIconText}</span>
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                  </motion.a>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            viewport={{ once: true }}
          >
            <h4 className="text-base font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-400 hover:text-white transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-base font-semibold mb-5">Get In Touch</h4>
            <div className="space-y-3">
              {emailLink && (
                <a href={emailLink.url} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="text-sm">{emailLink.url.replace('mailto:', '')}</span>
                </a>
              )}
              {phoneLink && (
                <a href={phoneLink.url} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{phoneLink.url.replace('tel:', '')}</span>
                </a>
              )}
              {!emailLink && !phoneLink && (
                <p className="text-sm text-zinc-500">Add contact info in Admin → Content.</p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="border-t border-zinc-800 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-zinc-400 text-sm text-center sm:text-left">
              {footerData?.copyrightText || `© ${new Date().getFullYear()} RITHY CHANVIRAK. All rights reserved.`}
            </p>
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <span>made with</span>
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
              {footerData?.madeByName ? (
                footerData.madeByUrl ? (
                  <a href={footerData.madeByUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {footerData.madeByName}
                  </a>
                ) : (
                  <span>{footerData.madeByName}</span>
                )
              ) : (
                <span>studio team</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
