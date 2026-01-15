# DigitalOcean Spaces (S3) Setup Guide

## ✅ Completed Setup

1. ✅ Installed AWS SDK packages (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`)
2. ✅ Created S3 utility library at `src/lib/s3.ts`
3. ✅ `.env.local` is already in `.gitignore`

## 📝 Environment Variables Setup

Add the following variables to your `.env.local` file:

```bash
# DigitalOcean Spaces Configuration
# Note: ENDPOINT should be the base URL without bucket name
DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=razanstorage
DO_SPACES_ACCESS_KEY_ID=DO00MJP93D32CLRG3896
DO_SPACES_SECRET_ACCESS_KEY=xoTv1d8siHH64iOzNz1y01TFyUTeZsoZRq7PIGzv8fY
```

### Important Notes:
- Your bucket name is: `razanstorage`
- Region: San Francisco 3 (sfo3)
- The SDK will automatically construct: https://razanstorage.sfo3.digitaloceanspaces.com
- Common regions: `nyc3`, `sfo3`, `ams3`, `sgp1`, `fra1`

## 🚀 Usage Examples

### 1. Upload a File (Public Access)

```typescript
import { uploadFile, generateFileKey } from '@/lib/s3'

// In your API route or server component
const file = await request.formData().get('file') as File
const buffer = Buffer.from(await file.arrayBuffer())

// Generate a unique key for the file
const fileKey = generateFileKey(userId, file.name, 'resumes')

// Upload the file
const fileUrl = await uploadFile(
    buffer,
    fileKey,
    file.type,
    true // Make it publicly accessible
)

console.log('File uploaded:', fileUrl)
```

### 2. Upload a Private File

```typescript
import { uploadFile, generateFileKey, getSignedFileUrl } from '@/lib/s3'

const fileKey = generateFileKey(userId, file.name, 'documents')

// Upload as private
const key = await uploadFile(
    buffer,
    fileKey,
    file.type,
    false // Private file
)

// Generate a signed URL for temporary access (valid for 1 hour)
const signedUrl = await getSignedFileUrl(key, 3600)
console.log('Access file via:', signedUrl)
```

### 3. Delete a File

```typescript
import { deleteFile } from '@/lib/s3'

await deleteFile('users/123/1234567890-abc123-resume.pdf')
```

### 4. Check if File Exists

```typescript
import { fileExists } from '@/lib/s3'

const exists = await fileExists('users/123/document.pdf')
if (exists) {
    console.log('File exists!')
}
```

### 5. Validate File Types

```typescript
import { FileTypeValidators } from '@/lib/s3'

// Validate document
if (FileTypeValidators.documents(file.type)) {
    // Upload document
}

// Validate image
if (FileTypeValidators.images(file.type)) {
    // Upload image
}

// Validate video
if (FileTypeValidators.videos(file.type)) {
    // Upload video
}
```

## 📁 File Organization Best Practices

Use the `generateFileKey` function to organize files:

```typescript
// Organize by user and folder
const resumeKey = generateFileKey(userId, 'resume.pdf', 'resumes')
// Result: resumes/user123/1234567890-abc123-resume.pdf

const avatarKey = generateFileKey(userId, 'avatar.jpg', 'avatars')
// Result: avatars/user123/1234567890-abc123-avatar.jpg

const documentKey = generateFileKey(userId, 'contract.pdf', 'documents')
// Result: documents/user123/1234567890-abc123-contract.pdf
```

## 🔒 Security Considerations

1. **Private Files**: Use `isPublic: false` and generate signed URLs for temporary access
2. **File Validation**: Always validate file types before uploading
3. **File Size Limits**: Implement file size limits in your API routes
4. **Access Control**: Only allow users to access their own files

## 📦 Example API Route

Create a file upload API route at `src/app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, generateFileKey, FileTypeValidators } from '@/lib/s3'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string
        const folder = formData.get('folder') as string || 'uploads'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type (example: documents only)
        if (!FileTypeValidators.documents(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only documents are allowed.' },
                { status: 400 }
            )
        }

        // Validate file size (example: max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Generate unique key
        const fileKey = generateFileKey(userId, file.name, folder)

        // Upload file (public or private)
        const fileUrl = await uploadFile(
            buffer,
            fileKey,
            file.type,
            false // Set to true for public access
        )

        return NextResponse.json({
            success: true,
            fileKey,
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
```

## 🎨 Frontend Upload Component Example

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function FileUpload() {
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', 'user123')
            formData.append('folder', 'resumes')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                console.log('File uploaded:', data)
                alert('File uploaded successfully!')
            } else {
                alert('Upload failed: ' + data.error)
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-4">
            <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
            />
            <Button
                onClick={handleUpload}
                disabled={!file || uploading}
            >
                {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
        </div>
    )
}
```

## 🔧 Utility Functions Available

- `uploadFile(file, key, contentType, isPublic)` - Upload a file
- `deleteFile(key)` - Delete a file
- `getSignedFileUrl(key, expiresIn)` - Generate signed URL for private files
- `fileExists(key)` - Check if file exists
- `generateFileKey(userId, fileName, folder)` - Generate unique file key
- `formatFileSize(bytes)` - Format bytes to human-readable size
- `validateFileType(contentType, allowedTypes)` - Validate file type
- `FileTypeValidators.documents()` - Validate document files
- `FileTypeValidators.images()` - Validate image files
- `FileTypeValidators.videos()` - Validate video files

## 📚 Next Steps

1. Add the environment variables to your `.env.local` file
2. Create your DigitalOcean Spaces bucket
3. Test the upload functionality
4. Implement file deletion when needed
5. Add proper error handling and user feedback

## 🌐 DigitalOcean Spaces Dashboard

Access your spaces at: https://cloud.digitalocean.com/spaces

From there you can:
- Create new spaces (buckets)
- Manage CORS settings
- View usage and billing
- Configure CDN settings

