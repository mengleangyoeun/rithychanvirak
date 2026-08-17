'use client'

import Image from 'next/image'
import { Award, Camera, ArrowUpRight, CheckCircle2, MapPin, Film, Briefcase, ChevronRight, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Experience {
  title: string
  organization: string
  period: string
  description?: string
}

interface AwardType {
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
  awards?: AwardType[]
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

    // Fetch equipment items for all categories
    const equipmentCategories = equipmentCategoriesRes.data || []
    const categoryIds = equipmentCategories.map(c => c.id)

    const { data: allEquipmentItems } = categoryIds.length > 0
      ? await supabase
        .from('about_equipment_items')
        .select('*')
        .in('equipment_category_id', categoryIds)
        .order('order')
      : { data: [] }

    // Group items by category
    const itemsByCategory = new Map<string, string[]>()
    for (const item of allEquipmentItems || []) {
      const list = itemsByCategory.get(item.equipment_category_id) || []
      list.push(item.item)
      itemsByCategory.set(item.equipment_category_id, list)
    }

    const equipmentWithItems = equipmentCategories.map(category => ({
      category: category.category,
      items: itemsByCategory.get(category.id) || []
    }))

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030303] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 aspect-[4/5] rounded-3xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-8 w-48 bg-zinc-900" />
            <Skeleton className="h-14 w-full bg-zinc-900" />
            <Skeleton className="h-28 w-full bg-zinc-900" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-20 w-full bg-zinc-900" />
              <Skeleton className="h-20 w-full bg-zinc-900" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!aboutData) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2">About</h1>
          <p className="text-zinc-500 text-sm mb-6">Profile information is currently being updated.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const paragraphs = aboutData.bio ? aboutData.bio.split('\n\n').filter(Boolean) : []

  return (
    <main className="min-h-screen bg-[#030303] text-zinc-100">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-28 space-y-20 sm:space-y-28">

        {/* Section 1: Hero Profile & Artistic Bio */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

          {/* Left: Editorial Portrait Card */}
          <div className="lg:col-span-5 relative group">
            <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl">
              {aboutData.profile_image_url ? (
                <Image
                  src={aboutData.profile_image_url}
                  alt={`${aboutData.name || 'Photographer'} portrait`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600">
                  <Camera className="w-16 h-16 mb-2" />
                  <span className="text-xs uppercase tracking-widest">Portrait</span>
                </div>
              )}

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Floating Bottom Card Over Portrait */}
              <div className="absolute bottom-4 inset-x-4 p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {aboutData.name || 'Rithy Chanvirak'}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      Phnom Penh, Cambodia
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Travels Throughout Cambodia
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Bio & Artistic Vision */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Header Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
                <Film className="w-3.5 h-3.5 text-zinc-400" />
                Director of Photography & Visual Storyteller
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                {aboutData.title || `Capturing timeless narratives through the lens`}
              </h1>

              {/* Tagline / Subheading */}
              {aboutData.tagline && (
                <p className="text-lg sm:text-xl text-zinc-300 font-medium leading-relaxed">
                  &ldquo;{aboutData.tagline}&rdquo;
                </p>
              )}

              {/* Bio Paragraphs */}
              <div className="space-y-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))
                ) : (
                  <p>{aboutData.bio}</p>
                )}
              </div>
            </div>

            {/* Quick Stats / Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-zinc-800/80">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/70">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">4+</div>
                <div className="text-xs text-zinc-400 mt-0.5">Years Experience</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/70">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">50+</div>
                <div className="text-xs text-zinc-400 mt-0.5">Film & Photo Sets</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">100%</div>
                <div className="text-xs text-zinc-400 mt-0.5">Custom Color & Craft</div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all duration-300 shadow-xl group"
              >
                <span>Initiate a Project</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
              >
                View Works
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Disciplines & Specialized Skills */}
        {aboutData.skills && aboutData.skills.length > 0 && (
          <section className="p-8 sm:p-12 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Disciplines</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  Creative & Technical Expertise
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
                From pre-production creative direction through high-fidelity cinema mastering.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {aboutData.skills.map((skill) => (
                <div
                  key={skill._key}
                  className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white text-sm">
                    {skill.icon || <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Professional Experience & Career Milestones */}
        {aboutData.experience && aboutData.experience.length > 0 && (
          <section className="space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Trajectory</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Selected Experience & Productions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {aboutData.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {exp.period}
                      </span>
                      <Briefcase className="w-4 h-4 text-zinc-600" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {exp.title}
                    </h3>
                    <p className="text-sm font-medium text-zinc-400 mt-1">
                      {exp.organization}
                    </p>

                    {exp.description && (
                      <p className="text-xs sm:text-sm text-zinc-400 mt-3 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Awards & Recognition */}
        {aboutData.awards && aboutData.awards.length > 0 && (
          <section className="space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Accolades</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Honors & Industry Recognition
              </h2>
            </div>

            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950 overflow-hidden divide-y divide-zinc-800/60 shadow-xl">
              {aboutData.awards.map((award, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {award.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                        {award.organization}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 self-start sm:self-center">
                    {award.year}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Production Gear & Technical Arsenal */}
        {aboutData.equipment && aboutData.equipment.length > 0 && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Equipment</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  Camera Systems & Production Gear
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm">
                Industry-standard cinema cameras, prime optics, lighting, and aerial systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {aboutData.equipment.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-7 rounded-3xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 space-y-4"
                >
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                    <Camera className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {cat.category}
                    </h3>
                  </div>

                  <ul className="space-y-2.5">
                    {cat.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2 shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Editorial Collaboration Callout Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-14 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Let&apos;s bring your cinematic vision to life
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Available for commercial productions, editorial photography, and documentary projects across Cambodia.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors shadow-2xl"
            >
              <Mail className="w-4 h-4" />
              <span>Get in Touch</span>
            </Link>
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span>Explore Films</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </main>
  )
}