'use client'

import Image from 'next/image'
import { Award, Camera, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import { CSSProperties } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

// TypeScript interfaces for about page data
interface Experience {
  title: string
  organization: string
  period: string
  description?: string
}

interface Award {
  title: string
  organization: string
  year: string
}

interface EquipmentCategory {
  category: string
  items: string[]
}

interface Skill {
  _key: string
  name: string
  icon?: string
}

interface AboutData {
  title?: string
  name?: string
  tagline?: string
  bio?: string
  profile_image_url?: string
  experience?: Experience[]
  skills?: Skill[]
  awards?: Award[]
  equipment?: EquipmentCategory[]
}

async function getAboutData(): Promise<AboutData | null> {
  try {
    const supabase = createClient()

    // Fetch main about content
    const { data: aboutContent, error: aboutError } = await supabase
      .from('about_content')
      .select('*')
      .eq('is_active', true)
      .single()

    if (aboutError || !aboutContent) {
      console.error('Error fetching about content:', aboutError)
      return null
    }

    // Fetch related data
    const [experienceRes, skillsRes, awardsRes, equipmentCategoriesRes] = await Promise.all([
      supabase.from('about_experience').select('*').eq('about_content_id', aboutContent.id).order('order'),
      supabase.from('about_skills').select('*').eq('about_content_id', aboutContent.id).order('order'),
      supabase.from('about_awards').select('*').eq('about_content_id', aboutContent.id).order('order'),
      supabase.from('about_equipment_categories').select('*').eq('about_content_id', aboutContent.id).order('order')
    ])

    // Fetch equipment items for each category
    const equipmentCategories = equipmentCategoriesRes.data || []
    const equipmentWithItems = await Promise.all(
      equipmentCategories.map(async (category) => {
        const { data: items } = await supabase
          .from('about_equipment_items')
          .select('*')
          .eq('equipment_category_id', category.id)
          .order('order')

        return {
          category: category.category,
          items: items?.map(item => item.item) || []
        }
      })
    )

    return {
      title: aboutContent.title,
      name: aboutContent.name,
      tagline: aboutContent.tagline,
      bio: aboutContent.bio,
      profile_image_url: aboutContent.profile_image_url,
      experience: experienceRes.data?.map(exp => ({
        title: exp.title,
        organization: exp.organization,
        period: exp.period,
        description: exp.description
      })) || [],
      skills: skillsRes.data?.map(skill => ({
        _key: skill.id,
        name: skill.name,
        icon: skill.icon
      })) || [],
      awards: awardsRes.data?.map(award => ({
        title: award.title,
        organization: award.organization,
        year: award.year
      })) || [],
      equipment: equipmentWithItems
    }
  } catch (error) {
    console.error('Error fetching about data:', error)
    return null
  }
}

export default function AboutPage() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAboutData().then(data => {
      setAboutData(data)
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
        staggerChildren: 0.1
      }
    }
  }

  // Removed unused scaleIn animation

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8">
          <Skeleton className="w-full h-full rounded-full" />
        </div>
      </div>
    )
  }

  if (!aboutData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div {...fadeInUp} className="text-center">
          <h1 className="text-4xl font-bold mb-4">About</h1>
          <p className="text-muted-foreground">About information not available yet.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen unified-background">
      
      {/* Modern Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 overflow-hidden">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-20 items-center">
            
            {/* Modern Profile Image */}
            <motion.div
              {...fadeInUp}
              className="relative order-2 lg:order-1"
            >
              <div className="relative w-80 h-80 lg:w-96 lg:h-96 xl:w-[30rem] xl:h-[30rem] mx-auto">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="relative w-full h-full group"
                >
                  {/* Modern geometric frame */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-cyan-500/20 rounded-3xl blur-xl"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>

                  {/* Floating geometric shapes */}
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
                    className="absolute -top-8 -right-8 w-16 h-16 border-2 border-blue-400/60 rounded-2xl rotate-12 z-10"
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
                    className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-full opacity-80 z-10"
                  />

                  <motion.div
                    animate={{
                      rotate: [0, -90, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-8 -left-4 w-8 h-8 border-2 border-cyan-400/60 rotate-45 z-10"
                  />

                  {/* Modern camera icon */}
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -top-6 right-8 w-14 h-14 bg-card/80 backdrop-blur-xl border border-foreground/20 rounded-2xl flex items-center justify-center z-20 shadow-2xl group-hover:shadow-blue-500/20 transition-shadow duration-500"
                  >
                    <Camera className="w-7 h-7 text-blue-400" />
                  </motion.div>

                  {/* Profile image */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-full h-full overflow-hidden rounded-3xl shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-700 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"
                  >
                    {aboutData.profile_image_url ? (
                      <Image
                        src={aboutData.profile_image_url}
                        alt={`${aboutData.name} profile`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Camera className="w-24 h-24 text-blue-400" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-blue-500/5 rounded-3xl"></div>
                  </motion.div>

                  {/* Decorative corner elements */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-blue-400/60 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-purple-400/60 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-blue-400/60 rounded-br-lg"></div>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Bio Content */}
            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="space-y-8 lg:space-y-12 order-1 lg:order-2"
            >
              {aboutData.name && (
                <motion.div
                  {...fadeInUp}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight text-foreground tracking-tighter mb-4">
                    Hello,<br />
                    I&apos;m <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">{aboutData.name.split(' ')[0]}</span>
                  </h1>
                  
                  <div className="flex items-center gap-4 mt-6">
                    <div className="w-12 h-px bg-gradient-to-r from-foreground to-transparent"></div>
                    <div className="w-3 h-3 bg-foreground rounded-full animate-pulse"></div>
                    <div className="w-12 h-px bg-gradient-to-l from-foreground to-transparent"></div>
                  </div>
                </motion.div>
              )}
              
              {aboutData.tagline && (
                <motion.p
                  {...fadeInUp}
                  transition={{ delay: 0.4 }}
                  className="text-xl lg:text-2xl text-foreground/80 leading-relaxed font-medium max-w-2xl"
                >
                  {aboutData.tagline}
                </motion.p>
              )}
              
              {aboutData.bio && (
                <motion.div
                  {...fadeInUp}
                  transition={{ delay: 0.5 }}
                  className="prose prose-lg prose-invert max-w-none leading-relaxed text-foreground/75"
                  style={{
                    '--tw-prose-body': 'rgba(255, 255, 255, 0.75)',
                    '--tw-prose-headings': 'rgb(var(--foreground))',
                  } as CSSProperties & { [key: string]: string }}
                >
                  <p>{aboutData.bio}</p>
                </motion.div>
              )}

              <motion.div
                {...fadeInUp}
                transition={{ delay: 0.6 }}
                className="pt-6"
              >
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-foreground text-background border border-foreground inline-flex items-center px-8 py-4 font-bold tracking-wide hover:bg-transparent hover:text-foreground transition-all duration-300 rounded-xl shadow-lg"
                >
                  LET&apos;S WORK TOGETHER!
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Skills Section */}
      {aboutData.skills && aboutData.skills.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-8 h-px bg-foreground"></div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  Skills & <span className="italic font-light">Expertise</span>
                </h2>
                <div className="w-8 h-px bg-foreground"></div>
              </div>
              <p className="text-foreground/75 text-lg max-w-xl mx-auto">
                Technical skills and creative expertise I bring to every project
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {aboutData.skills.map((skill: Skill) => (
                <motion.div
                  key={skill._key}
                  variants={{
                    initial: { opacity: 0, y: 30, scale: 0.9 },
                    animate: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="bg-card border border-border rounded-2xl text-center py-6 px-4 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-foreground transition-colors duration-300">
                    {skill.icon ? (
                      <span className="text-2xl">{skill.icon}</span>
                    ) : (
                      <div className="w-6 h-6 bg-foreground rounded group-hover:bg-background transition-colors duration-300"></div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground group-hover:text-blue-500 transition-colors duration-300 leading-tight">{skill.name}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Enhanced Experience Section */}
      {aboutData.experience && aboutData.experience.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-8 h-px bg-foreground"></div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  Professional <span className="italic font-light">Experience</span>
                </h2>
                <div className="w-8 h-px bg-foreground"></div>
              </div>
              <p className="text-foreground/75 text-lg max-w-xl mx-auto">
                My journey through various roles and achievements in photography
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="space-y-8"
            >
              {aboutData.experience.map((exp: Experience, index: number) => (
                <motion.div
                  key={index}
                  variants={{
                    initial: { opacity: 0, x: -50 },
                    animate: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ x: 8 }}
                  className="relative"
                >
                  <div className="bg-card border border-border rounded-2xl p-8 ml-8 relative hover:shadow-xl transition-all duration-300 group">
                    {/* Timeline dot */}
                    <div className="absolute w-6 h-6 bg-foreground rounded-full -left-4 top-8 border-4 border-background group-hover:scale-125 transition-transform duration-300"></div>
                    
                    {/* Timeline line */}
                    {aboutData.experience && index < aboutData.experience.length - 1 && (
                      <div className="absolute w-px h-16 bg-border -left-[7px] top-14"></div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2 group-hover:text-blue-500 transition-colors duration-300">
                          {exp.title}
                        </h3>
                        <p className="text-foreground/80 font-medium mb-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-blue-400 font-semibold">{exp.organization}</span>
                          <span className="hidden sm:block w-2 h-2 bg-foreground/60 rounded-full"></span>
                          <span className="text-foreground/70">{exp.period}</span>
                        </p>
                      </div>
                      
                      {exp.description && (
                        <p className="text-foreground/75 leading-relaxed text-lg">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Enhanced Awards Section */}
      {aboutData.awards && aboutData.awards.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-8 h-px bg-foreground"></div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  Awards & <span className="italic font-light">Recognition</span>
                </h2>
                <div className="w-8 h-px bg-foreground"></div>
              </div>
              <p className="text-foreground/75 text-lg max-w-xl mx-auto">
                Recognition and achievements throughout my photography career
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {aboutData.awards.map((award: Award, index: number) => (
                <motion.div
                  key={index}
                  variants={{
                    initial: { opacity: 0, y: 40, scale: 0.9 },
                    animate: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ y: -12, scale: 1.05 }}
                  className="bg-card border border-border rounded-2xl text-center p-8 hover:shadow-2xl transition-all duration-500 group"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg lg:text-xl mb-4 text-foreground group-hover:text-yellow-500 transition-colors duration-300 leading-tight">
                    {award.title}
                  </h3>
                  <p className="text-blue-400 font-medium mb-2">
                    {award.organization}
                  </p>
                  <p className="text-sm text-foreground/70 bg-secondary px-3 py-1 rounded-full inline-block">
                    {award.year}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Enhanced Equipment Section */}
      {aboutData.equipment && aboutData.equipment.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="py-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="w-8 h-px bg-foreground"></div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  Professional <span className="italic font-light">Equipment</span>
                </h2>
                <div className="w-8 h-px bg-foreground"></div>
              </div>
              <p className="text-foreground/75 text-lg max-w-xl mx-auto">
                The tools and gear I use to capture exceptional photography
              </p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {aboutData.equipment.map((category: EquipmentCategory, index: number) => (
                <motion.div
                  key={index}
                  variants={{
                    initial: { opacity: 0, y: 40 },
                    animate: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -8 }}
                  className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-blue-500 transition-colors duration-300">
                      {category.category}
                    </h3>
                  </div>
                  
                  <ul className="space-y-4">
                    {category.items.map((item: string, itemIndex: number) => (
                      <motion.li 
                        key={itemIndex} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        className="text-foreground/75 flex items-start group-hover:text-foreground transition-colors duration-300"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Enhanced Call to Action */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-24 bg-gradient-to-b from-background to-card"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-12 lg:p-16 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >            
              <h2 className="text-4xl lg:text-6xl font-black text-foreground leading-tight tracking-tighter">
                Ready to create<br />
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">something amazing?</span>
              </h2>
              
              <div className="flex items-center justify-center gap-4 my-8">
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-foreground to-transparent"></div>
                <div className="w-3 h-3 bg-foreground rounded-full animate-pulse"></div>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-foreground to-transparent"></div>
              </div>
              
              <p className="text-xl lg:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium">
                Have a project in mind? Let&apos;s discuss how we can work together.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-foreground text-background border border-foreground inline-flex items-center px-8 py-4 font-bold tracking-wide hover:bg-transparent hover:text-foreground transition-all duration-300 rounded-xl shadow-lg text-lg"
                >
                  LET&apos;S TALK
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                
                <motion.a
                  href="/gallery"
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="group bg-secondary text-foreground border border-border inline-flex items-center px-8 py-4 font-bold tracking-wide hover:bg-foreground hover:text-background transition-all duration-300 rounded-xl shadow-lg text-lg"
                >
                  VIEW PORTFOLIO
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  )
}