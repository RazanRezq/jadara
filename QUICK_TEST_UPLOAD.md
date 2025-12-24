# Quick Upload Test Guide

## 🚀 Quick Test Steps

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
bun dev
```

### 2. Test Upload via Browser
Visit: `http://localhost:3000/test-upload`

Upload a test file and check:
- ✅ Upload succeeds
- ✅ `publicUrl` is returned
- ✅ URL format: `https://razan-recruitment.fra1.digitaloceanspaces.com/...`
- ✅ Clicking URL downloads/displays the file (no 403 or NoSuchKey)

### 3. Check Console Logs
Look for these logs in your terminal:

```
📤 Uploading file to Spaces: {
  bucket: 'razan-recruitment',
  region: 'fra1',
  key: 'test-uploads/...',
  contentType: 'application/pdf',
  isPublic: true,
  fileSize: 12345
}
✅ Upload successful: { etag: '"..."', key: '...' }
🔗 Public URL: https://razan-recruitment.fra1.digitaloceanspaces.com/...
```

### 4. Test Application Flow
1. Go to: `http://localhost:3000/apply/[jobId]`
2. Upload a CV
3. Record audio for a voice question
4. Check console logs for successful uploads
5. Verify files are accessible

## ✅ Success Indicators

- No "NoSuchKey" errors
- No "403 Forbidden" errors
- Files download/display correctly
- Console shows successful uploads with URLs

## ❌ Failure Indicators

If you still see errors:

### NoSuchKey Error
- **Cause:** URL mismatch (should be fixed now)
- **Check:** Console logs show correct URL format
- **Verify:** `DO_SPACES_BUCKET` and `DO_SPACES_REGION` in `.env.local`

### 403 Forbidden Error
- **Cause:** ACL not set correctly
- **Check:** Bucket is "Standard" type (not "Restricted")
- **Verify:** Access key has write permissions

### Upload Fails Completely
- **Cause:** Invalid credentials or network issue
- **Check:** `.env.local` has correct credentials
- **Verify:** MongoDB and internet connection working

## 🔧 Environment Check

Verify your `.env.local`:

```env
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
DO_SPACES_REGION=fra1
DO_SPACES_BUCKET=razan-recruitment
DO_SPACES_ACCESS_KEY_ID=DO00MJP93D32CLRG3896
DO_SPACES_SECRET_ACCESS_KEY=your-secret-key
```

## 📝 Expected URL Format

Correct format:
```
https://razan-recruitment.fra1.digitaloceanspaces.com/uploads/cv/uuid-file.pdf
       └──── bucket ────┘ └region┘                  └──────── key ────────┘
```

Wrong formats (old configuration):
```
❌ https://fra1.digitaloceanspaces.com/razan-recruitment/uploads/cv/file.pdf
❌ https://razanstorage.sfo3.digitaloceanspaces.com/uploads/cv/file.pdf
```

## 🎯 Quick cURL Test

```bash
curl -X POST http://localhost:3000/api/test-upload \
  -F "file=@/path/to/test.pdf" \
  -F "isPublic=true"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://razan-recruitment.fra1.digitaloceanspaces.com/...",
    "exists": true
  }
}
```

## 📞 Next Steps After Success

1. ✅ Test with real application flow
2. ✅ Upload CVs and audio recordings
3. ✅ Run AI analysis on new candidates
4. ✅ Verify all features work end-to-end

## 🆘 Still Having Issues?

Check these files for more details:
- `NOSUCHKEY_FIX.md` - Detailed explanation of the fix
- `PUBLIC_FILES_SETUP.md` - Public access configuration
- Console logs in terminal - Look for error details



