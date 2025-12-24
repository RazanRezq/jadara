"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

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
    screeningAnswers?: Record<string, boolean> // question text as key, answer as value
    languageProficiency?: Record<string, string> // language as key, proficiency level as value
}

export interface QuestionResponse {
    questionIndex: number
    type: "text" | "voice"
    answer?: string // For text questions
    audioUrl?: string // Cloud URL for voice questions (after upload)
    audioDuration?: number
    startedAt: string // ISO string
    completedAt: string // ISO string
    isAutoSubmitted: boolean
}

export interface FileUploadData {
    cvUrl?: string
    cvFileName?: string
    portfolioUrl?: string
    portfolioFileName?: string
}

export interface ApplicationState {
    // Job context
    jobId: string | null
    jobTitle: string | null

    // Personal data from landing page
    personalData: PersonalData | null

    // Question responses (accumulated)
    responses: QuestionResponse[]

    // File uploads
    fileUploads: FileUploadData

    // Additional notes from candidate
    notes: string

    // Session metadata
    startedAt: string | null
    ipAddress?: string
    userAgent?: string

    // Suspicious activity flags
    isSuspicious: boolean
    suspiciousReasons: string[]

    // Wizard state
    currentQuestionIndex: number
    wizardStep: "personalInfo" | "instructions" | "questions" | "upload" | "complete"

    // Submission state
    isSubmitted: boolean
    submittedAt: string | null
}

export interface ApplicationActions {
    // Initialize session
    initSession: (jobId: string, jobTitle: string) => void

    // Personal data
    setPersonalData: (data: PersonalData) => void
    backToPersonalInfo: () => void

    // Question responses
    addResponse: (response: QuestionResponse) => void
    hasResponseForQuestion: (questionIndex: number) => boolean
    getResponseForQuestion: (questionIndex: number) => QuestionResponse | undefined

    // File uploads
    setFileUpload: (data: Partial<FileUploadData>) => void

    // Notes
    setNotes: (text: string) => void

    // Suspicious activity
    flagAsSuspicious: (reason: string) => void

    // Navigation
    setCurrentQuestionIndex: (index: number) => void
    setWizardStep: (step: ApplicationState["wizardStep"]) => void
    goToNextQuestion: () => void
    goToPreviousQuestion: () => void

    // Submission
    markAsSubmitted: () => void

    // Reset
    resetSession: () => void

    // Get full state for submission
    getSubmissionPayload: () => ApplicationSubmissionPayload
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

// ============================================
// INITIAL STATE
// ============================================

const initialState: ApplicationState = {
    jobId: null,
    jobTitle: null,
    personalData: null,
    responses: [],
    fileUploads: {},
    notes: "",
    startedAt: null,
    isSuspicious: false,
    suspiciousReasons: [],
    currentQuestionIndex: 0,
    wizardStep: "personalInfo",
    isSubmitted: false,
    submittedAt: null,
}

// ============================================
// STORE
// ============================================

export const useApplicationStore = create<ApplicationState & ApplicationActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Initialize session
            initSession: (jobId: string, jobTitle: string) => {
                const existingState = get()
                
                // If same job and has started, don't reset (session recovery)
                if (existingState.jobId === jobId && existingState.startedAt && !existingState.isSubmitted) {
                    return
                }

                set({
                    ...initialState,
                    jobId,
                    jobTitle,
                    startedAt: new Date().toISOString(),
                    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                })
            },

            // Personal data
            setPersonalData: (data: PersonalData) => {
                set({ personalData: data })
            },

            backToPersonalInfo: () => {
                // Go back to personal info step without clearing data
                // This allows users to edit their information
                set({
                    wizardStep: "personalInfo",
                    currentQuestionIndex: 0,
                    // Keep personalData, responses, fileUploads intact
                })
            },

            // Question responses
            addResponse: (response: QuestionResponse) => {
                const { responses } = get()
                
                // Check if already exists
                const existingIndex = responses.findIndex(
                    (r) => r.questionIndex === response.questionIndex
                )

                if (existingIndex === -1) {
                    // New response - add it
                    set({ responses: [...responses, response] })
                } else {
                    // Response exists - only allow overwrite for text questions
                    // Voice questions cannot be re-recorded (anti-cheat)
                    if (response.type === "text") {
                        const updatedResponses = [...responses]
                        updatedResponses[existingIndex] = response
                        set({ responses: updatedResponses })
                    }
                    // Voice questions: don't overwrite (anti-cheat protection)
                }
            },

            hasResponseForQuestion: (questionIndex: number) => {
                const { responses } = get()
                return responses.some((r) => r.questionIndex === questionIndex)
            },

            getResponseForQuestion: (questionIndex: number) => {
                const { responses } = get()
                return responses.find((r) => r.questionIndex === questionIndex)
            },

            // File uploads
            setFileUpload: (data: Partial<FileUploadData>) => {
                const { fileUploads } = get()
                set({ fileUploads: { ...fileUploads, ...data } })
            },

            // Notes
            setNotes: (text: string) => {
                set({ notes: text })
            },

            // Suspicious activity
            flagAsSuspicious: (reason: string) => {
                const { suspiciousReasons } = get()
                if (!suspiciousReasons.includes(reason)) {
                    set({
                        isSuspicious: true,
                        suspiciousReasons: [...suspiciousReasons, reason],
                    })
                }
            },

            // Navigation
            setCurrentQuestionIndex: (index: number) => {
                set({ currentQuestionIndex: index })
            },

            setWizardStep: (step: ApplicationState["wizardStep"]) => {
                set({ wizardStep: step })
            },

            goToNextQuestion: () => {
                const { currentQuestionIndex } = get()
                set({ currentQuestionIndex: currentQuestionIndex + 1 })
            },

            goToPreviousQuestion: () => {
                const { currentQuestionIndex } = get()
                if (currentQuestionIndex > 0) {
                    set({ currentQuestionIndex: currentQuestionIndex - 1 })
                }
            },

            // Submission
            markAsSubmitted: () => {
                set({
                    isSubmitted: true,
                    submittedAt: new Date().toISOString(),
                    wizardStep: "complete",
                })
            },

            // Reset
            resetSession: () => {
                set(initialState)
            },

            // Get full state for submission
            getSubmissionPayload: (): ApplicationSubmissionPayload => {
                const state = get()
                
                if (!state.jobId || !state.personalData) {
                    throw new Error("Cannot create submission payload: missing required data")
                }

                return {
                    jobId: state.jobId,
                    personalData: state.personalData,
                    responses: state.responses,
                    fileUploads: state.fileUploads,
                    notes: state.notes,
                    metadata: {
                        startedAt: state.startedAt || new Date().toISOString(),
                        completedAt: new Date().toISOString(),
                        isSuspicious: state.isSuspicious,
                        suspiciousReasons: state.suspiciousReasons,
                        ipAddress: state.ipAddress,
                        userAgent: state.userAgent,
                    },
                }
            },
        }),
        {
            name: "application-session",
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage to clear on tab close
            partialize: (state) => ({
                // Only persist these fields
                jobId: state.jobId,
                jobTitle: state.jobTitle,
                personalData: state.personalData,
                responses: state.responses,
                fileUploads: state.fileUploads,
                notes: state.notes,
                startedAt: state.startedAt,
                isSuspicious: state.isSuspicious,
                suspiciousReasons: state.suspiciousReasons,
                currentQuestionIndex: state.currentQuestionIndex,
                wizardStep: state.wizardStep,
                isSubmitted: state.isSubmitted,
                submittedAt: state.submittedAt,
            }),
        }
    )
)

