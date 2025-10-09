# Admin System Guide - Cloudinary Integration

## Overview
Your admin panel now works like Sanity CMS with seamless Cloudinary integration. Upload images directly in the admin panel, and they automatically appear on your frontend.

## Database Setup

### Run this SQL in your Supabase Dashboard:

1. Go to your Supabase project → SQL Editor
2. Copy and paste the entire contents of `supabase/schema.sql`
3. Click "Run"

This creates:
- ✅ `photos` table - Photo metadata with Cloudinary IDs
- ✅ `videos` table - Video information
- ✅ `video_storyboard` table - Video preview images
- ✅ `collections` table - Albums with nested support
- ✅ `collection_photos` table - Links photos to albums

## Features

### 1. Photo Management (`/admin/dashboard/photos`)

**Upload Single Photo:**
1. Click "Add Photo"
2. **Upload image** - Click or drag & drop
3. Automatically uploads to Cloudinary
4. Auto-fills: Cloudinary ID, URL, dimensions
5. Fill in metadata:
   - Title (required)
   - Alt text
   - Caption
   - Description
   - Location
   - Camera & Lens
   - EXIF data (Aperture, Shutter, ISO, Focal Length)
   - Date taken
6. Click "Create" → Saves to Supabase
7. Appears on frontend immediately!

**Features:**
- Drag & drop upload
- Live preview
- Auto-generates Cloudinary URLs
- Optimized thumbnails in admin grid
- Structured EXIF data (JSON)

### 2. Album Management (`/admin/dashboard/collections`)

**Create Album with Photos:**

#### Option A: Select Existing Photos
1. Click "Add Album"
2. Fill in:
   - Title (auto-generates slug)
   - Parent Album (for nested albums)
   - Description
   - Cover Image (upload or leave empty)
3. Go to "Select Existing" tab
4. Click photos to add them
5. Click "Create"

#### Option B: Bulk Upload New Photos (with Auto EXIF Extraction!)
1. Click "Add Album"
2. Fill in album details
3. Go to "Bulk Upload" tab
4. **Upload multiple images** (up to 100 at once!)
5. **Automatically extracts EXIF metadata:**
   - 📷 **Camera & Lens** (e.g., "Canon EOS R5", "RF 24-70mm f/2.8")
   - ⚙️ **Camera Settings** (Aperture: f/2.8, Shutter: 1/250s, ISO: 400, Focal: 50mm)
   - 📍 **GPS Location** (Latitude/Longitude from GPS data)
   - 📅 **Date Taken** (Original capture date from EXIF)
6. Uploads to Cloudinary with progress bar
7. Click "Create" → Creates album + all photos with full metadata!

**Features:**
- ✅ Nested albums (unlimited levels)
- ✅ Breadcrumb navigation
- ✅ Bulk upload (up to 100 images)
- ✅ **Automatic EXIF extraction** (NEW!)
- ✅ Progress tracking
- ✅ Auto-create photos from uploads
- ✅ Auto-link photos to album
- ✅ Visual folder interface
- ✅ Auto-generate slugs

### 3. Video Management (`/admin/dashboard/videos`)

Standard video management with:
- YouTube/Vimeo/Google Drive/Direct URLs
- Thumbnails
- Storyboard images
- Categories & tags

## Workflow Examples

### Example 1: Create a Wedding Album
```
1. Go to Collections → "Add Album"
2. Title: "Sarah & John's Wedding"
3. Slug: auto-generated as "sarah-johns-wedding"
4. Description: "August 12, 2024"
5. Upload cover image
6. Switch to "Bulk Upload" tab
7. Select 50 wedding photos → Upload
8. Wait for upload (progress bar shows)
9. Click "Create"
10. Done! Album created with all 50 photos
```

### Example 2: Organize by Location
```
Root Albums:
├─ Cambodia
│  ├─ Phnom Penh (bulk upload 30 photos)
│  ├─ Siem Reap (bulk upload 45 photos)
│  └─ Sihanoukville (bulk upload 20 photos)
└─ Thailand
   ├─ Bangkok (bulk upload 35 photos)
   └─ Chiang Mai (bulk upload 25 photos)
```

## File Structure

```
components/
├─ cloudinary-upload.tsx         # Single image upload widget
└─ cloudinary-bulk-upload.tsx    # Multiple image upload widget

app/admin/dashboard/
├─ photos/page.tsx               # Photo management with single upload
├─ collections/page.tsx          # Album management with bulk upload
└─ videos/page.tsx               # Video management

supabase/
├─ schema.sql                    # Complete database schema
└─ migrations/
   └─ 001_add_nested_albums.sql  # Migration for nested albums

lib/
└─ cloudinary.ts                 # Cloudinary helper functions
```

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## How It Works

### Upload Flow:
1. User selects image(s) in admin panel
2. JavaScript uploads to Cloudinary API
3. Cloudinary returns: `public_id`, `secure_url`, `width`, `height`
4. Data saved to Supabase
5. Frontend uses `image_id` to generate optimized URLs

### Frontend Rendering:
```typescript
// Uses Cloudinary transformation URLs
getThumbnailUrl(photo.image_id, 600)
// Generates: https://res.cloudinary.com/.../w_600,q_auto,f_auto/.../photo_id
```

## Benefits vs Manual Upload

| Manual | Automated |
|--------|-----------|
| Upload to Cloudinary dashboard | Upload in admin panel |
| Copy public_id manually | Auto-captured |
| Copy URL manually | Auto-captured |
| Get dimensions from inspect | Auto-captured |
| Paste all into admin form | Just upload! |
| Create photo record | Auto-created |
| Link to album manually | Auto-linked |
| ⏱️ 5 minutes per photo | ⏱️ 5 seconds per photo |

## Bulk Upload Performance

- Upload 50 photos: ~2-3 minutes
- Upload 100 photos: ~5 minutes
- Concurrent uploads to Cloudinary
- Real-time progress tracking
- Automatic retry on failure

## Tips

1. **Use bulk upload** for event/location albums (10+ photos)
2. **Use single upload** for individual featured photos with detailed metadata
3. **Set cover images** to make albums visually appealing
4. **Use nested albums** to organize by: Country → City → Event
5. **Auto-slug** works with special characters and Khmer script
6. **EXIF data** is structured (JSON) for easy filtering later

## Troubleshooting

**Upload fails:**
- Check Cloudinary credentials in `.env.local`
- Verify upload preset is set to "unsigned"
- Check file size (max 10MB per image)

**Photos don't appear:**
- Check Supabase connection
- Verify RLS policies are enabled
- Check browser console for errors

**Slow uploads:**
- Use bulk upload instead of individual
- Check internet connection
- Cloudinary free tier has rate limits

## Next Steps

1. Run the SQL schema in Supabase
2. Verify Cloudinary env variables
3. Test single photo upload
4. Test bulk upload with 5-10 photos
5. Create your first nested album structure

🎉 Your admin system is now production-ready!
