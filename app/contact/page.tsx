'use client'

import { Phone, Mail, Twitter, Linkedin, Globe, MapPin, ArrowUpRight, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  siInstagram, siTelegram, siFacebook, siGmail,
  siWhatsapp, siYoutube, siTiktok, siX,
  siPinterest, siBehance, si500px
} from 'simple-icons'
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
      return {
        title: "Let's Connect",
        subtitle: "Direct channels and social profiles to get in touch.",
        socialLinks: []
      }
    }

    return {
      title: "Let's Connect",
      subtitle: "Direct channels and social profiles to get in touch.",
      socialLinks: (contactData || []).map(contact => ({
        id: contact.id,
        icon: contact.icon || contact.type,
        title: contact.label,
        value: contact.value,
        type: contact.type,
        url: contact.type === 'email' ? `mailto:${contact.value}` :
             contact.type === 'phone' ? `tel:${contact.value}` :
             contact.value.startsWith('http') ? contact.value : `https://${contact.value}`
      }))
    }
  } catch (error) {
    console.error('Error fetching contact data:', error)
    return {
      title: "Let's Connect",
      subtitle: "Direct channels and social profiles to get in touch.",
      socialLinks: []
    }
  }
}

interface SocialLinkItem {
  id: string
  icon: string
  title: string
  value: string
  type: string
  url: string
}

interface ContactData {
  title?: string
  subtitle?: string
  socialLinks: SocialLinkItem[]
}

// Icon mapping
const iconMap: { [key: string]: SimpleIcon | LucideIcon } = {
  Contact: Phone,
  contact: Phone,
  Phone: Phone,
  phone: Phone,
  Telegram: siTelegram,
  telegram: siTelegram,
  MessageCircle: siTelegram,
  messagecircle: siTelegram,
  Facebook: siFacebook,
  facebook: siFacebook,
  Instagram: siInstagram,
  instagram: siInstagram,
  Gmail: siGmail,
  gmail: siGmail,
  Mail: Mail,
  mail: Mail,
  email: Mail,
  WhatsApp: siWhatsapp,
  whatsapp: siWhatsapp,
  YouTube: siYoutube,
  youtube: siYoutube,
  TikTok: siTiktok,
  tiktok: siTiktok,
  X: siX,
  x: siX,
  Twitter: Twitter,
  twitter: Twitter,
  LinkedIn: Linkedin,
  linkedin: Linkedin,
  Pinterest: siPinterest,
  pinterest: siPinterest,
  Behance: siBehance,
  behance: siBehance,
  '500px': si500px,
  Website: Globe,
  website: Globe,
  Location: MapPin,
  location: MapPin
}

export default function ContactPage() {
  const [contactData, setContactData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    getContactData().then(data => {
      setContactData(data)
      setLoading(false)
    })
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Copied "${text}" to clipboard`)
    setTimeout(() => {
      setCopiedId(null)
    }, 2500)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030303] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="space-y-8 max-w-2xl mx-auto text-center">
          <Skeleton className="h-12 w-48 bg-zinc-900 mx-auto" />
          <Skeleton className="h-6 w-72 bg-zinc-900 mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-zinc-900 rounded-3xl" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!contactData) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Contact</h1>
          <p className="text-zinc-500 text-sm">Contact information not available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#030303] text-zinc-100 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-28 space-y-10 sm:space-y-12">

        {/* Hero Header */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {contactData.title || "Let's Connect"}
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            {contactData.subtitle || "Direct channels and social profiles to get in touch."}
          </p>
        </section>

        {/* Direct Connect Links Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contactData.socialLinks.map((social) => {
            const IconComponent = iconMap[social.icon]
            const hasMappedIcon = Boolean(IconComponent)
            const isCopied = copiedId === social.id

            const renderIcon = () => {
              if (hasMappedIcon && IconComponent && 'path' in IconComponent) {
                return (
                  <svg className="w-5 h-5 text-zinc-300 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d={IconComponent.path} />
                  </svg>
                )
              } else if (hasMappedIcon && IconComponent) {
                const LucideIconComp = IconComponent as LucideIcon
                return <LucideIconComp className="w-5 h-5 text-zinc-300 group-hover:text-white" strokeWidth={1.75} />
              }
              return <Phone className="w-5 h-5 text-zinc-300 group-hover:text-white" strokeWidth={1.75} />
            }

            return (
              <div
                key={social.id}
                className="group flex items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-300 shadow-xl"
              >
                <a
                  href={social.url}
                  target={social.url.startsWith('http') ? '_blank' : '_self'}
                  rel={social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 min-w-0 flex-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-zinc-800 transition-all">
                    {renderIcon()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-bold text-white truncate group-hover:text-primary transition-colors">
                      {social.title}
                    </div>
                    <div className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
                      {social.value}
                    </div>
                  </div>
                </a>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(social.value, social.id)}
                    className="h-9 w-9 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a
                    href={social.url}
                    target={social.url.startsWith('http') ? '_blank' : '_self'}
                    rel={social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Open Channel"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )
          })}
        </section>

      </div>
    </main>
  )
}
