# Cloudinary Folder Organization System

## 📂 Folder Structure

Your Cloudinary account is now automatically organized with the following structure:

```
rithychanvirak/                         # Root folder (your brand)
├── collections/                        # Collection/Album photos
│   ├── wedding-2024/                   # Auto-created from collection slug
│   │   ├── IMG_001.jpg
│   │   ├── IMG_002.jpg
│   │   └── IMG_003.jpg
│   ├── portrait-sessions/
│   │   └── ...
│   ├── travel-cambodia/
│   │   └── ...
│   └── {collection-slug}/              # Each collection gets its own folder
│       └── ...
├── videos/                             # Video thumbnails
│   ├── wedding-highlights/             # Auto-created from video slug
│   │   └── thumbnail.jpg
│   └── {video-slug}/
│       └── ...
├── hero/                               # Hero section backgrounds
│   ├── hero-bg-1.jpg
│   └── hero-bg-2.jpg
├── profile/                            # Profile/About page images
│   └── profile-pic.jpg
└── misc/                               # Standalone photos (not in collections)
    └── ...
```

---

## 🎯 How It Works

### **Automatic Folder Assignment**

When you upload images in the admin panel, they are automatically organized:

| Upload Location | Cloudinary Folder | Example |
|----------------|-------------------|---------|
| **Collections Page** → Inside a collection | `rithychanvirak/collections/{slug}` | `rithychanvirak/collections/wedding-2024/` |
| **Photos Page** → Standalone photos | `rithychanvirak/misc` | `rithychanvirak/misc/photo1.jpg` |
| **Videos Page** → Video thumbnail | `rithychanvirak/videos/{slug}` | `rithychanvirak/videos/highlights/` |
| **Hero Settings** → Background image | `rithychanvirak/hero` | `rithychanvirak/hero/bg.jpg` |
| **About Page** → Profile picture | `rithychanvirak/profile` | `rithychanvirak/profile/me.jpg` |

### **Collection-Based Organization**

The most powerful feature: **Each collection automatically gets its own folder!**

**Example:**
1. You create a collection called "Wedding Photography 2024"
2. The system generates a slug: `wedding-photography-2024`
3. When you upload photos to this collection, they go to:
   ```
   rithychanvirak/collections/wedding-photography-2024/
   ```

---

## 💡 Benefits

### 1. **Easy to Find**
Browse Cloudinary by collection name to find all related photos

### 2. **Scalable**
Add unlimited collections without getting messy

### 3. **Clean URLs**
```
https://res.cloudinary.com/your-cloud/image/upload/
  rithychanvirak/collections/wedding-2024/IMG_001.jpg
```

### 4. **Bulk Operations**
Delete/move entire collections at once in Cloudinary dashboard

### 5. **Backup & Migration**
Easy to backup specific collections

---

## 🛠️ Technical Implementation

### **How Folders Are Generated**

The system uses: `lib/cloudinary-folders.ts`

```typescript
import { getCollectionFolder } from '@/lib/cloudinary-folders'

// For a collection with slug "wedding-2024"
const folder = getCollectionFolder({ slug: 'wedding-2024' })
// Returns: "rithychanvirak/collections/wedding-2024"
```

### **Slug Sanitization**

Collection names are automatically converted to safe folder names:

| Collection Name | Generated Folder |
|----------------|------------------|
| `Wedding Photography 2024` | `wedding-photography-2024` |
| `Travel: Cambodia & Vietnam!` | `travel-cambodia-vietnam` |
| `Portrait  Sessions` | `portrait-sessions` |

**Rules:**
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Remove consecutive hyphens

---

## 📝 Usage Examples

### **Example 1: Upload Photos to Collection**

```tsx
// Admin → Collections → Select Collection → Add Photos
// The system automatically uses the collection's folder

import { getCollectionFolder } from '@/lib/cloudinary-folders'

const collection = { slug: 'wedding-2024', name: 'Wedding Photography 2024' }
const folder = getCollectionFolder(collection)

<CloudinaryBulkUpload
  folder={folder}  // "rithychanvirak/collections/wedding-2024"
  onUploadComplete={handleUpload}
/>
```

### **Example 2: Upload Standalone Photo**

```tsx
// Admin → Photos → Add Photo
// Goes to misc folder

<CloudinaryUpload
  folder="rithychanvirak/misc"
  onUploadComplete={handleUpload}
/>
```

