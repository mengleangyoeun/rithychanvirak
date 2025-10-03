'use client'

import { Search, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen unified-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <h1
            className="text-[150px] sm:text-[200px] font-black text-white/10 leading-none"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12"
        >
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-blue-500" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Page Not Found
          </h2>

          <p className="text-white/70 text-lg mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </motion.button>

            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/90 rounded-xl transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </motion.div>
            </Link>

            <Link href="/gallery">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                <Search className="w-4 h-4" />
                Browse Gallery
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-20 h-20 border-2 border-white/10 rounded-2xl rotate-12 hidden lg:block"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-cyan-400/20 rounded-full hidden lg:block"
        />
      </motion.div>
    </div>
  )
}
