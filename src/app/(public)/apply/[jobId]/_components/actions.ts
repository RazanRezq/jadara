"use server"

import dbConnect from "@/lib/mongodb"
import Applicant from "@/models/Applicants/applicantSchema"
import Response from "@/models/Responses/responseSchema"
import { v4 as uuidv4 } from "uuid"
import { uploadFile as uploadToSpaces } from "@/lib/s3"

// ============================================
// TYPES
// ============================================

export interface PersonalData {
    name: string
    email: string
    phone: string
    age?: number
    major?: string
    yearsOfExperience?: number
    salaryExpectation?: number
    linkedinUrl?: string
    portfolioUrl?: string
    screeningAnswers?: Record<string, boolean>
    languageProficiency?: Record<string, string>
}

export interface QuestionResponse {
    questionIndex: number
    type: "text" | "voice"
    answer?: string
    audioUrl?: string
    audioDuration?: number
    startedAt: string
    completedAt: string
    isAutoSubmitted: boolean
}

export interface FileUploadData {
    cvUrl?: string
    cvFileName?: string
    portfolioUrl?: string
    portfolioFileName?: string
}

export interface ApplicationSubmissionPayload {
    jobId: string
    personalData: PersonalData
    responses: QuestionResponse[]
    fileUploads: FileUploadData
    notes: string
    metadata: {
        startedAt: string
        completedAt: string
        isSuspicious: boolean
        suspiciousReasons: string[]
        ipAddress?: string
        userAgent?: string
    }
}

export interface SubmitApplicationResult {
    success: boolean
    error?: string
    applicantId?: string
    // AI Evaluation result
    evaluationStatus?: 'pending' | 'processing' | 'completed' | 'failed'
    aiScore?: number
    aiSummary?: string
}

// ============================================
// ATOMIC SUBMISSION ACTION
// ============================================

/**
 * Submits the complete application to the database in a single atomic operation.
 * This creates the Applicant record and all Response records.
 * 
 * This is the ONLY point where data is written to the database.
 */
export async function submitApplication(
    payload: ApplicationSubmissionPayload
): Promise<SubmitApplicationResult> {
    try {
        await dbConnect()

        // Validate required fields
        if (!payload.jobId) {
            return { success: false, error: "Job ID is required" }
        }

        if (!payload.personalData || !payload.personalData.email) {
            return { success: false, error: "Personal data is required" }
        }

        // Check if applicant already applied for this job
        const existingApplicant = await Applicant.findOne({
            jobId: payload.jobId,
            "personalData.email": payload.personalData.email.toLowerCase(),
            isComplete: true,
        })

        if (existingApplicant) {
            return {
                success: false,
                error: "You have already submitted an application for this position",
            }
        }

        // Generate unique session ID
        const sessionId = uuidv4()

        // Convert screeningAnswers and languageProficiency to Maps for MongoDB
        const personalData: any = {
            ...payload.personalData,
            email: payload.personalData.email.toLowerCase(),
        }

        // Convert screeningAnswers object to Map if it exists
        if (payload.personalData.screeningAnswers && Object.keys(payload.personalData.screeningAnswers).length > 0) {
            personalData.screeningAnswers = new Map(
                Object.entries(payload.personalData.screeningAnswers)
            )
        }

        // Convert languageProficiency object to Map if it exists
        if (payload.personalData.languageProficiency && Object.keys(payload.personalData.languageProficiency).length > 0) {
            personalData.languageProficiency = new Map(
                Object.entries(payload.personalData.languageProficiency)
            )
        }

        // Create the applicant record with pending evaluation status
        const applicant = await Applicant.create({
            jobId: payload.jobId,
            personalData,
            cvUrl: payload.fileUploads.cvUrl,
            notes: payload.notes || "",
            sessionId,
            isComplete: true,
            submittedAt: new Date(),
            isSuspicious: payload.metadata.isSuspicious,
            suspiciousReason: payload.metadata.suspiciousReasons.join("; ") || undefined,
            ipAddress: payload.metadata.ipAddress,
            userAgent: payload.metadata.userAgent,
            status: "new",
            evaluationStatus: "pending", // Will be updated by background task
        })

        // Create all response records
        if (payload.responses.length > 0) {
            const responseDocuments = payload.responses.map((response) => ({
                applicantId: applicant._id,
                questionId: `q_${response.questionIndex}`, // Using question index as ID
                type: response.type,
                textAnswer: response.type === "text" ? response.answer : undefined,
                audioUrl: response.type === "voice" ? response.audioUrl : undefined,
                audioDuration: response.audioDuration,
                startedAt: new Date(response.startedAt),
                completedAt: new Date(response.completedAt),
                isAutoSubmitted: response.isAutoSubmitted,
                hasRecordingIssue: false,
            }))

            // Bulk insert all responses
            await Response.insertMany(responseDocuments)
        }

        const applicantId = applicant._id.toString()

        console.log("[Submission] Application saved successfully")
        console.log("[Submission] Starting AI evaluation synchronously...")

        // Run AI evaluation synchronously (blocking)
        try {
            // Mark as processing
            await Applicant.findByIdAndUpdate(applicantId, {
                evaluationStatus: 'processing',
            })

            // Call the internal evaluation API
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            const evaluationResponse = await fetch(`${baseUrl}/api/ai/evaluate/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicantId,
                    jobId: payload.jobId,
                }),
            })

            const evaluationResult = await evaluationResponse.json()

            if (evaluationResult.success) {
                console.log("[Submission] AI evaluation completed successfully")
                console.log("[Submission] Score:", evaluationResult.evaluation?.overallScore)

                // Fetch the updated applicant to get the AI results
                const updatedApplicant = await Applicant.findById(applicantId).select('aiScore aiSummary evaluationStatus')

                return {
                    success: true,
                    applicantId,
                    evaluationStatus: 'completed',
                    aiScore: updatedApplicant?.aiScore,
                    aiSummary: updatedApplicant?.aiSummary,
                }
            } else {
                console.error("[Submission] AI evaluation failed:", evaluationResult.error)

                // Update applicant with failed status
                await Applicant.findByIdAndUpdate(applicantId, {
                    evaluationStatus: 'failed',
                    evaluationError: evaluationResult.error || 'Evaluation failed',
                })

                // Still return success for the application, just note evaluation failed
                return {
                    success: true,
                    applicantId,
                    evaluationStatus: 'failed',
                }
            }
        } catch (evalError) {
            console.error("[Submission] AI evaluation error:", evalError)

            // Update applicant with failed status
            await Applicant.findByIdAndUpdate(applicantId, {
                evaluationStatus: 'failed',
                evaluationError: evalError instanceof Error ? evalError.message : 'Evaluation error',
            })

            // Still return success for the application
            return {
                success: true,
                applicantId,
                evaluationStatus: 'failed',
            }
        }
    } catch (error) {
        console.error("Submit application error:", error)
        
        // Handle duplicate key error (email already applied)
        if (error instanceof Error && error.message.includes("duplicate key")) {
            return {
                success: false,
                error: "You have already applied for this position",
            }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "An unexpected error occurred",
        }
    }
}

// ============================================
// FILE UPLOAD ACTION
// ============================================

/**
 * Uploads a file to DigitalOcean Spaces and returns the public URL.
 * This does NOT save to the database - just uploads and returns the URL.
 */
export async function uploadFile(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get("file") as File
        const fileType = formData.get("fileType") as string // "cv" | "portfolio" | "audio"

        if (!file) {
            return { success: false, error: "No file provided" }
        }

        // Validate file size
        const maxSizes: Record<string, number> = {
            cv: 10 * 1024 * 1024, // 10MB
            portfolio: 25 * 1024 * 1024, // 25MB
            audio: 50 * 1024 * 1024, // 50MB for audio
        }

        const maxSize = maxSizes[fileType] || 10 * 1024 * 1024
        if (file.size > maxSize) {
            return { success: false, error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` }
        }

        // Validate file type for CV
        if (fileType === "cv") {
            const validTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ]
            if (!validTypes.includes(file.type)) {
                return { success: false, error: "Invalid file type. Please upload PDF, DOC, or DOCX" }
            }
        }

        // Generate unique file path
        const uniqueId = uuidv4()
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const key = `uploads/${fileType}/${uniqueId}-${sanitizedFileName}`

        // Convert File to Buffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to DigitalOcean Spaces
        const url = await uploadToSpaces(buffer, key, file.type, true)

        return {
            success: true,
            url,
        }
    } catch (error) {
        console.error("File upload error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        }
    }
}

