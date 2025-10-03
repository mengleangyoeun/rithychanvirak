'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <motion.section
      className="relative py-20 sm:py-24 md:py-28 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Heading */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 sm:mb-10 md:mb-12 leading-tight"
          style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Ready to work together?
        </motion.h2>

        {/* CTA Button */}
        <motion.div
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            href="/contact"
            className="relative bg-white text-black px-8 sm:px-10 md:px-12 py-3.5 sm:py-4 md:py-5 font-bold tracking-wide text-sm sm:text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center justify-center gap-2 sm:gap-3 overflow-hidden"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            <span className="relative z-10">Let&apos;s Talk</span>
            <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
