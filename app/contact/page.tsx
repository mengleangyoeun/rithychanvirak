'use client'

import { Phone } from 'lucide-react'
import { motion } from 'motion/react'
import { client } from '@/sanity/lib/client'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { siInstagram, siTelegram, siWhatsapp, siFacebook } from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { LucideIcon } from 'lucide-react'

async function getContactData() {
  return client.fetch(`
    *[_type == "contact"][0] {
      title,
      subtitle,
      socialLinks
    }
  `)
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
  Telegram: siTelegram,
  MessageCircle: siTelegram, // Handle both keys for Telegram
  Facebook: siFacebook,
  Instagram: siInstagram,
  WhatsApp: siWhatsapp,
  Phone
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

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

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
        <motion.div {...fadeInUp} className="text-center">
          <h1 className="text-4xl font-bold mb-4">Contact</h1>
          <p className="text-muted-foreground">Contact information not available yet.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen unified-background relative overflow-hidden">
      
      <div className="relative flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-16 lg:mb-20"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-8 tracking-tighter leading-none">
                <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
                  {contactData.title ? contactData.title.toUpperCase() : "LET'S"}
                </span>
                <br />
                <span className="text-foreground">
                  {contactData.title ? "" : "CONNECT"}
                </span>
              </h1>
              
              <div className="flex items-center justify-center mb-8">
                <div className="h-px bg-gradient-to-r from-transparent via-foreground to-transparent w-32"></div>
                <div className="mx-6 w-4 h-4 bg-foreground rounded-full animate-pulse"></div>
                <div className="h-px bg-gradient-to-r from-transparent via-foreground to-transparent w-32"></div>
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-16 lg:mb-20"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 lg:p-12 relative max-w-4xl mx-auto shadow-2xl">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed">
                {contactData.subtitle || "Choose your preferred way to connect and let's create something amazing together"}
              </p>
              
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </motion.div>

          {/* Enhanced Social Media Cards */}
          {contactData.socialLinks && contactData.socialLinks.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
            >
              {contactData.socialLinks.map((social, index: number) => {
                const IconComponent = iconMap[social.icon] || Phone
                const gradientColors = [
                  'from-red-500 to-pink-600',
                  'from-blue-500 to-indigo-600', 
                  'from-green-500 to-emerald-600',
                  'from-yellow-500 to-orange-600',
                  'from-purple-500 to-violet-600',
                  'from-teal-500 to-cyan-600'
                ]
                const hoverColors = [
                  'hover:from-red-600 hover:to-pink-700',
                  'hover:from-blue-600 hover:to-indigo-700',
                  'hover:from-green-600 hover:to-emerald-700',
                  'hover:from-yellow-600 hover:to-orange-700',
                  'hover:from-purple-600 hover:to-violet-700',
                  'hover:from-teal-600 hover:to-cyan-700'
                ]
                
                return (
                  <motion.a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={{
                      initial: { opacity: 0, y: 80, scale: 0.8 },
                      animate: { 
                        opacity: 1, 
                        y: 0,
                        scale: 1
                      }
                    }}
                    whileHover={{ 
                      scale: 1.08,
                      y: -12,
                      rotate: index % 2 === 0 ? 2 : -2
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="transform transition-all duration-500"
                  >
                    <div className="relative bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 text-center group hover:shadow-2xl transition-all duration-500 overflow-hidden">
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} ${hoverColors[index % hoverColors.length]} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                      
                      {/* Icon Container */}
                      <div className="relative mb-6">
                        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${gradientColors[index % gradientColors.length]} flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                          {/* Handle both simple-icons and lucide-react icons */}
                          {'path' in IconComponent ? (
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d={IconComponent.path} />
                            </svg>
                          ) : (
                            <IconComponent className="w-10 h-10 text-white" />
                          )}
                        </div>
                        
                        {/* Floating indicator */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      {/* Platform name */}
                      <h3 className={`text-xl font-bold mb-4 text-foreground group-hover:bg-gradient-to-r group-hover:${gradientColors[index % gradientColors.length]} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300`}>
                        {social.platform}
                      </h3>
                      
                      <div className={`w-16 h-1 bg-gradient-to-r ${gradientColors[index % gradientColors.length]} mx-auto mb-4 rounded-full`}></div>
                      
                      {/* Enhanced click hint */}
                      <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                        <span className={`bg-gradient-to-r ${gradientColors[index % gradientColors.length]} text-white px-4 py-2 text-sm font-bold rounded-full inline-block shadow-lg`}>
                          Connect Now
                        </span>
                      </div>
                      
                      {/* Decorative elements */}
                      <div className="absolute top-4 right-4 w-2 h-2 bg-foreground/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 left-4 w-3 h-3 bg-foreground/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"></div>
                    </div>
                  </motion.a>
                )
              })}
            </motion.div>
          )}

          {/* Additional Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-20"
          >
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">
                Ready to start your project?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                Whether you need professional photography for your business, event coverage, or creative portraits, 
                I&apos;m here to bring your vision to life. Let&apos;s discuss your ideas and create something extraordinary together.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Available for new projects</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span>Quick response guaranteed</span>
                </div>
              </div>
            </div>
          </motion.div>

          
        </div>
      </div>
    </div>
  )
}