/**
 * Uploads audio blob to DigitalOcean Spaces.
 * Returns the cloud URL without saving to database.
 */
export async function uploadAudio(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const audio = formData.get("audio") as File
        const questionIndex = formData.get("questionIndex") as string

        if (!audio) {
            return { success: false, error: "No audio provided" }
        }

        // Validate audio size (max 50MB)
        const maxSize = 50 * 1024 * 1024
        if (audio.size > maxSize) {
            return { success: false, error: "Audio file too large. Maximum size is 50MB" }
        }

        // Generate unique file path
        const uniqueId = uuidv4()
        const timestamp = Date.now()
        const extension = audio.name.split(".").pop() || "webm"
        const key = `uploads/audio/q${questionIndex}_${uniqueId}_${timestamp}.${extension}`

        // Convert File/Blob to Buffer for upload
        const arrayBuffer = await audio.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Determine content type - ensure it's browser-compatible
        // Strip codec info for better compatibility, use base MIME type
        let contentType = audio.type || "audio/webm"
        
        // Normalize content type for better browser compatibility
        if (contentType.includes("webm")) {
            contentType = "audio/webm"
        } else if (contentType.includes("ogg")) {
            contentType = "audio/ogg"
        } else if (contentType.includes("mp4")) {
            contentType = "audio/mp4"
        } else if (contentType.includes("mpeg")) {
            contentType = "audio/mpeg"
        }

        console.log("🎤 Audio upload details:", {
            originalType: audio.type,
            normalizedType: contentType,
            size: audio.size,
            key,
        })

        // Upload to DigitalOcean Spaces
        const url = await uploadToSpaces(buffer, key, contentType, true)

        return {
            success: true,
            url,
        }
    } catch (error) {
        console.error("Audio upload error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Audio upload failed",
        }
    }
}

// ============================================
// VALIDATION CHECK
// ============================================

/**
 * Checks if an email has already applied for a job.
 * Used for early validation before starting the assessment.
 */
export async function checkExistingApplication(
    jobId: string,
    email: string
): Promise<{ exists: boolean; error?: string }> {
    try {
        await dbConnect()

        const existing = await Applicant.findOne({
            jobId,
            "personalData.email": email.toLowerCase(),
            isComplete: true,
        })

        return { exists: !!existing }
    } catch (error) {
        console.error("Check existing application error:", error)
        return { exists: false, error: "Failed to check application status" }
    }
}

