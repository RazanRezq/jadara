# DigitalOcean Spaces - Credentials & Configuration

## 🔑 Your Configuration

**Copy these exact values to your `.env.local` file:**

```bash
# DigitalOcean Spaces Configuration
# Note: ENDPOINT should be the base URL without bucket name
DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
DO_SPACES_REGION=sfo3
DO_SPACES_BUCKET=razanstorage
DO_SPACES_ACCESS_KEY_ID=DO00MJP93D32CLRG3896
DO_SPACES_SECRET_ACCESS_KEY=xoTv1d8siHH64iOzNz1y01TFyUTeZsoZRq7PIGzv8fY
```

## 📍 Space Details

- **Bucket Name**: razanstorage
- **Region**: San Francisco 3 (sfo3)
- **Origin Endpoint**: https://razanstorage.sfo3.digitaloceanspaces.com
- **Access Key ID**: DO00MJP93D32CLRG3896

## 🚀 Quick Start

1. Copy the environment variables above to your `.env.local` file
2. Restart your development server: `bun dev`
3. Use the S3 utility functions from `@/lib/s3`

## 📚 Usage

See `S3_SETUP_GUIDE.md` for complete documentation and examples.

## 🔒 Security Note

⚠️ **Never commit `.env.local` to version control!** (It's already in `.gitignore`)

