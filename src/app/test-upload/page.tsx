'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Upload, Check, X, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UploadResponse {
    success: boolean
    message?: string
    error?: string
    details?: string
    data?: {
        fileKey: string
        fileName: string
        fileSize: string
        fileType: string
        isPublic: boolean
        publicUrl: string | null
        signedUrl: string | null
        exists: boolean
        validators: {
            isDocument: boolean
            isImage: boolean
            isVideo: boolean
        }
    }
}

export default function TestUploadPage() {
    const [file, setFile] = useState<File | null>(null)
    const [isPublic, setIsPublic] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [response, setResponse] = useState<UploadResponse | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null
        setFile(selectedFile)
        setResponse(null)
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setResponse(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('isPublic', isPublic.toString())

            const res = await fetch('/api/test-upload', {
                method: 'POST',
                body: formData,
            })

            const data: UploadResponse = await res.json()
            setResponse(data)
        } catch (error) {
            setResponse({
                success: false,
                error: 'Network error',
                details: error instanceof Error ? error.message : 'Unknown error',
            })
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!response?.data?.fileKey) return

        setDeleting(true)

        try {
            const res = await fetch(
                `/api/test-upload?fileKey=${encodeURIComponent(response.data.fileKey)}`,
                {
                    method: 'DELETE',
                }
            )

            const data = await res.json()

            if (data.success) {
                setResponse(null)
                setFile(null)
            } else {
                alert('Failed to delete: ' + data.error)
            }
        } catch (error) {
            alert('Delete failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setDeleting(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setResponse(null)
        setIsPublic(true)
    }

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">S3 Upload Test</h1>
                    <p className="text-muted-foreground mt-2">
                        Test DigitalOcean Spaces file upload functionality
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Upload File</CardTitle>
                        <CardDescription>
                            Select a file and upload it to DigitalOcean Spaces
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* File Input */}
                        <div className="space-y-2">
                            <Label htmlFor="file">Choose File</Label>
                            <input
                                id="file"
                                type="file"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                    file:me-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary file:text-primary-foreground
                                    hover:file:bg-primary/90
                                    cursor-pointer"
                            />
                            {file && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </p>
                            )}
                        </div>

                        {/* Public/Private Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="public-toggle">Public Access</Label>
                                <p className="text-sm text-muted-foreground">
                                    {isPublic
                                        ? 'File will be publicly accessible'
                                        : 'File will be private (signed URL generated)'}
                                </p>
                            </div>
                            <Switch
                                id="public-toggle"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </div>

                        {/* Upload Button */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="flex-1"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="me-2 h-4 w-4" />
                                        Upload File
                                    </>
                                )}
                            </Button>
                            {response && (
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Response Display */}
                {response && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    {response.success ? (
                                        <>
                                            <Check className="h-5 w-5 text-green-500" />
                                            Upload Successful
                                        </>
                                    ) : (
                                        <>
                                            <X className="h-5 w-5 text-red-500" />
                                            Upload Failed
                                        </>
                                    )}
                                </CardTitle>
                                {response.success && response.data && (
                                    <Button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="me-2 h-3 w-3 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="me-2 h-3 w-3" />
                                                Delete File
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {response.success && response.data ? (
                                <>
                                    {/* File Details */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">File Details</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-muted-foreground">File Name:</div>
                                            <div className="font-mono">{response.data.fileName}</div>

                                            <div className="text-muted-foreground">File Size:</div>
                                            <div>{response.data.fileSize}</div>

                                            <div className="text-muted-foreground">File Type:</div>
                                            <div className="font-mono">{response.data.fileType}</div>

                                            <div className="text-muted-foreground">File Key:</div>
                                            <div className="font-mono text-xs break-all">
                                                {response.data.fileKey}
                                            </div>

                                            <div className="text-muted-foreground">Access:</div>
                                            <div>
                                                <Badge variant={response.data.isPublic ? 'default' : 'secondary'}>
                                                    {response.data.isPublic ? 'Public' : 'Private'}
                                                </Badge>
                                            </div>

                                            <div className="text-muted-foreground">File Exists:</div>
                                            <div>
                                                <Badge variant={response.data.exists ? 'default' : 'destructive'}>
                                                    {response.data.exists ? 'Yes' : 'No'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Type Validators */}
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">File Type Detection</h3>
                                        <div className="flex gap-2">
                                            <Badge variant={response.data.validators.isDocument ? 'default' : 'outline'}>
                                                {response.data.validators.isDocument ? '✓' : '✗'} Document
                                            </Badge>
                                            <Badge variant={response.data.validators.isImage ? 'default' : 'outline'}>
                                                {response.data.validators.isImage ? '✓' : '✗'} Image
                                            </Badge>
                                            <Badge variant={response.data.validators.isVideo ? 'default' : 'outline'}>
                                                {response.data.validators.isVideo ? '✓' : '✗'} Video
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* URL Display */}
                                    {response.data.publicUrl && (
                                        <Alert>
                                            <ExternalLink className="h-4 w-4" />
                                            <AlertTitle>Public URL</AlertTitle>
                                            <AlertDescription className="mt-2">
                                                <a
                                                    href={response.data.publicUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline break-all text-xs"
                                                >
                                                    {response.data.publicUrl}
                                                </a>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {response.data.signedUrl && (
                                        <Alert>
                                            <ExternalLink className="h-4 w-4" />
                                            <AlertTitle>Signed URL (Valid for 1 hour)</AlertTitle>
                                            <AlertDescription className="mt-2">
                                                <a
                                                    href={response.data.signedUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline break-all text-xs"
                                                >
                                                    {response.data.signedUrl.substring(0, 100)}...
                                                </a>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            ) : (
                                <Alert variant="destructive">
                                    <X className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        <p className="font-semibold">{response.error}</p>
                                        {response.details && (
                                            <p className="text-sm mt-2 font-mono">{response.details}</p>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>1. Make sure you've added the environment variables to <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code></p>
                        <p>2. Restart your development server if you just added the variables</p>
                        <p>3. Select a file and choose whether it should be public or private</p>
                        <p>4. Click "Upload File" to test the upload functionality</p>
                        <p>5. If successful, you'll see file details and a URL to access it</p>
                        <p>6. You can delete the test file after verification</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}












