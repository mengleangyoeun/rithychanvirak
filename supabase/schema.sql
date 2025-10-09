-- =====================================================
-- COMPLETE DATABASE SCHEMA
-- Rithy Chanvirak Photography Portfolio
-- =====================================================
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- This is the complete schema - no other files needed
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE CONTENT TABLES
-- =====================================================

-- Collections (Albums) with nested support
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  cover_image_id TEXT,
  parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos with EXIF metadata
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_id TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  alt TEXT,
  caption TEXT,
  description TEXT,
  camera TEXT,
  lens TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  location TEXT,
  date_taken TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos (YouTube/Vimeo)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'vimeo', 'googledrive', 'direct')),
  thumbnail_url TEXT,
  thumbnail_id TEXT,
  description TEXT,
  category TEXT,
  year INTEGER,
  tags TEXT[],
  featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: Collections <-> Photos
CREATE TABLE IF NOT EXISTS collection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, photo_id)
);

-- Video storyboard items
CREATE TABLE IF NOT EXISTS video_storyboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  image_id TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FRONTEND CONTENT TABLES
-- =====================================================

-- Hero section
CREATE TABLE IF NOT EXISTS hero_content (
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

-- Services
CREATE TABLE IF NOT EXISTS services (
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

-- About page content
CREATE TABLE IF NOT EXISTS about_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'About Me',
  name TEXT NOT NULL DEFAULT 'Your Name',
  tagline TEXT,
  bio TEXT,
  profile_image_url TEXT,
  profile_image_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About experience
CREATE TABLE IF NOT EXISTS about_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_content_id UUID REFERENCES about_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About skills
CREATE TABLE IF NOT EXISTS about_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_content_id UUID REFERENCES about_content(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About awards
CREATE TABLE IF NOT EXISTS about_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_content_id UUID REFERENCES about_content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  year TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About equipment categories
CREATE TABLE IF NOT EXISTS about_equipment_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  about_content_id UUID REFERENCES about_content(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About equipment items
CREATE TABLE IF NOT EXISTS about_equipment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_category_id UUID REFERENCES about_equipment_categories(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact information
CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'instagram', 'website', 'location')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT CHECK (type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core content indexes
CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(featured);
CREATE INDEX IF NOT EXISTS idx_collections_order ON collections("order");
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos(featured);
CREATE INDEX IF NOT EXISTS idx_photos_order ON photos("order");

CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(featured);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_active ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos("order");
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

CREATE INDEX IF NOT EXISTS idx_collection_photos_collection ON collection_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_photo ON collection_photos(photo_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_order ON collection_photos("order");

CREATE INDEX IF NOT EXISTS idx_video_storyboard_video ON video_storyboard(video_id);
CREATE INDEX IF NOT EXISTS idx_video_storyboard_image_id ON video_storyboard(image_id);
CREATE INDEX IF NOT EXISTS idx_video_storyboard_order ON video_storyboard("order");

-- Frontend content indexes
CREATE INDEX IF NOT EXISTS idx_hero_content_active ON hero_content(is_active);
CREATE INDEX IF NOT EXISTS idx_services_order ON services("order");
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_about_content_active ON about_content(is_active);
CREATE INDEX IF NOT EXISTS idx_about_experience_order ON about_experience("order");
CREATE INDEX IF NOT EXISTS idx_about_experience_about_content_id ON about_experience(about_content_id);
CREATE INDEX IF NOT EXISTS idx_about_skills_order ON about_skills("order");
CREATE INDEX IF NOT EXISTS idx_about_skills_about_content_id ON about_skills(about_content_id);
CREATE INDEX IF NOT EXISTS idx_about_awards_order ON about_awards("order");
CREATE INDEX IF NOT EXISTS idx_about_awards_about_content_id ON about_awards(about_content_id);
CREATE INDEX IF NOT EXISTS idx_about_equipment_categories_order ON about_equipment_categories("order");
CREATE INDEX IF NOT EXISTS idx_about_equipment_categories_about_content_id ON about_equipment_categories(about_content_id);
CREATE INDEX IF NOT EXISTS idx_about_equipment_items_order ON about_equipment_items("order");
CREATE INDEX IF NOT EXISTS idx_about_equipment_items_category_id ON about_equipment_items(equipment_category_id);
CREATE INDEX IF NOT EXISTS idx_contact_info_type ON contact_info(type);
CREATE INDEX IF NOT EXISTS idx_contact_info_order ON contact_info("order");
CREATE INDEX IF NOT EXISTS idx_contact_info_active ON contact_info(is_active);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_storyboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY IF NOT EXISTS "Public read access for collections" ON collections FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for photos" ON photos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for videos" ON videos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for collection_photos" ON collection_photos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for video_storyboard" ON video_storyboard FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for hero_content" ON hero_content FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for services" ON services FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_content" ON about_content FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_experience" ON about_experience FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_skills" ON about_skills FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_awards" ON about_awards FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_equipment_categories" ON about_equipment_categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for about_equipment_items" ON about_equipment_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for contact_info" ON contact_info FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access for site_settings" ON site_settings FOR SELECT USING (true);

-- Authenticated users can manage all content
CREATE POLICY IF NOT EXISTS "Authenticated users can manage collections" ON collections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage photos" ON photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage videos" ON videos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage collection_photos" ON collection_photos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage video_storyboard" ON video_storyboard FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage hero_content" ON hero_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_content" ON about_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_experience" ON about_experience FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_skills" ON about_skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_awards" ON about_awards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_equipment_categories" ON about_equipment_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage about_equipment_items" ON about_equipment_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage contact_info" ON contact_info FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Authenticated users can manage site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_storyboard_updated_at ON video_storyboard;
CREATE TRIGGER update_video_storyboard_updated_at BEFORE UPDATE ON video_storyboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hero_content_updated_at ON hero_content;
CREATE TRIGGER update_hero_content_updated_at BEFORE UPDATE ON hero_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_content_updated_at ON about_content;
CREATE TRIGGER update_about_content_updated_at BEFORE UPDATE ON about_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_experience_updated_at ON about_experience;
CREATE TRIGGER update_about_experience_updated_at BEFORE UPDATE ON about_experience
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_skills_updated_at ON about_skills;
CREATE TRIGGER update_about_skills_updated_at BEFORE UPDATE ON about_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_awards_updated_at ON about_awards;
CREATE TRIGGER update_about_awards_updated_at BEFORE UPDATE ON about_awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_equipment_categories_updated_at ON about_equipment_categories;
CREATE TRIGGER update_about_equipment_categories_updated_at BEFORE UPDATE ON about_equipment_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_about_equipment_items_updated_at ON about_equipment_items;
CREATE TRIGGER update_about_equipment_items_updated_at BEFORE UPDATE ON about_equipment_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_info_updated_at ON contact_info;
CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default hero content
INSERT INTO hero_content (title, subtitle)
SELECT 'RITHY CHANVIRAK', 'Professional Photography Portfolio'
WHERE NOT EXISTS (SELECT 1 FROM hero_content LIMIT 1);

-- Insert default about content
INSERT INTO about_content (title, name, tagline, bio)
SELECT 'About Me', 'Rithy Chanvirak', 'Professional Photographer & Visual Storyteller',
       'Passionate photographer capturing life''s beautiful moments through the lens of creativity and emotion.'
WHERE NOT EXISTS (SELECT 1 FROM about_content LIMIT 1);

-- Insert default services
INSERT INTO services (number, title, description, icon)
SELECT * FROM (VALUES
  (1, 'Wedding Photography', 'Capturing your special day with elegance and emotion', '💍'),
  (2, 'Portrait Sessions', 'Professional headshots and personal branding photography', '📸'),
  (3, 'Event Coverage', 'Documenting corporate events, parties, and celebrations', '🎉'),
  (4, 'Commercial Photography', 'Product photography and brand visual content', '🏢'),
  (5, 'Travel Photography', 'Adventure and destination photography services', '✈️'),
  (6, 'Video Production', 'Professional videography and editing services', '🎬')
) AS v(number, title, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- Insert default contact info
INSERT INTO contact_info (type, value, label, icon)
SELECT * FROM (VALUES
  ('email', 'hello@rithychanvirak.com', 'Email', '📧'),
  ('instagram', '@rithychanvirak', 'Instagram', '📷'),
  ('location', 'Phnom Penh, Cambodia', 'Location', '📍'),
  ('website', 'rithychanvirak.com', 'Website', '🌐')
) AS v(type, value, label, icon)
WHERE NOT EXISTS (SELECT 1 FROM contact_info LIMIT 1);

-- Insert default site settings
INSERT INTO site_settings (key, value, type, description)
SELECT * FROM (VALUES
  ('site_title', 'Rithy Chanvirak Photography', 'string', 'Main site title'),
  ('site_description', 'Professional photography portfolio showcasing wedding, portrait, and event photography', 'string', 'Site meta description'),
  ('contact_email', 'hello@rithychanvirak.com', 'string', 'Primary contact email'),
  ('instagram_handle', '@rithychanvirak', 'string', 'Instagram username'),
  ('location', 'Phnom Penh, Cambodia', 'string', 'Business location')
) AS v(key, value, type, description)
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE key = v.key);

-- =====================================================
-- SCHEMA COMPLETE!
-- =====================================================
-- All tables, indexes, RLS policies, and triggers are set up.
-- Use the admin dashboard to manage your content.
-- =====================================================
