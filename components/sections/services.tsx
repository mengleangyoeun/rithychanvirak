'use client'

import { motion } from 'motion/react'

interface Service {
  _id: string
  number: number
  title: string
  description: string
  icon?: string
}

export function Services({ services }: { services: Service[] }) {
  if (!services || services.length === 0) return null

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-[0.08em] sm:tracking-[0.1em] uppercase mb-4 sm:mb-6 px-4"
            style={{ fontFamily: 'var(--font-livvic), sans-serif' }}
          >
            My Services
          </h2>
          <motion.div
            className="w-16 sm:w-24 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full mx-auto mb-4 sm:mb-6"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          />
          <p className="text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            Professional photography and videography services tailored to capture your unique vision
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -12, scale: 1.02 }}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all duration-500"
            >
              {/* Number watermark */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-5xl sm:text-6xl md:text-7xl font-black text-white/5 group-hover:text-white/10 group-hover:scale-110 transition-all duration-500" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                {String(service.number).padStart(2, '0')}
              </div>

              {/* Icon */}
              {service.icon && (
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {service.icon}
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 tracking-wide relative z-10" style={{ fontFamily: 'var(--font-livvic), sans-serif' }}>
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 relative z-10">
                {service.description}
              </p>

              {/* Animated underline */}
              <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute inset-0 w-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full group-hover:w-full transition-all duration-700 ease-out"></div>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent pointer-events-none"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
