export interface Photo {
  id: string
  title: string
  image_url: string
  image_id: string
  image_width?: number
  image_height?: number
  alt?: string
  caption?: string
  description?: string
  camera?: string
  lens?: string
  settings?: {
    aperture?: string
    shutter?: string
    iso?: string
    focalLength?: string
  }
  location?: string
  date_taken?: string
  featured?: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  title: string
  slug: string
  video_url: string
  video_type: 'youtube' | 'vimeo' | 'googledrive' | 'direct'
  thumbnail_url?: string
  description?: string
  category?: string
  year?: number
  tags?: string[]
  is_active: boolean
  featured?: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface VideoStoryboard {
  id: string
  video_id: string
  image_url: string
  image_id: string
  alt?: string
  caption?: string
  order: number
  created_at: string
}

export interface Collection {
  id: string
  title: string
  slug: string
  description?: string
  cover_image_url?: string
  parent_id?: string
  featured?: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface CollectionPhoto {
  id: string
  collection_id: string
  photo_id: string
  order: number
  created_at: string
}

export interface CollectionWithPhotos extends Collection {
  photos: Photo[]
}

export interface CollectionWithChildren extends Collection {
  children?: Collection[]
  photos?: Photo[]
}

export interface VideoWithStoryboard extends Video {
  storyboard: VideoStoryboard[]
}

// Frontend Content Management Types
export interface HeroContent {
  id: string
  title: string
  subtitle: string
  background_image_url?: string
  background_image_id?: string
  overlay_opacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  number: number
  title: string
  description: string
  icon?: string
  is_active: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface AboutContent {
  id: string
  title: string
  name: string
  tagline?: string
  bio?: string
  profile_image_url?: string
  profile_image_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AboutExperience {
  id: string
  about_content_id: string
  title: string
  organization: string
  period: string
  description?: string
  order: number
  created_at: string
  updated_at: string
}

export interface AboutSkill {
  id: string
  about_content_id: string
  name: string
  icon?: string
  order: number
  created_at: string
  updated_at: string
}

export interface AboutAward {
  id: string
  about_content_id: string
  title: string
  organization: string
  year: string
  order: number
  created_at: string
  updated_at: string
}

export interface AboutEquipmentCategory {
  id: string
  about_content_id: string
  category: string
  order: number
  created_at: string
  updated_at: string
}

export interface AboutEquipmentItem {
  id: string
  equipment_category_id: string
  item: string
  order: number
  created_at: string
  updated_at: string
}

export interface ContactInfo {
  id: string
  type: 'email' | 'phone' | 'instagram' | 'website' | 'location'
  value: string
  label: string
  icon?: string
  is_active: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: string
  key: string
  value?: string
  type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  created_at: string
  updated_at: string
}

