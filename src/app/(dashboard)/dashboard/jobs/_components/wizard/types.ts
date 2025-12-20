import { z } from 'zod'

// Skill schema (enhanced for AI extraction)
export const skillSchema = z.object({
    name: z.string().min(1, 'Skill name is required'),
    importance: z.enum(['required', 'preferred']),
    type: z.enum(['technical', 'soft']).optional(),
    reason: z.enum(['explicit', 'inferred']).optional(),
})

// Screening Question schema
export const screeningQuestionSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    disqualify: z.boolean(),
})

// Language schema
export const languageSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
})

// Question schema
export const questionSchema = z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['text', 'voice']),
    weight: z.number().min(1).max(10),
    timeLimit: z.enum(['30s', '1min', '2min', '3min', '5min']).optional(),
    hideTextUntilRecording: z.boolean().optional(),
})

// Candidate data config schema
export const candidateDataConfigSchema = z.object({
    requireCV: z.boolean(),
    requireLinkedIn: z.boolean(),
    requirePortfolio: z.boolean(),
    hideSalaryExpectation: z.boolean(),
    hidePersonalInfo: z.boolean(),
})

// Retake policy schema
export const retakePolicySchema = z.object({
    allowRetake: z.boolean(),
    maxAttempts: z.number().min(1).max(5),
})

// Full job wizard schema
export const jobWizardSchema = z.object({
    // Step 1: Job Basics
    title: z.string().min(3, 'Title must be at least 3 characters'),
    department: z.string().optional(),
    employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']),
    location: z.string().optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    currency: z.enum(['SAR', 'USD', 'AED', 'EGP', 'TRY']),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    
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

export type JobWizardFormValues = z.infer<typeof jobWizardSchema>
export type Skill = z.infer<typeof skillSchema>
export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>
export type Language = z.infer<typeof languageSchema>
export type Question = z.infer<typeof questionSchema>
export type CandidateDataConfig = z.infer<typeof candidateDataConfigSchema>
export type RetakePolicy = z.infer<typeof retakePolicySchema>

export const defaultJobWizardValues: JobWizardFormValues = {
    // Step 1
    title: '',
    department: '',
    employmentType: 'remote',
    location: '',
    salaryMin: undefined,
    salaryMax: undefined,
    currency: 'SAR',
    description: '',
    
    // Step 2
    skills: [],
    screeningQuestions: [],
    languages: [],
    minExperience: 0,
    autoRejectThreshold: 35,
    
    // Step 3
    candidateDataConfig: {
        requireCV: true,
        requireLinkedIn: false,
        requirePortfolio: false,
        hideSalaryExpectation: false,
        hidePersonalInfo: false,
    },
    
    // Step 4
    candidateInstructions: '',
    questions: [],
    retakePolicy: {
        allowRetake: false,
        maxAttempts: 1,
    },
    
    // Metadata
    status: 'draft',
}

export const SKILL_SUGGESTIONS = [
    'React',
    'Node.js',
    'JavaScript',
    'TypeScript',
    'CSS',
    'HTML',
    'Python',
    'Java',
    'Go',
    'Rust',
    'SQL',
    'MongoDB',
    'AWS',
    'Docker',
    'Kubernetes',
]

export const TIME_LIMIT_OPTIONS = [
    { value: '30s', label: '30 ثانية', labelEn: '30 seconds' },
    { value: '1min', label: 'دقيقة واحدة', labelEn: '1 minute' },
    { value: '2min', label: 'دقيقتان', labelEn: '2 minutes' },
    { value: '3min', label: '3 دقائق', labelEn: '3 minutes' },
    { value: '5min', label: '5 دقائق', labelEn: '5 minutes' },
] as const

export const CURRENCY_OPTIONS = [
    { value: 'SAR', label: 'ريال سعودي', labelEn: 'Saudi Riyal' },
    { value: 'USD', label: 'دولار أمريكي', labelEn: 'US Dollar' },
    { value: 'AED', label: 'درهم إماراتي', labelEn: 'UAE Dirham' },
    { value: 'EGP', label: 'جنيه مصري', labelEn: 'Egyptian Pound' },
] as const

export const DEPARTMENT_OPTIONS = [
    { value: 'sales', label: 'المبيعات', labelEn: 'Sales' },
    { value: 'marketing', label: 'التسويق', labelEn: 'Marketing' },
    { value: 'engineering', label: 'الهندسة', labelEn: 'Engineering' },
    { value: 'hr', label: 'الموارد البشرية', labelEn: 'Human Resources' },
    { value: 'finance', label: 'المالية', labelEn: 'Finance' },
    { value: 'operations', label: 'العمليات', labelEn: 'Operations' },
    { value: 'design', label: 'التصميم', labelEn: 'Design' },
    { value: 'product', label: 'المنتجات', labelEn: 'Product' },
] as const

export const PROFICIENCY_LEVELS = [
    { value: 'beginner', label: 'مبتدئ', labelEn: 'Beginner' },
    { value: 'intermediate', label: 'متوسط', labelEn: 'Intermediate' },
    { value: 'advanced', label: 'متقدم', labelEn: 'Advanced' },
    { value: 'native', label: 'لغة أم', labelEn: 'Native' },
] as const

import { LANGUAGE_TRANSLATIONS } from '@/lib/language-translations'

export const COMMON_LANGUAGES = [
    'English',
    'Arabic',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Turkish',
    'Russian',
    'Portuguese',
] as const

export { LANGUAGE_TRANSLATIONS }



