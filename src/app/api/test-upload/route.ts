import { NextRequest, NextResponse } from 'next/server'
import {
    uploadFile,
    generateFileKey,
    FileTypeValidators,
    formatFileSize,
    deleteFile,
    fileExists,
    getSignedFileUrl,
} from '@/lib/s3'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const isPublic = formData.get('isPublic') === 'true'

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            )
        }

        // Log file details
        console.log('📁 File Details:', {
            name: file.name,
            type: file.type,
            size: formatFileSize(file.size),
        })

        // Validate file size (max 50MB for testing)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File too large. Maximum size is ${formatFileSize(maxSize)}`,
                },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())

        // Generate unique key
        const testUserId = 'test-user-' + Date.now()
        const fileKey = generateFileKey(testUserId, file.name, 'test-uploads')

        console.log('🔑 Generated file key:', fileKey)

        // Upload file
        const result = await uploadFile(buffer, fileKey, file.type, isPublic)

        console.log('✅ Upload successful:', result)

        // Check if file exists
        const exists = await fileExists(fileKey)
        console.log('🔍 File exists check:', exists)

        let signedUrl = null
        if (!isPublic) {
            // Generate signed URL for private files (valid for 1 hour)
            signedUrl = await getSignedFileUrl(fileKey, 3600)
            console.log('🔒 Generated signed URL')
        }

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully!',
            data: {
                fileKey,
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                fileType: file.type,
                isPublic,
                publicUrl: isPublic ? result : null,
                signedUrl: !isPublic ? signedUrl : null,
                exists,
                validators: {
                    isDocument: FileTypeValidators.documents(file.type),
                    isImage: FileTypeValidators.images(file.type),
                    isVideo: FileTypeValidators.videos(file.type),
                },
            },
        })
    } catch (error) {
        console.error('❌ Upload error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to upload file',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

// DELETE endpoint to test file deletion
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileKey = searchParams.get('fileKey')

        if (!fileKey) {
            return NextResponse.json(
                { success: false, error: 'File key is required' },
                { status: 400 }
            )
        }

        console.log('🗑️ Deleting file:', fileKey)

        // Check if file exists before deletion
        const existsBefore = await fileExists(fileKey)

        if (!existsBefore) {
            return NextResponse.json(
                { success: false, error: 'File does not exist' },
                { status: 404 }
            )
        }

        // Delete the file
        await deleteFile(fileKey)

        // Verify deletion
        const existsAfter = await fileExists(fileKey)

        console.log('✅ File deleted successfully')

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully!',
            data: {
                fileKey,
                existedBefore: existsBefore,
                existsAfter: existsAfter,
            },
        })
    } catch (error) {
        console.error('❌ Delete error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete file',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}



