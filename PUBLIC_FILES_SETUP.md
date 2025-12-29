# Public Files Configuration - DigitalOcean Spaces

## Overview
All files uploaded to your DigitalOcean Spaces bucket are now **publicly readable by default**. This means CVs, audio recordings, and other uploaded files are immediately accessible via their URLs without authentication.

## What Changed

### 1. Updated S3 Upload Configuration (`src/lib/s3.ts`)

**Key Changes:**
- ✅ Added `ACL: 'public-read'` to all file uploads
- ✅ Changed default `isPublic` parameter from `false` to `true`
- ✅ Files are now immediately accessible via their public URLs

**Before:**
```typescript
const params: PutObjectCommandInput = {
    Bucket: SPACES_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    // No ACL set - files were not publicly accessible
}
```

**After:**
```typescript
const params: PutObjectCommandInput = {
    Bucket: SPACES_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: isPublic ? 'public-read' : 'private', // ✅ Files are now public by default
}
```

## File Types Affected

All uploaded files are now publicly accessible:

1. **CVs/Resumes** (PDF, DOC, DOCX)
   - Uploaded during application process
   - Stored in: `uploads/cv/`

2. **Audio Recordings** (WebM, MP3, etc.)
   - Voice question responses
   - Stored in: `uploads/audio/`

3. **Portfolio Files** (if applicable)
   - Additional documents
   - Stored in: `uploads/portfolio/`

## Public URL Format

All files are accessible via:
```
https://{BUCKET_NAME}.{REGION}.digitaloceanspaces.com/{FILE_KEY}
```

**Example:**
```
https://razan-recruitment.fra1.digitaloceanspaces.com/uploads/cv/uuid-resume.pdf
```

## Current Upload Flow

### 1. CV Upload (Application Process)
```typescript
// In: src/app/(public)/apply/[jobId]/_components/actions.ts
const url = await uploadToSpaces(buffer, key, file.type, true) // ✅ isPublic = true
```

### 2. Audio Upload (Voice Questions)
```typescript
// In: src/app/(public)/apply/[jobId]/_components/actions.ts
const url = await uploadToSpaces(buffer, key, contentType, true) // ✅ isPublic = true
```

## Testing Public Access

### Option 1: Use Test Upload Route

1. **Start your dev server:**
   ```bash
   bun dev
   ```

2. **Visit the test page:**
   ```
   http://localhost:3000/test-upload
   ```

3. **Upload a file** and check the returned `publicUrl`

4. **Try accessing the URL directly** in a new browser tab (should work without errors)

### Option 2: Upload via Application Flow

1. Go to any job application page
2. Upload a CV
3. Check the browser console for the uploaded URL
4. Try accessing the URL directly (should work)

### Option 3: Using cURL

```bash
curl -X POST http://localhost:3000/api/test-upload \
  -F "file=@/path/to/test.pdf" \
  -F "isPublic=true"
```

## Expected Behavior

### ✅ Success (Public Access Working)
- File uploads successfully
- Returns a public URL like: `https://razan-recruitment.fra1.digitaloceanspaces.com/...`
- Opening the URL in browser displays/downloads the file
- No 403 Forbidden errors

### ❌ Failure (Public Access Not Working)
- File uploads successfully
- Returns a URL
- Opening the URL shows **403 Forbidden** error
- Indicates ACL not properly set

## Troubleshooting

### Still Getting 403 Forbidden?

1. **Check Bucket Settings:**
   - Log into DigitalOcean Spaces console
   - Verify your bucket is a **Standard** bucket (not Restricted)
   - Standard buckets support file-level ACLs

2. **Check Environment Variables:**
   ```bash
   # Verify in .env.local
   DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
   DO_SPACES_REGION=fra1
   DO_SPACES_BUCKET=razan-recruitment
   DO_SPACES_ACCESS_KEY_ID=your-key
   DO_SPACES_SECRET_ACCESS_KEY=your-secret
   ```

3. **Check Access Key Permissions:**
   - Ensure your Spaces access key has **write** permissions
   - Can set ACLs on objects

4. **Test with a Fresh Upload:**
   - Delete old files that were uploaded before the ACL change
   - Upload a new file
   - Test the new file's URL

### Verify ACL is Being Set

Add temporary logging to `src/lib/s3.ts`:

```typescript
console.log('📤 Uploading with params:', {
    Bucket: SPACES_BUCKET,
    Key: key,
    ACL: isPublic ? 'public-read' : 'private',
    ContentType: contentType,
})
```

## Security Considerations

### ⚠️ Important Notes

1. **All uploaded files are publicly accessible**
   - Anyone with the URL can access the file
   - URLs are hard to guess (contain UUIDs) but not secret

2. **Sensitive Information**
   - CVs may contain personal information (addresses, phone numbers)
   - Consider this when deciding on public vs. private access

3. **URL Sharing**
   - Don't share file URLs publicly
   - Only use within your application

### If You Need Private Files

To make specific files private:

```typescript
// Upload as private
const fileKey = await uploadFile(buffer, key, contentType, false) // isPublic = false

// Generate signed URL for temporary access
const signedUrl = await getSignedFileUrl(fileKey, 3600) // Valid for 1 hour
```

## Next Steps

1. ✅ Test file uploads with the new configuration
2. ✅ Verify public URLs work without 403 errors
3. ✅ Test AI analysis with new uploaded files
4. ✅ Monitor for any access issues

## Related Files

- `/src/lib/s3.ts` - Main S3 configuration and upload logic
- `/src/app/(public)/apply/[jobId]/_components/actions.ts` - Application upload actions
- `/src/app/api/test-upload/route.ts` - Test upload endpoint
- `/src/app/test-upload/page.tsx` - Test upload UI

## Support

If you continue to experience 403 Forbidden errors after these changes:

1. Check the DigitalOcean Spaces documentation
2. Verify bucket type (Standard vs. Restricted)
3. Check access key permissions
4. Contact DigitalOcean support if needed





