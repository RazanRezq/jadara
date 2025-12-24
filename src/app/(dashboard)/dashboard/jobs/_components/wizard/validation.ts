import { z } from 'zod'

/**
 * Factory function to create localized validation schemas
 * This allows Zod error messages to respect the current locale
 */
export function createLocalizedJobWizardSchema(t: (key: string) => string) {
    // Skill schema (enhanced for AI extraction)
    const skillSchema = z.object({
        name: z.string().min(1, t('jobWizard.validation.skillNameRequired')),
        importance: z.enum(['required', 'preferred']),
        type: z.enum(['technical', 'soft']).optional(),
        reason: z.enum(['explicit', 'inferred']).optional(),
    })

    // Screening Question schema
    const screeningQuestionSchema = z.object({
        question: z.string().min(1, t('jobWizard.validation.questionRequired')),
        idealAnswer: z.boolean(),
        disqualify: z.boolean(),
    })

    // Language schema
    const languageSchema = z.object({
        language: z.string().min(1, t('jobWizard.validation.languageRequired')),
        level: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
    })

    // Question schema
    const questionSchema = z.object({
        text: z.string().min(1, t('jobWizard.validation.questionTextRequired')),
        type: z.enum(['text', 'voice']),
        weight: z.number().min(1).max(10),
        timeLimit: z.enum(['30s', '1min', '2min', '3min', '5min']).optional(),
        hideTextUntilRecording: z.boolean().optional(),
    })

    // Candidate data config schema
    const candidateDataConfigSchema = z.object({
        requireCV: z.boolean(),
        requireLinkedIn: z.boolean(),
        requirePortfolio: z.boolean(),
        hideSalaryExpectation: z.boolean(),
        hidePersonalInfo: z.boolean(),
    })

    // Retake policy schema
    const retakePolicySchema = z.object({
        allowRetake: z.boolean(),
        maxAttempts: z.number().min(1).max(5),
    })

    // Full job wizard schema
    return z.object({
        // Step 1: Job Basics
        title: z.string().min(3, t('jobWizard.validation.titleMin')),
        department: z.string().optional(),
        employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']),
        location: z.string().optional(),
        salaryMin: z.number().min(0).optional(),
        salaryMax: z.number().min(0).optional(),
        currency: z.enum(['SAR', 'USD', 'AED', 'EGP', 'TRY']),
        description: z.string().min(10, t('jobWizard.validation.descriptionMin')),
        
        // Step 2: Evaluation Criteria
        skills: z.array(skillSchema),
        screeningQuestions: z.array(screeningQuestionSchema),
        languages: z.array(languageSchema),
        minExperience: z.number().min(0).max(20),
        autoRejectThreshold: z.number().min(0).max(100),
        
        // Step 3: Candidate Data
        candidateDataConfig: candidateDataConfigSchema,
        
        // Step 4: Exam Builder
        candidateInstructions: z.string().optional(),
        questions: z.array(questionSchema),
        retakePolicy: retakePolicySchema,
        
        // Metadata
        status: z.enum(['draft', 'active', 'closed', 'archived']),
    })
}



