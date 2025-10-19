'use client'

import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'

interface HeroData {
  _id: string
  title?: string
  subtitle?: string
  backgroundImage?: { asset: { _ref: string }; alt?: string }
  overlayOpacity?: number
}

export function Hero({ data }: { data: HeroData | null }) {

  return (
    <section className="relative h-screen w-full flex items-start md:items-center justify-center overflow-hidden pt-24 md:pt-0">
      {/* Background with parallax effect */}
      <div className="absolute inset-0">
        {data?.backgroundImage?.asset?._ref ? (
          <div
            className="w-full h-full bg-cover bg-[75%_center] md:bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${data.backgroundImage.asset._ref})`,
              imageRendering: 'auto'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900 via-orange-900 to-black" />
        )}
      </div>

      {/* Overlay layer on top of background */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: data?.overlayOpacity ?? 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6 sm:px-8">
        <motion.h1
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-[0.1em] sm:tracking-[0.15em] leading-tight mb-4 sm:mb-6 drop-shadow-2xl px-4"
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

        {/* Scroll Indicator */}
        <motion.div
          className="mt-16 sm:mt-20 cursor-pointer group flex justify-center"
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
