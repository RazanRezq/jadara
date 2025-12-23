"use server"

import dbConnect from "@/lib/mongodb"
import Applicant from "@/models/Applicants/applicantSchema"
import Response from "@/models/Responses/responseSchema"
import Job from "@/models/Jobs/jobSchema"
import Evaluation from "@/models/Evaluations/evaluationSchema"
import { v4 as uuidv4 } from "uuid"
import { uploadFile as uploadToSpaces } from "@/lib/s3"
import {
    evaluateCandidate,
    CandidateEvaluationInput,
} from "@/services/evaluation"

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
    // AI Evaluation status
    evaluationStarted?: boolean
    evaluationCompleted?: boolean
    evaluationScore?: number
    evaluationError?: string
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

        // Create the applicant record
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

        // ============================================
        // TRIGGER AI EVALUATION (Real-time)
        // ============================================
        // Run evaluation immediately after saving
        // Errors here won't affect the application submission
        const applicantId = applicant._id.toString()
        let evaluationResult: {
            started: boolean
            completed: boolean
            score?: number
            error?: string
        } = { started: false, completed: false }

        try {
            console.log("[Submission] Starting AI evaluation for applicant:", applicantId)
            
            // Fetch the job to get criteria
            const job = await Job.findById(payload.jobId)
            
            if (job) {
                // Build voice responses from the submitted data
                const voiceResponses: CandidateEvaluationInput['voiceResponses'] = []
                const textResponses: CandidateEvaluationInput['textResponses'] = []

                for (const response of payload.responses) {
                    const questionText = job.questions?.[response.questionIndex]?.text || `Question ${response.questionIndex + 1}`
                    const questionWeight = job.questions?.[response.questionIndex]?.weight || 5

                    if (response.type === 'voice' && response.audioUrl) {
                        voiceResponses.push({
                            questionId: `q_${response.questionIndex}`,
                            questionText,
                            questionWeight,
                            audioUrl: response.audioUrl,
                        })
                    } else if (response.type === 'text' && response.answer) {
                        textResponses.push({
                            questionId: `q_${response.questionIndex}`,
                            questionText,
                            questionWeight, // Include weight
                            answer: response.answer,
                        })
                    }
                }

                // Build job criteria
                const jobCriteria: CandidateEvaluationInput['jobCriteria'] = {
                    title: job.title,
                    description: job.description,
                    skills: job.skills?.map(s => ({
                        name: s.name,
                        importance: s.importance,
                        type: s.type,
                    })) || [],
                    minExperience: job.minExperience || 0,
                    languages: job.languages?.map(l => ({
                        language: l.language,
                        level: l.level,
                    })) || [],
                    criteria: job.criteria?.map(c => ({
                        name: c.name,
                        description: c.description,
                        weight: c.weight,
                        required: c.required,
                    })) || [],
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    autoRejectThreshold: job.autoRejectThreshold || 35,
                }

                // Build candidate input
                const candidateInput: CandidateEvaluationInput = {
                    applicantId,
                    jobId: payload.jobId,
                    personalData: {
                        name: payload.personalData.name,
                        email: payload.personalData.email,
                        phone: payload.personalData.phone,
                        age: payload.personalData.age,
                        yearsOfExperience: payload.personalData.yearsOfExperience,
                        salaryExpectation: payload.personalData.salaryExpectation,
                        linkedinUrl: payload.personalData.linkedinUrl,
                        portfolioUrl: payload.personalData.portfolioUrl,
                    },
                    voiceResponses,
                    textResponses,
                    cvUrl: payload.fileUploads.cvUrl,
                    jobCriteria,
                }

                evaluationResult.started = true
                console.log("[Submission] Evaluation input prepared, starting AI analysis...")

                // Run the evaluation
                const result = await evaluateCandidate(candidateInput)

                if (result.success && result.evaluation) {
                    evaluationResult.completed = true
                    evaluationResult.score = result.evaluation.overallScore

                    // Save evaluation to database
                    console.log('[Submission] 🔍 Saving evaluation with detailed analysis:', {
                        hasVoiceAnalysis: !!result.evaluation.voiceAnalysisDetails,
                        voiceAnalysisLength: result.evaluation.voiceAnalysisDetails?.length,
                        hasSocialInsights: !!result.evaluation.socialProfileInsights,
                        hasTextAnalysis: !!result.evaluation.textResponseAnalysis,
                    })
                    
                    await Evaluation.create({
                        applicantId,
                        jobId: payload.jobId,
                        overallScore: result.evaluation.overallScore,
                        criteriaMatches: result.evaluation.criteriaMatches,
                        strengths: result.evaluation.strengths,
                        weaknesses: result.evaluation.weaknesses,
                        redFlags: result.evaluation.redFlags,
                        summary: result.evaluation.summary,
                        recommendation: result.evaluation.recommendation,
                        recommendationReason: result.evaluation.recommendationReason,
                        suggestedQuestions: result.evaluation.suggestedQuestions,
                        sentimentScore: result.evaluation.sentimentScore,
                        confidenceScore: result.evaluation.confidenceScore,
                        // NEW: Detailed analysis sections
                        voiceAnalysisDetails: result.evaluation.voiceAnalysisDetails,
                        socialProfileInsights: result.evaluation.socialProfileInsights,
                        textResponseAnalysis: result.evaluation.textResponseAnalysis,
                        // NEW: AI Analysis Breakdown for transparency
                        aiAnalysisBreakdown: result.evaluation.aiAnalysisBreakdown,
                        isProcessed: true,
                        processedAt: new Date(),
                    })

                    // Update applicant with AI results (use English for legacy fields)
                    await Applicant.findByIdAndUpdate(applicantId, {
                        status: 'evaluated',
                        aiScore: result.evaluation.overallScore,
                        aiSummary: result.evaluation.summary.en,
                        aiRedFlags: result.evaluation.redFlags.en,
                        cvParsedData: result.evaluation.parsedResume,
                    })

                    // Update voice response transcripts
                    for (const transcript of result.evaluation.transcripts) {
                        await Response.findOneAndUpdate(
                            { applicantId, questionId: transcript.questionId },
                            {
                                rawTranscript: transcript.rawTranscript,
                                cleanTranscript: transcript.cleanTranscript,
                            }
                        )
                    }

                    console.log("[Submission] AI evaluation completed successfully!")
                    console.log("[Submission] Score:", result.evaluation.overallScore)
                    console.log("[Submission] Recommendation:", result.evaluation.recommendation)
                } else {
                    evaluationResult.error = result.error || "Evaluation failed"
                    console.warn("[Submission] AI evaluation failed:", result.error)
                }
            } else {
                evaluationResult.error = "Job not found for evaluation"
                console.warn("[Submission] Job not found for AI evaluation")
            }
        } catch (evalError) {
            // Graceful error handling - don't fail the submission
            evaluationResult.error = evalError instanceof Error ? evalError.message : "Evaluation error"
            console.error("[Submission] AI evaluation error (non-blocking):", evalError)
        }

        return {
            success: true,
            applicantId,
            evaluationStarted: evaluationResult.started,
            evaluationCompleted: evaluationResult.completed,
            evaluationScore: evaluationResult.score,
            evaluationError: evaluationResult.error,
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

