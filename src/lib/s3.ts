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
const SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT || 'https://sfo3.digitaloceanspaces.com'
const SPACES_REGION = process.env.DO_SPACES_REGION || 'sfo3'
const SPACES_BUCKET = process.env.DO_SPACES_BUCKET || 'razanstorage'
const SPACES_ACCESS_KEY_ID = process.env.DO_SPACES_ACCESS_KEY_ID || ''
const SPACES_SECRET_ACCESS_KEY = process.env.DO_SPACES_SECRET_ACCESS_KEY || ''

// Initialize S3 Client for DigitalOcean Spaces
// Using path-style to avoid hostname doubling issues
const s3Client = new S3Client({
    endpoint: SPACES_ENDPOINT,
    region: SPACES_REGION,
    credentials: {
        accessKeyId: SPACES_ACCESS_KEY_ID,
        secretAccessKey: SPACES_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Use path-style URLs: endpoint/bucket/key
})

/**
 * Upload a file to DigitalOcean Spaces
 * @param file - File buffer or stream
 * @param key - File path/key in the bucket
 * @param contentType - MIME type of the file
 * @param isPublic - Whether to return public URL or file key (default: false)
 *                   Note: Actual file permissions are controlled at the bucket level in DigitalOcean Spaces
 * @returns Promise with the file URL (if public) or file key (if private)
 */
export async function uploadFile(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string,
    isPublic: boolean = false
): Promise<string> {
    try {
        const params: PutObjectCommandInput = {
            Bucket: SPACES_BUCKET,
            Key: key,
            Body: file,
            ContentType: contentType,
            // Note: DigitalOcean Spaces doesn't support ACL in PutObject
            // File permissions are controlled at the bucket level
        }

        const command = new PutObjectCommand(params)
        await s3Client.send(command)

        // Return the public URL
        if (isPublic) {
            // DigitalOcean Spaces public URL format: https://bucket-name.region.digitaloceanspaces.com/key
            // Always construct using bucket.region format regardless of path-style config
            const publicUrl = `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com/${key}`
            return publicUrl
        }

        // For private files, return the key (you'll need to generate signed URLs later)
        return key
    } catch (error) {
        console.error('Error uploading file to Spaces:', error)
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

