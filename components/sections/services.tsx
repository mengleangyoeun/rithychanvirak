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
    <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 sm:p-10 hover:border-zinc-700/80 transition-colors duration-500 relative flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-medium tracking-tight text-white uppercase mb-2">
          Services
        </h2>
        <p className="text-zinc-400 text-sm">
          Professional photography and videography services.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.slice(0, 4).map((service, index) => (
          <motion.div
            key={service._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
          >
            {/* Number watermark */}
            <div className="absolute top-4 right-4 text-4xl font-bold text-white/5 group-hover:text-white/10 transition-colors duration-300">
              {String(service.number).padStart(2, '0')}
            </div>

            {/* Icon */}
            {service.icon && (
              <div className="text-3xl mb-4 text-zinc-300">
                {service.icon}
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-medium text-white mb-2 relative z-10">
              {service.title}
            </h3>

            {/* Description */}
            <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
