# S3 Upload Test Guide

## 🎯 Test Page Created

A complete test page has been created to validate your DigitalOcean Spaces setup.

### 📍 Access the Test Page

```
http://localhost:3000/test-upload
```

## 🔧 Before Testing

### 1. Add Environment Variables

Make sure these are in your `.env.local` file:

```bash
DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=razanstorage
DO_SPACES_ACCESS_KEY_ID=DO00MJP93D32CLRG3896
DO_SPACES_SECRET_ACCESS_KEY=xoTv1d8siHH64iOzNz1y01TFyUTeZsoZRq7PIGzv8fY
```

### 2. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
bun dev
```

## ✅ What the Test Page Does

### Features:
1. **File Selection** - Choose any file from your computer
2. **Public/Private Toggle** - Test both public and private uploads
3. **Upload Functionality** - Upload files to DigitalOcean Spaces
4. **File Validation** - Automatically detect file types
5. **URL Generation** - Get public URLs or signed URLs (for private files)
6. **File Deletion** - Delete test files after verification
7. **Detailed Response** - See complete upload details

### Test Scenarios:

#### ✓ Public File Upload
- Toggle "Public Access" to ON
- Upload a file
- You'll get a public URL you can access directly
- Format: `https://razanstorage.sfo3.digitaloceanspaces.com/test-uploads/...`

#### ✓ Private File Upload
- Toggle "Public Access" to OFF
- Upload a file
- You'll get a signed URL (valid for 1 hour)
- Signed URLs include authentication tokens for temporary access

## 📊 What You'll See

### On Success:
- ✅ File uploaded successfully
- File details (name, size, type, key)
- File type detection (Document/Image/Video)
- Access URL (public or signed)
- File exists confirmation
- Delete button to clean up

### On Failure:
- ❌ Error message with details
- Troubleshooting information

## 🔍 API Endpoints Created

### Upload Endpoint
```
POST /api/test-upload
```

### Delete Endpoint
```
DELETE /api/test-upload?fileKey={key}
```

## 🧪 Testing Steps

1. **Start your dev server**
   ```bash
   bun dev
   ```

2. **Navigate to the test page**
   ```
   http://localhost:3000/test-upload
   ```

3. **Test Public Upload**
   - Select a file (any type: PDF, image, document, etc.)
   - Keep "Public Access" ON
   - Click "Upload File"
   - Click the generated URL to verify access

4. **Test Private Upload**
   - Select another file
   - Toggle "Public Access" OFF
   - Click "Upload File"
   - Click the signed URL to verify access

5. **Test File Deletion**
   - Click "Delete File" button
   - File should be removed from Spaces

6. **Check Your Spaces Dashboard**
   - Go to: https://cloud.digitalocean.com/spaces
   - Select "razanstorage"
   - You should see uploaded files in the `test-uploads/` folder

## 🐛 Troubleshooting

### Error: "Failed to upload file"

**Check:**
1. Are environment variables added to `.env.local`?
2. Did you restart the dev server after adding variables?
3. Is your bucket name correct (`razanstorage`)?
4. Are your access credentials correct?

### Error: "Access Denied"

**Check:**
1. Verify your Access Key ID and Secret Access Key
2. Check bucket permissions in DigitalOcean dashboard
3. Ensure the bucket exists in the `sfo3` region

### File uploads but URL doesn't work

**Check:**
1. For public files: Check bucket CORS settings
2. For private files: Signed URLs expire after 1 hour
3. Verify the file actually exists in your Spaces dashboard

## 📁 File Structure Created

```
src/
├── app/
│   ├── api/
│   │   └── test-upload/
│   │       └── route.ts          # Test API endpoints
│   └── test-upload/
│       └── page.tsx               # Test page UI
└── lib/
    └── s3.ts                       # S3 utilities
```

## 🧹 Cleanup

After successful testing:

1. **Delete test files** - Use the "Delete File" button on the test page
2. **Or delete manually** - Go to your Spaces dashboard and delete the `test-uploads/` folder
3. **Optional**: Remove the test page and API route if not needed in production

## 🚀 Next Steps

Once testing is successful:
1. Integrate S3 upload into your actual application
2. Update file validation rules for your use case
3. Implement proper user authentication
4. Add file size limits appropriate for your needs
5. Set up CORS if needed for direct frontend uploads

## 📝 Example Output

```json
{
  "success": true,
  "message": "File uploaded successfully!",
  "data": {
    "fileKey": "test-uploads/test-user-1234567890/1234567890-abc123-example.pdf",
    "fileName": "example.pdf",
    "fileSize": "1.5 MB",
    "fileType": "application/pdf",
    "isPublic": true,
    "publicUrl": "https://razanstorage.sfo3.digitaloceanspaces.com/test-uploads/...",
    "signedUrl": null,
    "exists": true,
    "validators": {
      "isDocument": true,
      "isImage": false,
      "isVideo": false
    }
  }
}
```

## ✨ Features Demonstrated

- ✅ File upload to DigitalOcean Spaces
- ✅ Public file access
- ✅ Private file access with signed URLs
- ✅ File type detection and validation
- ✅ File existence checking
- ✅ File deletion
- ✅ Unique file key generation
- ✅ Error handling
- ✅ File size formatting

Happy testing! 🎉





