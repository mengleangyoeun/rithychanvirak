# Deployment Guide

## Project Overview

This is a professional photography portfolio website built with:
- **Framework:** Next.js 15.5.2 with App Router
- **Database:** Supabase (PostgreSQL with RLS)
- **Image Storage:** Cloudinary
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Authentication:** Supabase Auth (for admin)
- **Animations:** Framer Motion

## Pre-Deployment Setup

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your credentials from Project Settings > API:
   - Project URL
   - Anon/Public key
   - Service role key (keep secret!)

3. Run migrations in order from `supabase/migrations/`:
   ```sql
   -- Run these in the Supabase SQL Editor in order:
   001_add_nested_albums.sql
   002_add_featured_collections.sql
   003_add_image_id_to_video_storyboard.sql
   004_add_frontend_content.sql
   ```

4. The base database schema from `database_migration.sql` should already be applied

### 2. Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. Create upload presets:
   - Name: `photos`, Folder: `photos`, Mode: Unsigned
   - Name: `videos`, Folder: `videos`, Mode: Unsigned
   - Name: `collections`, Folder: `collections`, Mode: Unsigned

### 3. Environment Variables

Create `.env.local` (for local development) or set in your hosting platform:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

**Vercel Configuration:**
- Framework Preset: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

### Option 2: Docker

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Build and run:**
```bash
docker build -t portfolio .
docker run -p 3000:3000 --env-file .env portfolio
```

### Option 3: Self-Hosted (VPS)

1. **Install Node.js 20+:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install pnpm:**
   ```bash
   npm install -g pnpm
   ```

3. **Clone and setup:**
   ```bash
   git clone your-repo.git
   cd rithychanvirak
   pnpm install
   ```

4. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Build and start:**
   ```bash
   pnpm build
   pnpm start
   ```

6. **Setup PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "portfolio" -- start
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Steps

### 1. Database Verification

Check that all tables exist:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected tables:
- collections
- photos
- videos
- collection_photos
- video_storyboard_items
- hero_content
- services
- about_content
- contact_info
- site_settings

### 2. Create Admin User

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with email/password
3. Or use the admin login at `/admin/login` with credentials from env

### 3. Upload Initial Content

1. Login to admin at `yourdomain.com/admin/login`
2. Navigate to each section:
   - **Albums**: Create collections and upload photos
   - **Photos**: Upload individual photos with metadata
   - **Videos**: Add video URLs (YouTube/Vimeo)
3. Mark content as "Featured" to appear on homepage

### 4. Configure Frontend Content

Update in admin dashboard:
- Hero section (title, subtitle, background)
- Services (edit the 6 default services)
- About page content
- Contact information

## Performance Optimization

### 1. Enable Caching

The project already includes:
- Next.js ISR with 60s revalidation
- Cloudinary CDN for images
- Static asset caching (1 year)

### 2. Image Optimization

All images are automatically optimized via:
- Cloudinary transformations
- Next.js Image component
- AVIF/WebP formats
- Responsive sizes

### 3. Database Indexes

Already created on:
- collection.featured
- photos.featured
- videos.featured
- collection_photos.collection_id
- video_storyboard_items.video_id

## Monitoring

### Vercel Analytics (if using Vercel)

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add to body:
<Analytics />
```

### Error Monitoring

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for traffic

## Maintenance

### Regular Tasks

1. **Database Backups** (Weekly)
   - Automated via Supabase
   - Download manual backup: Settings > Database > Backups

2. **Cloudinary Storage** (Monthly)
   - Review unused images
   - Check storage limits
   - Clean up duplicates

3. **Dependency Updates** (Monthly)
   ```bash
   pnpm update --latest
   pnpm audit
   ```

4. **Security Checks** (Monthly)
   ```bash
   pnpm audit fix
   ```

### Scaling Considerations

- **Image Storage**: Upgrade Cloudinary plan as needed
- **Database**: Upgrade Supabase plan for more connections
- **Bandwidth**: Monitor Vercel/hosting usage

## Troubleshooting

### Build Fails

**Issue:** Google Fonts timeout
```
Failed to fetch font from Google Fonts
```

**Solution:** Network issue - retry build or use fallback fonts

---

**Issue:** Missing environment variables
```
Error: process.env.NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Solution:** Add all required env vars to hosting platform

### Runtime Errors

**Issue:** Database connection fails
**Solution:**
1. Check Supabase project is active
2. Verify RLS policies allow public read access
3. Check env variables are correct

---

**Issue:** Images not loading
**Solution:**
1. Verify Cloudinary credentials
2. Check image URLs in database
3. Ensure remote patterns in next.config.ts

### Admin Access

**Issue:** Cannot login
**Solution:**
1. Check admin credentials in env
2. Clear browser cookies
3. Verify middleware allows /admin routes

## Security Checklist

- ✅ RLS enabled on all tables
- ✅ Environment variables not in git
- ✅ HTTPS enforced (via hosting)
- ✅ CSP headers configured
- ✅ Admin routes protected by middleware
- ✅ API secrets not exposed to client
- ✅ Input validation on forms
- ✅ Rate limiting (via hosting platform)

## Support

For issues:
1. Check error logs in hosting platform
2. Review Supabase logs for database errors
3. Check Cloudinary dashboard for upload issues
4. Verify all environment variables are set

## Rollback Procedure

If deployment fails:

1. **Vercel**: Click "Rollback" on previous deployment
2. **Docker**: Revert to previous image tag
3. **PM2**: `pm2 restart portfolio` with previous build

**Database rollback:**
- Restore from Supabase backup
- Revert migrations manually if needed
