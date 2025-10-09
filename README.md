# Rithy Chanvirak Photography Portfolio

A modern, full-stack photography portfolio website with complete CMS admin panel.

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-blue)

## Features

### Public Website
- 🎨 Modern, responsive design
- 📸 Photo gallery with EXIF metadata
- 🎥 Video portfolio (YouTube/Vimeo)
- 📱 Mobile-optimized
- ⚡ Fast loading with ISR caching
- 🎭 Smooth animations

### Admin Dashboard
- 🔐 Secure authentication
- 📊 Dashboard with stats
- 🖼️ Albums management (nested support)
- 📷 Photos management with EXIF
- 🎬 Videos with storyboard editor
- ☁️ Cloudinary integration
- 🎯 Featured content toggles

## Tech Stack

- **Framework:** Next.js 15.5.2 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Cloudinary
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Animations:** Framer Motion
- **Language:** TypeScript

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Supabase account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rithychanvirak
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Admin
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   ```

4. **Set up database**

   Run migrations in Supabase SQL Editor (in order):
   ```bash
   supabase/migrations/001_add_nested_albums.sql
   supabase/migrations/002_add_featured_collections.sql
   supabase/migrations/003_add_image_id_to_video_storyboard.sql
   supabase/migrations/004_add_frontend_content.sql
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   - Frontend: http://localhost:3000
   - Admin: http://localhost:3000/admin/login

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages
│   ├── admin/             # Admin dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── sections/          # Homepage sections
│   └── ui/                # UI components
├── lib/                   # Utilities
│   ├── supabase/          # Supabase clients
│   └── cloudinary.ts      # Cloudinary helpers
├── types/                 # TypeScript types
├── supabase/migrations/   # Database migrations
└── middleware.ts          # Auth middleware
```

## Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Database Schema

### Core Tables
- `collections` - Photo albums (with nested support)
- `photos` - Individual photos with EXIF
- `videos` - Video entries
- `collection_photos` - Album-photo relationships
- `video_storyboard_items` - Video timeline

### Content Tables
- `hero_content` - Homepage hero
- `services` - Services showcase
- `about_content` - About page
- `contact_info` - Contact information
- `site_settings` - Global settings

## Key Features

### Featured Content
Mark albums, photos, and videos as "featured" to display on homepage:
- Albums: Up to 6
- Videos: Up to 8
- Photos: Up to 12 (infinite scroll)

### Nested Albums
Create sub-albums within albums for organized galleries.

### EXIF Metadata
Automatic capture and display of camera settings, location, and date.

### Video Storyboard
Interactive timeline editor for video chapters with drag-and-drop.

### Cloudinary Integration
Single and bulk upload with automatic optimization and CDN delivery.

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Click the button above
2. Add environment variables
3. Deploy!

## Documentation

- 📋 [Production Checklist](./PRODUCTION_CHECKLIST.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 📖 [Project Summary](./PROJECT_SUMMARY.md)
- 🗄️ [Supabase Setup](./SUPABASE_SETUP.md)
- 🔧 [Admin System Guide](./ADMIN_SYSTEM_GUIDE.md)

## Performance

- ⚡ ISR with 60s revalidation
- 🖼️ Optimized images (AVIF/WebP)
- 📦 Code splitting and lazy loading
- 🗜️ Gzip compression
- 💾 Static asset caching (1 year)

## Security

- 🔒 Row Level Security (RLS)
- 🔐 Secure authentication
- 🛡️ CSP headers
- 🔑 Environment variables
- 🚫 Protected admin routes

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## License

Private project - All rights reserved

## Support

For issues or questions, please check the documentation or contact the development team.

---

Built with ❤️ using Next.js and Supabase