### **Example 3: Upload Video Thumbnail**

```tsx
// Admin → Videos → Add Video Thumbnail

import { getVideoFolder } from '@/lib/cloudinary-folders'

const video = { slug: 'highlights-2024' }
const folder = getVideoFolder(video)

<CloudinaryUpload
  folder={folder}  // "rithychanvirak/videos/highlights-2024"
  onUploadComplete={handleUpload}
/>
```

---

## ⚙️ Cloudinary Upload Preset Configuration

### **Required Settings:**

1. Go to: https://cloudinary.com/console
2. Navigate to: **Settings → Upload → Upload presets**
3. Edit your `portfolio` preset:

```
✅ Preset name: portfolio
✅ Signing mode: Unsigned (allows client uploads)
✅ Folder: (leave empty - will be set dynamically by code)
✅ Use filename: Yes
✅ Unique filename: Yes (recommended)
✅ Overwrite: No
```

**Important:** Leave the "Folder" field **empty** in the preset. The folder is set dynamically in your code.

---

## 🔍 Finding Your Images

### **In Cloudinary Dashboard:**

1. Go to: https://cloudinary.com/console/media_library
2. Navigate folders:
   - Click `rithychanvirak` → `collections` → select your collection
3. View all photos in that collection

### **In Your Admin Panel:**

- **Collections Page:** Shows photos grouped by collection
- **Photos Page:** Shows all photos with search/filter

---

## 🚀 Current Implementation Status

### ✅ **Already Implemented:**

1. **Collections Page** → Photos uploaded to `rithychanvirak/collections/{slug}`
2. **Photos Page** → Standalone photos go to `rithychanvirak/misc`
3. **Utility Functions** → Available in `lib/cloudinary-folders.ts`

### 📝 **To Be Implemented (Future):**

- Videos page thumbnail uploads
- Hero background uploads
- Profile picture uploads

---

## 📊 Examples from Your Project

When you upload photos to a collection:

**Collection:** "Wedding Photography 2024"
**Slug:** `wedding-photography-2024`
**Cloudinary Folder:** `rithychanvirak/collections/wedding-photography-2024/`

**Result:**
```
rithychanvirak/collections/wedding-photography-2024/
├── DSC_001.jpg
├── DSC_002.jpg
├── DSC_003.jpg
└── ...
```

**Collection:** "Travel - Cambodia"
**Slug:** `travel-cambodia`
**Cloudinary Folder:** `rithychanvirak/collections/travel-cambodia/`

**Result:**
```
rithychanvirak/collections/travel-cambodia/
├── angkor-wat.jpg
├── royal-palace.jpg
└── ...
```

---

## 🎨 Best Practices

### **1. Use Descriptive Collection Names**
- ✅ Good: "Wedding Photography - Smith Family 2024"
- ❌ Avoid: "Photos 1", "Collection 2"

### **2. Keep Collection Names Consistent**
- Use a naming convention (e.g., Event Type - Subject - Year)

### **3. Don't Upload Too Many to Misc**
- Create collections for organized groups of photos
- Use `misc` only for one-off images

### **4. Clean Up Old Collections**
- Delete unused collections to keep Cloudinary tidy

---

## 🔧 Troubleshooting

### **Photos Not Uploading to Correct Folder?**

1. Check that collection has a slug
2. Verify upload preset allows folder overrides
3. Check browser console for errors

### **Can't Find Photos in Cloudinary?**

1. Check folder structure: `rithychanvirak/collections/{slug}`
2. Verify slug sanitization (special chars removed)
3. Check if photos are in `misc` instead

---

## 📚 API Reference

See: `lib/cloudinary-folders.ts`

### **getCollectionFolder**
```typescript
getCollectionFolder(collection: { slug?: string, name?: string, id?: string }): string
```

### **getVideoFolder**
```typescript
getVideoFolder(video: { slug?: string, title?: string, id?: string }): string
```

### **getCloudinaryFolder**
```typescript
getCloudinaryFolder(options: {
  type: 'collection' | 'video' | 'hero' | 'profile' | 'misc'
  collectionSlug?: string
  videoSlug?: string
}): string
```

---

## ✨ Summary

Your Cloudinary is now **automatically organized** by collection! Every time you:

1. Create a collection called "Wedding 2024"
2. Upload photos to that collection
3. They go to: `rithychanvirak/collections/wedding-2024/`

**No manual folder management needed!** 🎉
