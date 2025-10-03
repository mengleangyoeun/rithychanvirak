'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { ChevronDown } from 'lucide-react'

interface HeroData {
  _id: string
  title?: string
  subtitle?: string
  backgroundImage?: { asset: { _ref: string }; alt?: string }
  overlayOpacity?: number
}

export function Hero({ data }: { data: HeroData | null }) {
  const overlayOpacity = data?.overlayOpacity || 0.5

  return (
    <section className="relative h-screen w-full flex items-start md:items-center justify-center overflow-hidden pt-24 md:pt-0">
      {/* Background with parallax effect */}
      <div className="absolute inset-0">
        {data?.backgroundImage ? (
          <>
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-full h-full"
            >
              {/* Mobile Image - Portrait crop */}
              <Image
                src={urlFor(data.backgroundImage).width(800).height(1200).fit('crop').crop('focalpoint').url()}
                alt={data.backgroundImage.alt || 'Hero background'}
                fill
                sizes="100vw"
                className="object-cover md:hidden"
                style={{ objectPosition: '95% center' }}
                priority
                quality={90}
              />
              {/* Desktop Image - Landscape crop */}
              <Image
                src={urlFor(data.backgroundImage).width(2000).height(1200).fit('crop').crop('focalpoint').url()}
                alt={data.backgroundImage.alt || 'Hero background'}
                fill
                sizes="100vw"
                className="object-cover hidden md:block"
                priority
                quality={90}
              />
            </motion.div>
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70"
              style={{ opacity: overlayOpacity }}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900 via-orange-900 to-black" />
        )}
      </div>

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-4 sm:mb-6"
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-xs sm:text-sm font-medium tracking-wide">
            Professional Photographer
          </span>
        </motion.div>

        <motion.h1
          className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white tracking-[0.1em] sm:tracking-[0.15em] leading-[1.1] mb-4 sm:mb-6 drop-shadow-2xl px-4"
          style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          {data?.title || 'RITHY CHANVIRAK'}
        </motion.h1>

        <motion.div
          className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 sm:mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 96, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        <motion.p
          className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 font-light tracking-wide max-w-3xl mx-auto leading-relaxed px-4"
          style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          {data?.subtitle || "Capturing moments that tell compelling stories through the lens"}
        </motion.p>

        <motion.div
          className="mt-2 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Link
            href="/gallery"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-bold tracking-wide rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20 text-center text-sm sm:text-base"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            View Gallery
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-bold tracking-wide rounded-full border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105 text-center text-sm sm:text-base"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            Get in Touch
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="mt-12 sm:mt-0 sm:absolute sm:bottom-12 sm:left-1/2 sm:transform sm:-translate-x-1/2 cursor-pointer group flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/70 text-xs tracking-[0.3em] font-light group-hover:text-white transition-colors">
              SCROLL
            </span>
            <ChevronDown className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
