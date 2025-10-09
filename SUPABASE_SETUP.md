# Supabase Migration Setup

This guide will help you set up Supabase to replace Sanity CMS.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned

## 2. Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/schema.sql`
4. Run the query to create all tables, indexes, and policies

## 3. Configure Environment Variables

Update your `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="your-project-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

You can find these values in:
- Supabase Dashboard → Settings → API

## 4. Create Admin User

In Supabase Dashboard → Authentication → Users:
1. Click "Add user"
2. Choose "Create new user"
3. Enter your admin email and password
4. Click "Create user"

## 5. Test the Setup

1. Start your development server: `pnpm dev`
2. Go to `http://localhost:3000/admin/login`
3. Login with your admin credentials
4. You should see the admin dashboard

## Admin Dashboard Features

### Current Features
- ✅ Authentication with Supabase Auth
- ✅ Dashboard with statistics
- ✅ Protected routes (middleware)
- ✅ Logout functionality

### To Be Built
- 🔨 Photos management (CRUD)
- 🔨 Videos management (CRUD)
- 🔨 Collections management (CRUD)
- 🔨 Reordering items
- 🔨 Frontend API integration

## Database Schema

### Tables
- `photos` - Photo gallery items
- `videos` - Video portfolio items
- `video_storyboard` - Video stills/frames
- `collections` - Photo collections
- `collection_photos` - Junction table for collections

### Security
- Row Level Security (RLS) enabled on all tables
- Public read access for frontend
- Authenticated users can perform CRUD operations
- Admin-only access via Supabase Auth

## Next Steps

1. Build the CRUD pages for photos, videos, and collections
2. Update frontend to fetch from Supabase instead of Sanity
3. Migrate existing data from Sanity
4. Remove Sanity dependencies
