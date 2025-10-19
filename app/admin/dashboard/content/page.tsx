'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HeroContent, Service, AboutContent, AboutExperience, AboutSkill, AboutAward, AboutEquipmentCategory, AboutEquipmentItem, ContactInfo, SiteSettings } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CloudinaryUpload } from '@/components/cloudinary-upload'
import { Loader2, Save, Eye, Settings, User, Mail, MapPin, Globe, Phone, ArrowLeft, Home } from 'lucide-react'
import { toast } from 'sonner'
import NextImage from 'next/image'

export default function ContentManagementPage() {
  const supabase = createClient()

  // State for different content sections
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null)
  const [aboutExperience, setAboutExperience] = useState<AboutExperience[]>([])
  const [aboutSkills, setAboutSkills] = useState<AboutSkill[]>([])
  const [aboutAwards, setAboutAwards] = useState<AboutAward[]>([])
  const [aboutEquipmentCategories, setAboutEquipmentCategories] = useState<AboutEquipmentCategory[]>([])
  const [aboutEquipmentItems, setAboutEquipmentItems] = useState<AboutEquipmentItem[]>([])
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings[]>([])

  // Loading states
  const [loading, setLoading] = useState({
    hero: true,
    services: true,
    about: true,
    experience: true,
    skills: true,
    awards: true,
    equipment: true,
    contact: true,
    settings: true,
  })

  // Table existence check
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)

  // Check if tables exist
  const checkTablesExist = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('hero_content')
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }, [supabase])

  const loadAllContent = useCallback(async () => {
    try {
      // Load hero content
      const { data: heroData } = await supabase
        .from('hero_content')
        .select('*')
        .eq('is_active', true)
        .single()

      if (heroData) {
        setHeroContent(heroData)
        setHeroForm({
          title: heroData.title,
          subtitle: heroData.subtitle,
          background_image_url: heroData.background_image_url || '',
          background_image_id: heroData.background_image_id || '',
          overlay_opacity: heroData.overlay_opacity
        })
      }

      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true })

      setServices(servicesData || [])

      // Load about content
      const { data: aboutData } = await supabase
        .from('about_content')
        .select('*')
        .eq('is_active', true)
        .single()

      if (aboutData) {
        setAboutContent(aboutData)
        setAboutForm({
          title: aboutData.title,
          name: aboutData.name,
          tagline: aboutData.tagline || '',
          bio: aboutData.bio || '',
          profile_image_url: aboutData.profile_image_url || '',
          profile_image_id: aboutData.profile_image_id || ''
        })
      }

      // Load contact info
      const { data: contactData } = await supabase
        .from('contact_info')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true })

      setContactInfo(contactData || [])

      // Load experience
      const { data: experienceData } = await supabase
        .from('about_experience')
        .select('*')
        .order('order', { ascending: true })

      setAboutExperience(experienceData || [])

      // Load skills
      const { data: skillsData } = await supabase
        .from('about_skills')
        .select('*')
        .order('order', { ascending: true })

      setAboutSkills(skillsData || [])

      // Load awards
      const { data: awardsData } = await supabase
        .from('about_awards')
        .select('*')
        .order('order', { ascending: true })

      setAboutAwards(awardsData || [])

      // Load equipment categories
      const { data: equipmentCategoriesData } = await supabase
        .from('about_equipment_categories')
        .select('*')
        .order('order', { ascending: true })

      setAboutEquipmentCategories(equipmentCategoriesData || [])

      // Load equipment items
      const { data: equipmentItemsData } = await supabase
        .from('about_equipment_items')
        .select('*')
        .order('order', { ascending: true })

      setAboutEquipmentItems(equipmentItemsData || [])

      // Load site settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .order('key', { ascending: true })

      setSiteSettings(settingsData || [])

    } catch (error: unknown) {
      console.error('Error loading content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading({
        hero: false,
        services: false,
        about: false,
        experience: false,
        skills: false,
        awards: false,
        equipment: false,
        contact: false,
        settings: false
      })
    }
  }, [supabase])

  // Form states
  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    background_image_url: '',
    background_image_id: '',
    overlay_opacity: 0.5
  })

  const [serviceForm, setServiceForm] = useState({
    number: 0,
    title: '',
    description: '',
    icon: ''
  })

  const [aboutForm, setAboutForm] = useState({
    title: '',
    name: '',
    tagline: '',
    bio: '',
    profile_image_url: '',
    profile_image_id: ''
  })

  const [contactForm, setContactForm] = useState({
    type: 'email' as ContactInfo['type'],
    value: '',
    label: '',
    icon: ''
  })

  const [settingsForm, setSettingsForm] = useState({
    key: '',
    value: '',
    type: 'string' as SiteSettings['type'],
    description: ''
  })

  const [experienceForm, setExperienceForm] = useState({
    title: '',
    organization: '',
    period: '',
    description: ''
  })

  const [skillForm, setSkillForm] = useState({
    name: '',
    icon: ''
  })

  const [awardForm, setAwardForm] = useState({
    title: '',
    organization: '',
    year: ''
  })

  const [equipmentCategoryForm, setEquipmentCategoryForm] = useState({
    category: ''
  })

  const [equipmentItemForm, setEquipmentItemForm] = useState({
   item: '',
   equipment_category_id: ''
 })


  // Load all content on mount
  useEffect(() => {
    checkTablesExist().then(exist => {
      setTablesExist(exist)
      if (exist) {
        loadAllContent()
      } else {
        setLoading({
          hero: false,
          services: false,
          about: false,
          experience: false,
          skills: false,
          awards: false,
          equipment: false,
          contact: false,
          settings: false
        })
      }
    })
  }, [checkTablesExist, loadAllContent])



  // Save functions
  const saveHeroContent = async () => {
    try {
      setLoading(prev => ({ ...prev, hero: true }))

      const { error } = await supabase
        .from('hero_content')
        .upsert({
          id: heroContent?.id,
          title: heroForm.title,
          subtitle: heroForm.subtitle,
          background_image_url: heroForm.background_image_url || null,
          background_image_id: heroForm.background_image_id || null,
          overlay_opacity: heroForm.overlay_opacity,
          is_active: true
        })

      if (error) throw error

      toast.success('Hero content saved successfully')
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving hero content:', error)
      toast.error('Failed to save hero content')
    } finally {
      setLoading(prev => ({ ...prev, hero: false }))
    }
  }

  const saveService = async () => {
    try {
      setLoading(prev => ({ ...prev, services: true }))

      const { error } = await supabase
        .from('services')
        .insert({
          number: serviceForm.number,
          title: serviceForm.title,
          description: serviceForm.description,
          icon: serviceForm.icon || null,
          is_active: true,
          order: services.length
        })

      if (error) throw error

      toast.success('Service added successfully')
      setServiceForm({ number: 0, title: '', description: '', icon: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving service:', error)
      toast.error('Failed to save service')
    } finally {
      setLoading(prev => ({ ...prev, services: false }))
    }
  }

  const saveAboutContent = async () => {
    try {
      setLoading(prev => ({ ...prev, about: true }))

      const { error } = await supabase
        .from('about_content')
        .upsert({
          id: aboutContent?.id,
          title: aboutForm.title,
          name: aboutForm.name || 'Your Name',
          tagline: aboutForm.tagline || null,
          bio: aboutForm.bio || null,
          content: aboutForm.bio || null, // Backward compatibility
          profile_image_url: aboutForm.profile_image_url || null,
          profile_image_id: aboutForm.profile_image_id || null,
          is_active: true
        })

      if (error) throw error

      toast.success('About content saved successfully')
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving about content:', error)
      toast.error('Failed to save about content')
    } finally {
      setLoading(prev => ({ ...prev, about: false }))
    }
  }

  const saveContactInfo = async () => {
    try {
      setLoading(prev => ({ ...prev, contact: true }))

      const { error } = await supabase
        .from('contact_info')
        .insert({
          type: contactForm.type,
          value: contactForm.value,
          label: contactForm.label,
          icon: contactForm.icon || null,
          is_active: true,
          order: contactInfo.length
        })

      if (error) throw error

      toast.success('Contact info added successfully')
      setContactForm({ type: 'email', value: '', label: '', icon: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving contact info:', error)
      toast.error('Failed to save contact info')
    } finally {
      setLoading(prev => ({ ...prev, contact: false }))
    }
  }

  const saveSiteSetting = async () => {
    try {
      setLoading(prev => ({ ...prev, settings: true }))

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: settingsForm.key,
          value: settingsForm.value || null,
          type: settingsForm.type,
          description: settingsForm.description || null
        })

      if (error) throw error

      toast.success('Site setting saved successfully')
      setSettingsForm({ key: '', value: '', type: 'string', description: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving site setting:', error)
      toast.error('Failed to save site setting')
    } finally {
      setLoading(prev => ({ ...prev, settings: false }))
    }
  }

  const saveExperience = async () => {
    try {
      setLoading(prev => ({ ...prev, experience: true }))

      const { error } = await supabase
        .from('about_experience')
        .insert({
          title: experienceForm.title,
          organization: experienceForm.organization,
          period: experienceForm.period,
          description: experienceForm.description || null,
          about_content_id: aboutContent?.id,
          order: aboutExperience.length
        })

      if (error) throw error

      toast.success('Experience added successfully')
      setExperienceForm({ title: '', organization: '', period: '', description: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving experience:', error)
      toast.error('Failed to save experience')
    } finally {
      setLoading(prev => ({ ...prev, experience: false }))
    }
  }

  const saveSkill = async () => {
    try {
      setLoading(prev => ({ ...prev, skills: true }))

      const { error } = await supabase
        .from('about_skills')
        .insert({
          name: skillForm.name,
          icon: skillForm.icon || null,
          about_content_id: aboutContent?.id,
          order: aboutSkills.length
        })

      if (error) throw error

      toast.success('Skill added successfully')
      setSkillForm({ name: '', icon: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving skill:', error)
      toast.error('Failed to save skill')
    } finally {
      setLoading(prev => ({ ...prev, skills: false }))
    }
  }

  const saveAward = async () => {
    try {
      setLoading(prev => ({ ...prev, awards: true }))

      const { error } = await supabase
        .from('about_awards')
        .insert({
          title: awardForm.title,
          organization: awardForm.organization,
          year: awardForm.year,
          about_content_id: aboutContent?.id,
          order: aboutAwards.length
        })

      if (error) throw error

      toast.success('Award added successfully')
      setAwardForm({ title: '', organization: '', year: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving award:', error)
      toast.error('Failed to save award')
    } finally {
      setLoading(prev => ({ ...prev, awards: false }))
    }
  }

  const saveEquipmentCategory = async () => {
    try {
      setLoading(prev => ({ ...prev, equipment: true }))

      const { error } = await supabase
        .from('about_equipment_categories')
        .insert({
          category: equipmentCategoryForm.category,
          about_content_id: aboutContent?.id,
          order: aboutEquipmentCategories.length
        })

      if (error) throw error

      toast.success('Equipment category added successfully')
      setEquipmentCategoryForm({ category: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving equipment category:', error)
      toast.error('Failed to save equipment category')
    } finally {
      setLoading(prev => ({ ...prev, equipment: false }))
    }
  }

  const saveEquipmentItem = async () => {
    try {
      setLoading(prev => ({ ...prev, equipment: true }))

      const { error } = await supabase
        .from('about_equipment_items')
        .insert({
          item: equipmentItemForm.item,
          equipment_category_id: equipmentItemForm.equipment_category_id,
          order: aboutEquipmentItems.filter(item => item.equipment_category_id === equipmentItemForm.equipment_category_id).length
        })

      if (error) throw error

      toast.success('Equipment item added successfully')
      setEquipmentItemForm({ item: '', equipment_category_id: '' })
      await loadAllContent()
    } catch (error: unknown) {
      console.error('Error saving equipment item:', error)
      toast.error('Failed to save equipment item')
    } finally {
      setLoading(prev => ({ ...prev, equipment: false }))
    }
  }


  const getContactIcon = (type: ContactInfo['type']) => {
    switch (type) {
      case 'email': return Mail
      case 'phone': return Phone
      case 'instagram': return Eye
      case 'website': return Globe
      case 'location': return MapPin
      default: return Settings
    }
  }

  return (
    <div className="space-y-8">
      {/* Database Migration Warning */}
      {tablesExist === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Database Migration Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The CMS database tables haven&apos;t been created yet. Please run the migration SQL below in your Supabase dashboard.</p>
                <div className="mt-3 space-y-2">
                  <div className="bg-yellow-100 p-3 rounded font-mono text-xs text-yellow-900 max-h-32 overflow-y-auto">
                    {`-- Copy this SQL and run it in Supabase Dashboard > SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE hero_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'RITHY CHANVIRAK',
  subtitle TEXT NOT NULL DEFAULT 'Professional Photography Portfolio',
  background_image_url TEXT,
  background_image_id TEXT,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ... (additional tables and policies)`}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(`-- Copy and run this in Supabase Dashboard > SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE hero_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'RITHY CHANVIRAK',
  subtitle TEXT NOT NULL DEFAULT 'Professional Photography Portfolio',
  background_image_url TEXT,
  background_image_id TEXT,
  overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional tables, indexes, policies, and default data...
-- See database_migration.sql file for complete SQL`)}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Copy SQL
                    </button>
                    <button
                      onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Open Supabase
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your website&apos;s frontend content including hero sections, services, about page, experience, skills, awards, equipment, and contact information.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <a href="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Home className="w-4 h-4 mr-2" />
              View Website
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Hero Content Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Manage the main hero section that appears on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero-title">Title</Label>
                    <Input
                      id="hero-title"
                      value={heroForm.title}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter hero title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero-subtitle">Subtitle</Label>
                    <Textarea
                      id="hero-subtitle"
                      value={heroForm.subtitle}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Enter hero subtitle"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overlay-opacity">Overlay Opacity</Label>
                    <Input
                      id="overlay-opacity"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={heroForm.overlay_opacity}
                      onChange={(e) => setHeroForm(prev => ({ ...prev, overlay_opacity: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Image</Label>
                    <CloudinaryUpload
                      onUploadComplete={(result) => {
                        setHeroForm(prev => ({
                          ...prev,
                          background_image_url: result.image_url,
                          background_image_id: result.image_id
                        }))
                      }}
                      currentImageUrl={heroForm.background_image_url}
                      currentImageId={heroForm.background_image_id}
                    />
                  </div>

                  {heroForm.background_image_url && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                      <NextImage
                        src={heroForm.background_image_url}
                        alt="Hero background preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={saveHeroContent}
                  disabled={loading.hero}
                  className="min-w-32"
                >
                  {loading.hero && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Hero Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Manage the services displayed on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Service */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add New Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-number">Number</Label>
                    <Input
                      id="service-number"
                      type="number"
                      value={serviceForm.number}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, number: parseInt(e.target.value) }))}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-icon">Icon (Emoji)</Label>
                    <Input
                      id="service-icon"
                      value={serviceForm.icon}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="💍"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-title">Title</Label>
                  <Input
                    id="service-title"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Service title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea
                    id="service-description"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Service description"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={saveService}
                  disabled={loading.services || !serviceForm.title.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.services && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Service
                </Button>
              </div>

              {/* Existing Services */}
              <div className="space-y-4">
                <h3 className="font-semibold">Existing Services</h3>
                {services.length === 0 ? (
                  <p className="text-muted-foreground">No services added yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{service.icon || '📷'}</div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{service.title}</h4>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary">#{service.number}</Badge>
                                  <Badge variant={service.is_active ? "default" : "secondary"}>
                                    {service.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={service.is_active}
                                onCheckedChange={async (checked) => {
                                  try {
                                    const { error } = await supabase
                                      .from('services')
                                      .update({ is_active: checked })
                                      .eq('id', service.id)

                                    if (error) throw error
                                    await loadAllContent()
                                    toast.success(`Service ${checked ? 'activated' : 'deactivated'}`)
                                  } catch (error) {
                                    console.error('Error updating service status:', error)
                                    toast.error('Failed to update service status')
                                  }
                                }}
                              />
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                About Page Content
              </CardTitle>
              <CardDescription>
                Manage the content displayed on your about page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="about-title">Page Title</Label>
                    <Input
                      id="about-title"
                      value={aboutForm.title}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="About Me"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about-name">Name</Label>
                    <Input
                      id="about-name"
                      value={aboutForm.name}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about-tagline">Tagline</Label>
                    <Input
                      id="about-tagline"
                      value={aboutForm.tagline}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Professional Photographer & Visual Storyteller"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about-bio">Bio</Label>
                    <Textarea
                      id="about-bio"
                      value={aboutForm.bio}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell your story..."
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <CloudinaryUpload
                      onUploadComplete={(result) => {
                        setAboutForm(prev => ({
                          ...prev,
                          profile_image_url: result.image_url,
                          profile_image_id: result.image_id
                        }))
                      }}
                      currentImageUrl={aboutForm.profile_image_url}
                      currentImageId={aboutForm.profile_image_id}
                    />
                  </div>

                  {aboutForm.profile_image_url && (
                    <div className="relative aspect-square rounded-lg overflow-hidden border">
                      <NextImage
                        src={aboutForm.profile_image_url}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={saveAboutContent}
                  disabled={loading.about}
                  className="min-w-32"
                >
                  {loading.about && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save About Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Manage contact details displayed across your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Contact */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-type">Type</Label>
                    <Select
                      value={contactForm.type}
                      onValueChange={(value: ContactInfo['type']) => setContactForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-icon">Icon (Emoji)</Label>
                    <Input
                      id="contact-icon"
                      value={contactForm.icon}
                      onChange={(e) => setContactForm(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="📧"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-label">Label</Label>
                    <Input
                      id="contact-label"
                      value={contactForm.label}
                      onChange={(e) => setContactForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-value">Value</Label>
                    <Input
                      id="contact-value"
                      value={contactForm.value}
                      onChange={(e) => setContactForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="hello@example.com"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveContactInfo}
                  disabled={loading.contact || !contactForm.label.trim() || !contactForm.value.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.contact && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Contact Info
                </Button>
              </div>

              {/* Existing Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                {contactInfo.length === 0 ? (
                  <p className="text-muted-foreground">No contact information added yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {contactInfo.map((contact) => {
                      const Icon = getContactIcon(contact.type)
                      return (
                        <Card key={contact.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-xl">{contact.icon || <Icon className="w-5 h-5" />}</div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{contact.label}</h4>
                                  <p className="text-sm text-muted-foreground">{contact.value}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{contact.type}</Badge>
                                    <Badge variant={contact.is_active ? "default" : "secondary"}>
                                      {contact.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={contact.is_active}
                                  onCheckedChange={async (checked) => {
                                    try {
                                      const { error } = await supabase
                                        .from('contact_info')
                                        .update({ is_active: checked })
                                        .eq('id', contact.id)

                                      if (error) throw error
                                      await loadAllContent()
                                      toast.success(`Contact info ${checked ? 'activated' : 'deactivated'}`)
                                    } catch (error) {
                                      console.error('Error updating contact status:', error)
                                      toast.error('Failed to update contact status')
                                    }
                                  }}
                                />
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Experience</CardTitle>
              <CardDescription>
                Manage your professional experience and career highlights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Experience */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-title">Title</Label>
                    <Input
                      id="exp-title"
                      value={experienceForm.title}
                      onChange={(e) => setExperienceForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Job Title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exp-organization">Organization</Label>
                    <Input
                      id="exp-organization"
                      value={experienceForm.organization}
                      onChange={(e) => setExperienceForm(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-period">Period</Label>
                    <Input
                      id="exp-period"
                      value={experienceForm.period}
                      onChange={(e) => setExperienceForm(prev => ({ ...prev, period: e.target.value }))}
                      placeholder="2020 - Present"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exp-description">Description</Label>
                  <Textarea
                    id="exp-description"
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your role and achievements..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={saveExperience}
                  disabled={loading.experience || !experienceForm.title.trim() || !experienceForm.organization.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.experience && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Experience
                </Button>
              </div>

              {/* Existing Experience */}
              <div className="space-y-4">
                <h3 className="font-semibold">Experience</h3>
                {aboutExperience.length === 0 ? (
                  <p className="text-muted-foreground">No experience added yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {aboutExperience.map((exp) => (
                      <Card key={exp.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{exp.title}</h4>
                              <p className="text-blue-400 font-medium">{exp.organization}</p>
                              <p className="text-sm text-muted-foreground">{exp.period}</p>
                              {exp.description && (
                                <p className="text-sm mt-2">{exp.description}</p>
                              )}
                              <Badge variant="secondary" className="mt-2">Order: {exp.order}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>
                Manage your technical skills and creative expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Skill */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Skill</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill-name">Skill Name</Label>
                    <Input
                      id="skill-name"
                      value={skillForm.name}
                      onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Photography"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-icon">Icon (Emoji)</Label>
                    <Input
                      id="skill-icon"
                      value={skillForm.icon}
                      onChange={(e) => setSkillForm(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="📸"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveSkill}
                  disabled={loading.skills || !skillForm.name.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.skills && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Skill
                </Button>
              </div>

              {/* Existing Skills */}
              <div className="space-y-4">
                <h3 className="font-semibold">Skills</h3>
                {aboutSkills.length === 0 ? (
                  <p className="text-muted-foreground">No skills added yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {aboutSkills.map((skill) => (
                      <Card key={skill.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{skill.icon || '💡'}</div>
                              <div className="flex-1">
                                <span className="font-semibold">{skill.name}</span>
                                <Badge variant="secondary" className="ml-2">Order: {skill.order}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Awards & Recognition</CardTitle>
              <CardDescription>
                Manage your awards, certifications, and professional recognition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Award */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Award</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="award-title">Award Title</Label>
                    <Input
                      id="award-title"
                      value={awardForm.title}
                      onChange={(e) => setAwardForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Best Photographer 2024"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="award-organization">Organization</Label>
                    <Input
                      id="award-organization"
                      value={awardForm.organization}
                      onChange={(e) => setAwardForm(prev => ({ ...prev, organization: e.target.value }))}
                      placeholder="Photography Association"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="award-year">Year</Label>
                    <Input
                      id="award-year"
                      value={awardForm.year}
                      onChange={(e) => setAwardForm(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2024"
                    />
                  </div>
                </div>

                <Button
                  onClick={saveAward}
                  disabled={loading.awards || !awardForm.title.trim() || !awardForm.organization.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.awards && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Award
                </Button>
              </div>

              {/* Existing Awards */}
              <div className="space-y-4">
                <h3 className="font-semibold">Awards</h3>
                {aboutAwards.length === 0 ? (
                  <p className="text-muted-foreground">No awards added yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {aboutAwards.map((award) => (
                      <Card key={award.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{award.title}</h4>
                              <p className="text-blue-400 font-medium">{award.organization}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{award.year}</Badge>
                                <Badge variant="outline">Order: {award.order}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Equipment</CardTitle>
              <CardDescription>
                Manage your photography equipment and gear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Equipment Category */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Equipment Category</h3>
                <div className="space-y-2">
                  <Label htmlFor="equipment-category">Category Name</Label>
                  <Input
                    id="equipment-category"
                    value={equipmentCategoryForm.category}
                    onChange={(e) => setEquipmentCategoryForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Cameras"
                  />
                </div>

                <Button
                  onClick={saveEquipmentCategory}
                  disabled={loading.equipment || !equipmentCategoryForm.category.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.equipment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Category
                </Button>
              </div>

              {/* Add Equipment Item */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Equipment Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equipment-item">Item Name</Label>
                    <Input
                      id="equipment-item"
                      value={equipmentItemForm.item}
                      onChange={(e) => setEquipmentItemForm(prev => ({ ...prev, item: e.target.value }))}
                      placeholder="Canon EOS R5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="equipment-category-select">Category</Label>
                    <Select
                      value={equipmentItemForm.equipment_category_id}
                      onValueChange={(value) => setEquipmentItemForm(prev => ({ ...prev, equipment_category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {aboutEquipmentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={saveEquipmentItem}
                  disabled={loading.equipment || !equipmentItemForm.item.trim() || !equipmentItemForm.equipment_category_id}
                  className="w-full md:w-auto"
                >
                  {loading.equipment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Equipment Item
                </Button>
              </div>

              {/* Existing Equipment */}
              <div className="space-y-4">
                <h3 className="font-semibold">Equipment</h3>
                {aboutEquipmentCategories.length === 0 ? (
                  <p className="text-muted-foreground">No equipment categories added yet.</p>
                ) : (
                  <div className="grid gap-6">
                    {aboutEquipmentCategories.map((category) => {
                      const items = aboutEquipmentItems.filter(item => item.equipment_category_id === category.id)
                      return (
                        <Card key={category.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{category.category}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {items.length === 0 ? (
                              <p className="text-muted-foreground">No items in this category.</p>
                            ) : (
                              <ul className="space-y-2">
                                {items.map((item) => (
                                  <li key={item.id} className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <span className="font-medium">{item.item}</span>
                                      <Badge variant="outline" className="ml-2">Order: {item.order}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="default">Active</Badge>
                                      <Button variant="outline" size="sm">
                                        Edit
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Site Settings
              </CardTitle>
              <CardDescription>
                Global site configuration and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Setting */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Add Site Setting</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setting-key">Setting Key</Label>
                    <Input
                      id="setting-key"
                      value={settingsForm.key}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="site_title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setting-type">Type</Label>
                    <Select
                      value={settingsForm.type}
                      onValueChange={(value: SiteSettings['type']) => setSettingsForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setting-value">Value</Label>
                  <Input
                    id="setting-value"
                    value={settingsForm.value}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Setting value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setting-description">Description</Label>
                  <Input
                    id="setting-description"
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <Button
                  onClick={saveSiteSetting}
                  disabled={loading.settings || !settingsForm.key.trim()}
                  className="w-full md:w-auto"
                >
                  {loading.settings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Setting
                </Button>
              </div>

              {/* Existing Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Site Settings</h3>
                {siteSettings.length === 0 ? (
                  <p className="text-muted-foreground">No settings configured yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {siteSettings.map((setting) => (
                      <Card key={setting.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{setting.key}</h4>
                              <p className="text-sm text-muted-foreground">{setting.value}</p>
                              {setting.description && (
                                <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                              )}
                              <Badge variant="outline" className="mt-1">{setting.type}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}