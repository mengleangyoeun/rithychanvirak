'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'

interface HeroData {
  _id: string
  title?: string
  subtitle?: string
  backgroundImage?: { asset: { _ref: string }; alt?: string }
  overlayOpacity?: number
}

const CIPHER_GLYPHS = 'アイウエオカキクケコサシスセソタチツテ0123456789ABCDEF_#/*+-=!&'

export function Hero({ data }: { data: HeroData | null }) {
  const targetTitle = data?.title || 'RITHY CHANVIRAK'
  const subtitle = data?.subtitle || 'Capturing moments that tell compelling stories through the lens'
  const bgImage = data?.backgroundImage?.asset?._ref

  // Decryption Scramble Engine
  const [scrambleOutput, setScrambleOutput] = useState(targetTitle)
  const [isDecrypted, setIsDecrypted] = useState(false)
  const isAnimatingRef = useRef(false)

  const triggerDecryption = useCallback(() => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true
    setIsDecrypted(false)

    let iteration = 0
    const totalIterations = targetTitle.length * 3
    const chars = targetTitle.split('')

    const interval = setInterval(() => {
      setScrambleOutput(
        chars
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration / 3) {
              return targetTitle[index]
            }
            return CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)]
          })
          .join('')
      )

      iteration++

      if (iteration >= totalIterations) {
        clearInterval(interval)
        setScrambleOutput(targetTitle)
        setIsDecrypted(true)
        isAnimatingRef.current = false
      }
    }, 35) // 35ms rapid cipher tick for ultra-fluid cinema scramble
  }, [targetTitle])

  useEffect(() => {
    // Initial delay on mount before decryption sequence initiates
    const timer = setTimeout(() => {
      triggerDecryption()
    }, 300)

    return () => clearTimeout(timer)
  }, [triggerDecryption])

  const scrollToContent = () => {
    const mainElem = document.getElementById('portfolio-section')
    if (mainElem) {
      mainElem.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({
        top: window.innerHeight - 60,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#030303] select-none pt-28 pb-0 px-4 sm:px-6 lg:px-8">
      {/* 1. Background Cinematic Photo with Atmospheric Slow Breath */}
      <div className="absolute inset-0 select-none overflow-hidden">
        {bgImage ? (
          <motion.div
            animate={{ scale: [1.02, 1.06, 1.02] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${bgImage})`,
              imageRendering: 'auto'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
        )}
      </div>

      {/* 2. Background Scrims for Contrast */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-500"
        style={{ opacity: data?.overlayOpacity ?? 0.55 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#030303] pointer-events-none" />

      {/* Top Spacer */}
      <div className="w-full h-2" />

      {/* 3. Camera Viewfinder Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.005 }}
        className="relative z-10 max-w-4xl w-full mx-auto p-8 sm:p-12 md:p-14 rounded-3xl border border-white/15 bg-black/30 backdrop-blur-[4px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto transition-colors duration-500 hover:border-white/25 hover:bg-black/40"
      >
        {/* Animated Corner Focus Brackets */}
        <motion.div
          initial={{ x: -10, y: -10, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-4 left-4 text-white/50 text-xs font-mono select-none"
        >
          ┌
        </motion.div>
        <motion.div
          initial={{ x: 10, y: -10, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-4 right-4 text-white/50 text-xs font-mono select-none"
        >
          ┐
        </motion.div>
        <motion.div
          initial={{ x: -10, y: 10, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute bottom-4 left-4 text-white/50 text-xs font-mono select-none"
        >
          └
        </motion.div>
        <motion.div
          initial={{ x: 10, y: 10, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute bottom-4 right-4 text-white/50 text-xs font-mono select-none"
        >
          ┘
        </motion.div>

        {/* Viewfinder Telemetry Header */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-widest text-zinc-400 uppercase mb-8 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-300">REC • 24 FPS</span>
          </div>
          <div>
            <span>PHNOM PENH, CAMBODIA</span>
          </div>
        </div>

        {/* Viewfinder Center Content with Cyber Cinema Decryption Title */}
        <div className="text-center space-y-5">
          <div
            className="py-1 min-h-[4rem] sm:min-h-[5.5rem] flex items-center justify-center cursor-pointer group/title"
            onClick={triggerDecryption}
            title="Click to re-decrypt"
          >
            <h1
              className="inline-flex items-center justify-center flex-wrap text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-[0.06em] sm:tracking-[0.1em] uppercase leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] transition-colors"
              style={{
                fontFamily: /[\u1780-\u17FF]/.test(targetTitle)
                  ? '"Kantumruy Pro", sans-serif'
                  : 'var(--font-livvic), sans-serif',
              }}
            >
              <span className="relative">
                {scrambleOutput}
                {/* Subtle light shimmer on decrypt completion */}
                {isDecrypted && (
                  <motion.span
                    initial={{ opacity: 0.8, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 text-emerald-300 blur-[2px] pointer-events-none"
                  >
                    {targetTitle}
                  </motion.span>
                )}
              </span>

              {/* Blinking Live Shutter Indicator */}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="inline-block w-[3px] sm:w-[5px] h-[0.8em] bg-emerald-400 ml-2 align-middle shadow-[0_0_12px_rgba(52,211,153,0.9)]"
              />
            </h1>
          </div>

          {/* Hairline Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-3 py-1"
          >
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-sm sm:text-base md:text-lg text-zinc-300 font-light tracking-wide max-w-xl mx-auto leading-relaxed drop-shadow-md"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Viewfinder Telemetry Footer */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-widest text-zinc-500 uppercase mt-8 border-t border-white/10 pt-3">
          <div>
            <span>DIRECTOR OF PHOTOGRAPHY</span>
          </div>
          <div>
            <span>CINEMA &amp; STILLS</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Continuous Connecting Line Flowing Down Into Body */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative z-10 flex flex-col items-center cursor-pointer group mt-4"
        onClick={scrollToContent}
      >
        <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-400 uppercase group-hover:text-white transition-colors mb-2">
          EXPLORE
        </span>
        
        {/* Animated Connecting Line with Pulsing Light Beam */}
        <div className="w-px h-16 sm:h-20 bg-gradient-to-b from-white/40 via-white/20 to-transparent relative overflow-hidden">
          <motion.div
            className="w-full h-1/2 bg-gradient-to-b from-transparent via-white to-transparent"
            animate={{ y: ['-100%', '200%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>
      </motion.div>
    </section>
  )
}
