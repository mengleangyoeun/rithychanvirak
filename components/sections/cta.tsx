'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'

export function CTA() {
  return (
    <motion.section
      className="relative py-20 sm:py-28 md:py-32 lg:py-40 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {/* Gradient background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Badge */}
          <motion.span
            className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white/80 text-xs sm:text-sm font-medium tracking-wide mb-6 sm:mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Work Together?
          </motion.span>

          {/* Main heading */}
          <motion.h2
            className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight px-4"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Let&apos;s Create
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Something Amazing
            </span>
          </motion.h2>

          {/* Decorative line */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Have a project in mind? Let&apos;s discuss how we can bring your vision to life through stunning photography.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="group w-full sm:w-auto"
            >
              <Link
                href="/contact"
                className="relative bg-white text-black px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 font-bold tracking-wide text-sm sm:text-base md:text-lg rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-500 inline-flex items-center justify-center gap-2 sm:gap-3 overflow-hidden w-full sm:w-auto"
                style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
              >
                <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 relative z-10" />
                <span className="relative z-10">Let&apos;s Talk</span>
                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/gallery"
                className="bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 font-bold tracking-wide text-sm sm:text-base md:text-lg rounded-full border-2 border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto"
                style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
              >
                <Mail className="w-4 sm:w-5 h-4 sm:h-5" />
                <span>View Portfolio</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom decorative element */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 1 }}
      />
    </motion.section>
  )
}
