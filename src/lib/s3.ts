import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// DigitalOcean Spaces Configuration
const SPACES_REGION = process.env.DO_SPACES_REGION || 'sfo3'
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET || 'razanstorage'
const SPACES_ACCESS_KEY_ID = process.env.DO_SPACES_ACCESS_KEY_ID || ''
const SPACES_SECRET_ACCESS_KEY = process.env.DO_SPACES_SECRET_ACCESS_KEY || ''

// Construct the correct endpoint (should NOT include bucket name)
// Format: https://REGION.digitaloceanspaces.com
const SPACES_ENDPOINT = `https://${SPACES_REGION}.digitaloceanspaces.com`

// Log configuration for debugging
console.log('🔧 S3 Configuration:', {
    endpoint: SPACES_ENDPOINT,
    region: SPACES_REGION,
    bucket: SPACES_BUCKET,
})

// Initialize S3 Client for DigitalOcean Spaces
// Using virtual-hosted style URLs (bucket.region.digitaloceanspaces.com)
const s3Client = new S3Client({
    endpoint: SPACES_ENDPOINT,
    region: SPACES_REGION,
    credentials: {
        accessKeyId: SPACES_ACCESS_KEY_ID,
        secretAccessKey: SPACES_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, // Use virtual-hosted style: bucket.region.digitaloceanspaces.com/key
})

/**
 * Upload a file to DigitalOcean Spaces
 * @param file - File buffer or stream
 * @param key - File path/key in the bucket
 * @param contentType - MIME type of the file
 * @param isPublic - Whether the file should be publicly accessible (default: true for Standard buckets)
 * @returns Promise with the file URL (if public) or file key (if private)
 */
export async function uploadFile(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string,
    isPublic: boolean = true
): Promise<string> {
    try {
        // Prepare upload parameters
        const params: PutObjectCommandInput = {
            Bucket: SPACES_BUCKET,
            Key: key,
            Body: file,
            ContentType: contentType,
            // Set ACL to public-read for Standard buckets to make files publicly accessible
            ACL: isPublic ? 'public-read' : 'private',
            // Add cache control for better performance
            CacheControl: 'public, max-age=31536000', // 1 year
        }

        // For audio files, ensure proper content disposition for inline playback
        if (contentType.startsWith('audio/')) {
            params.ContentDisposition = 'inline'
            console.log('🎵 Audio file detected - setting ContentDisposition to inline')
        }

        console.log('📤 Uploading file to Spaces:', {
            bucket: SPACES_BUCKET,
            region: SPACES_REGION,
            key,
            contentType,
            isPublic,
            fileSize: file.length,
            cacheControl: params.CacheControl,
            contentDisposition: params.ContentDisposition,
        })

        const command = new PutObjectCommand(params)
        const response = await s3Client.send(command)

        console.log('✅ Upload successful:', {
            etag: response.ETag,
            key,
        })

        // Return the public URL
        if (isPublic) {
            // DigitalOcean Spaces public URL format: https://bucket-name.region.digitaloceanspaces.com/key
            const publicUrl = `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com/${key}`
            console.log('🔗 Public URL:', publicUrl)
            return publicUrl
        }

        // For private files, return the key (you'll need to generate signed URLs later)
        return key
    } catch (error) {
        console.error('❌ Error uploading file to Spaces:', {
            bucket: SPACES_BUCKET,
            region: SPACES_REGION,
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: error,
        })
        throw new Error('Failed to upload file')
    }
}

/**
 * Delete a file from DigitalOcean Spaces
 * @param key - File path/key in the bucket
 * @returns Promise<void>
 */
export async function deleteFile(key: string): Promise<void> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: key,
        })

        await s3Client.send(command)
    } catch (error) {
        console.error('Error deleting file from Spaces:', error)
        throw new Error('Failed to delete file')
    }
}

/**
 * Generate a signed URL for private file access
 * @param key - File path/key in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise with the signed URL
 */
export async function getSignedFileUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: key,
        })

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
        return signedUrl
    } catch (error) {
        console.error('Error generating signed URL:', error)
        throw new Error('Failed to generate signed URL')
    }
}

/**
 * Check if a file exists in DigitalOcean Spaces
 * @param key - File path/key in the bucket
 * @returns Promise<boolean>
 */
export async function fileExists(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: SPACES_BUCKET,
            Key: key,
        })

        await s3Client.send(command)
        return true
    } catch (error) {
        return false
    }
}

/**
 * Generate a unique file key with timestamp and random string
 * @param userId - User ID for organizing files
 * @param originalFileName - Original file name
 * @param folder - Optional folder path (e.g., 'resumes', 'documents')
 * @returns Unique file key
 */
export function generateFileKey(
    userId: string,
    originalFileName: string,
    folder?: string
): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = originalFileName.split('.').pop()
    const sanitizedName = originalFileName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 50)

    const basePath = folder ? `${folder}/${userId}` : userId
    return `${basePath}/${timestamp}-${randomString}-${sanitizedName}`
}

/**
 * Get file size in a human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate file type against allowed types
 * @param contentType - MIME type of the file
 * @param allowedTypes - Array of allowed MIME types
 * @returns boolean
 */
export function validateFileType(
    contentType: string,
    allowedTypes: string[]
): boolean {
    return allowedTypes.includes(contentType)
}

/**
 * Common file type validators
 */
export const FileTypeValidators = {
    // Documents
    documents: (contentType: string) =>
        validateFileType(contentType, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ]),

    // Images
    images: (contentType: string) =>
        validateFileType(contentType, [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ]),

    // Videos
    videos: (contentType: string) =>
        validateFileType(contentType, [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/webm',
        ]),

    // All files
    all: () => true,
}

export { s3Client }

