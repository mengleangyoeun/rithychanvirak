import Link from "next/link"
import { motion } from "motion/react"
import { Mail, Phone, Camera, Heart } from "lucide-react"
import { siInstagram, siTelegram, siWhatsapp, siLintcode } from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'
import type { LucideIcon } from 'lucide-react'

interface SocialLink {
  href: string
  icon: SimpleIcon | LucideIcon
  label: string
  color: string
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks: SocialLink[] = [
    { 
      href: "https://instagram.com/rithychanvirak", 
      icon: siInstagram, 
      label: "Instagram",
      color: "hover:text-pink-400"
    },
    { 
      href: "https://t.me/rithychanvirak", 
      icon: siTelegram, 
      label: "Telegram",
      color: "hover:text-blue-400"
    },
    { 
      href: "https://wa.me/85511899757", 
      icon: siWhatsapp, 
      label: "WhatsApp",
      color: "hover:text-green-400"
    },
    { 
      href: "mailto:hello@rithychanvirak.com", 
      icon: Mail, 
      label: "Email",
      color: "hover:text-blue-500"
    },
  ]

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Gallery" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <footer className="bg-gradient-to-b from-black to-gray-950 text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black tracking-wide" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                RITHY CHANVIRAK
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg mb-8 max-w-md">
              Capturing moments that tell compelling stories through the lens of creativity and passion. 
              Professional photography services for all your special occasions.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:border-gray-600 transition-all duration-300 ${link.color}`}
                  aria-label={link.label}
                >
                  {/* Handle both simple-icons and lucide-react icons */}
                  {'path' in link.icon ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d={link.icon.path} />
                    </svg>
                  ) : (
                    <link.icon className="w-5 h-5" />
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">Get In Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="text-sm">hello@rithychanvirak.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-sm">+855 11 899 757</span>
              </div>
            </div>
            
            {/* <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Available for bookings</p>
              <p className="text-white font-semibold">Mon - Sat, 9AM - 6PM</p>
            </div> */}
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <motion.p 
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              &copy; {currentYear} Rithy Chanvirak Photography. All rights reserved.
            </motion.p>
            
            <motion.div 
              className="flex items-center gap-2 text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <span>made with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-red-400 fill-current" />
              </motion.div>
              <a href="https://www.instagram.com/yourfavoriteeunc" target="_blank" className="hover:text-blue-400 transition-colors">mengleangyoeun</a>
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d={siLintcode.path} />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}