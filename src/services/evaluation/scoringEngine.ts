/**
 * SmartRecruit AI - Smart Scoring Engine
 * The brain that matches candidates against job criteria
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import {
    CriteriaMatch,
    ScoringResult,
    RecommendationResult,
    BudgetCheckResult,
    CandidateEvaluationInput,
    ParsedResume,
    VoiceAnalysisResult,
    BilingualText,
    BilingualTextArray,
} from './types'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'

interface CandidateData {
    personalData: CandidateEvaluationInput['personalData']
    parsedResume?: ParsedResume['profile']
    voiceAnalysis: Array<{
        questionId: string
        questionText: string
        questionWeight: number
        transcript: string
        analysis?: VoiceAnalysisResult
    }>
    textResponses: Array<{
        questionId: string
        questionText: string
        answer: string
    }>
    urlContent?: string // Formatted content extracted from LinkedIn, GitHub, Portfolio, etc.
}

/**
 * Main scoring function - evaluates candidate against job criteria
 */
export async function scoreCandidate(
    candidateData: CandidateData,
    jobCriteria: CandidateEvaluationInput['jobCriteria']
): Promise<ScoringResult> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            return {
                success: false,
                overallScore: 0,
                criteriaMatches: [],
                strengths: { en: [], ar: [] },
                weaknesses: { en: [], ar: [] },
                redFlags: { en: [], ar: [] },
                summary: { en: '', ar: '' },
                whySection: { en: '', ar: '' },
                error: 'GOOGLE_API_KEY not configured',
            }
        }

        console.log('[Scoring Engine] Evaluating candidate:', candidateData.personalData.name)

        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // Check budget first
        const budgetCheck = checkBudget(
            candidateData.personalData.salaryExpectation,
            jobCriteria.salaryMin,
            jobCriteria.salaryMax
        )

        // Build comprehensive candidate profile for evaluation
        const candidateProfile = buildCandidateProfile(candidateData)
        
        // Build criteria list for evaluation
        const criteriaList = buildCriteriaList(jobCriteria)

        const prompt = `You are an expert HR evaluator for a recruitment platform.

**JOB DETAILS:**
Title: ${jobCriteria.title}
Description: ${jobCriteria.description}
Minimum Experience Required: ${jobCriteria.minExperience} years

**EVALUATION CRITERIA:**
${criteriaList}

**CANDIDATE PROFILE:**
${candidateProfile}

**TASK:**
Analyze the candidate's input. Provide the evaluation report in TWO languages: English (under "en") and Arabic (under "ar"). Ensure the Arabic translation is professional and accurate.

**Return JSON with this EXACT structure (BILINGUAL OUTPUT):**
{
    "criteriaMatches": [
        {
            "criteriaName": "<criterion name>",
            "matched": <true|false>,
            "score": <0-100>,
            "weight": <1-10, importance level>,
            "reason": {
                "en": "<BULLET POINT - max 15 words>",
                "ar": "<BULLET POINT - max 15 words>"
            },
            "evidence": {
                "en": ["<specific fact - max 15 words>"],
                "ar": ["<specific fact - max 15 words>"]
            }
        }
    ],
    "strengths": {
        "en": [
            "<strength bullet - max 15 words>",
            "<strength bullet - max 15 words>"
        ],
        "ar": [
            "<strength bullet - max 15 words>",
            "<strength bullet - max 15 words>"
        ]
    },
    "weaknesses": {
        "en": [
            "<weakness bullet - max 15 words>",
            "<weakness bullet - max 15 words>"
        ],
        "ar": [
            "<weakness bullet - max 15 words>",
            "<weakness bullet - max 15 words>"
        ]
    },
    "redFlags": {
        "en": [
            "<concern bullet - max 15 words>"
        ],
        "ar": [
            "<concern bullet - max 15 words>"
        ]
    },
    "summary": {
        "en": "<ONE bullet point summarizing fit - max 15 words>",
        "ar": "<ONE bullet point summarizing fit - max 15 words>"
    },
    "whySection": {
        "en": "Matched X% because: <1-2 bullet points - max 15 words each>",
        "ar": "نسبة التطابق X% لأن: <1-2 bullet points - max 15 words each>"
    }
}

**SCORING GUIDELINES:**
- 90-100: Exceptional match, exceeds requirements
- 80-89: Strong match, meets all key requirements
- 70-79: Good match, meets most requirements
- 60-69: Acceptable match, meets minimum requirements
- 50-59: Partial match, missing some requirements
- Below 50: Poor match, significant gaps

**CRITICAL FORMATTING RULES:**
- BULLET POINTS ONLY. NO PARAGRAPHS ALLOWED.
- Maximum 15 words per bullet point. No exceptions.
- Be direct and analytical. No filler phrases or conversational language.
- Use concrete facts and numbers. Avoid fluffy descriptors.
- Example GOOD: "5 years React experience matches requirement"
- Example BAD: "The candidate demonstrates a strong understanding of React through their extensive experience"
- **CAREFULLY ANALYZE EXTERNAL PROFILES** (LinkedIn, GitHub, Portfolio, Behance) for:
  - Actual projects and their technical complexity
  - Skills demonstrated through real work (not just listed)
  - GitHub contributions, stars, and code quality indicators
  - Portfolio quality and professional presentation
  - Consistency between resume claims and online presence
- Cross-reference skills claimed in resume with evidence from online profiles
- Ensure Arabic translations are professional, formal, and culturally appropriate
- Each array field must have the same number of items in both languages

Return ONLY valid JSON.`

        const result = await model.generateContent(prompt)
        let responseText = result.response.text().trim()
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const evaluation = JSON.parse(responseText)

        // Add budget red flag if applicable (bilingual)
        if (budgetCheck.redFlag) {
            evaluation.redFlags = evaluation.redFlags || { en: [], ar: [] }
            evaluation.redFlags.en = evaluation.redFlags.en || []
            evaluation.redFlags.ar = evaluation.redFlags.ar || []
            evaluation.redFlags.en.push(budgetCheck.redFlag)
            // Arabic translation of budget red flag
            const arabicBudgetFlag = budgetCheck.redFlag
                .replace('Salary expectation', 'توقعات الراتب')
                .replace('exceeds budget', 'تتجاوز الميزانية')
                .replace('max', 'الحد الأقصى')
                .replace('by', 'بمبلغ')
            evaluation.redFlags.ar.push(arabicBudgetFlag)
        }

        // Calculate weighted overall score
        const criteriaMatches = normalizeCriteriaMatches(evaluation.criteriaMatches || [])
        const overallScore = calculateWeightedScore(criteriaMatches)

        // Normalize bilingual fields
        const strengths: BilingualTextArray = normalizeBilingualTextArray(evaluation.strengths)
        const weaknesses: BilingualTextArray = normalizeBilingualTextArray(evaluation.weaknesses)
        const redFlags: BilingualTextArray = normalizeBilingualTextArray(evaluation.redFlags)
        const summary: BilingualText = normalizeBilingualText(evaluation.summary, '')
        const whySection: BilingualText = normalizeBilingualText(
            evaluation.whySection, 
            `Scored ${overallScore}% based on evaluation criteria.`
        )

        console.log('[Scoring Engine] Evaluation complete:')
        console.log('  - Overall Score:', overallScore)
        console.log('  - Criteria Evaluated:', criteriaMatches.length)
        console.log('  - Strengths (EN):', strengths.en?.length || 0)
        console.log('  - Strengths (AR):', strengths.ar?.length || 0)
        console.log('  - Red Flags (EN):', redFlags.en?.length || 0)

        return {
            success: true,
            overallScore,
            criteriaMatches,
            strengths,
            weaknesses,
            redFlags,
            summary,
            whySection,
        }
    } catch (error) {
        console.error('[Scoring Engine] Error:', error)
        return {
            success: false,
            overallScore: 0,
            criteriaMatches: [],
            strengths: { en: [], ar: [] },
            weaknesses: { en: [], ar: [] },
            redFlags: { en: [], ar: [] },
            summary: { en: '', ar: '' },
            whySection: { en: '', ar: '' },
            error: error instanceof Error ? error.message : 'Unknown scoring error',
        }
    }
}

/**
 * Generate recommendation based on scoring results
 */
export async function generateRecommendation(
    scoringResult: ScoringResult,
    jobCriteria: CandidateEvaluationInput['jobCriteria'],
    candidateName: string
): Promise<RecommendationResult> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            return {
                success: false,
                recommendation: 'pending',
                confidence: 0,
                reason: { en: '', ar: '' },
                suggestedQuestions: { en: [], ar: [] },
                nextBestAction: { en: '', ar: '' },
                error: 'GOOGLE_API_KEY not configured',
            }
        }

        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // Auto-reject if below threshold
        if (scoringResult.overallScore < jobCriteria.autoRejectThreshold) {
            return {
                success: true,
                recommendation: 'reject',
                confidence: 95,
                reason: {
                    en: `Score of ${scoringResult.overallScore}% is below the auto-reject threshold of ${jobCriteria.autoRejectThreshold}%.`,
                    ar: `الدرجة ${scoringResult.overallScore}% أقل من حد الرفض التلقائي ${jobCriteria.autoRejectThreshold}%.`,
                },
                suggestedQuestions: { en: [], ar: [] },
                nextBestAction: {
                    en: 'Send rejection notification',
                    ar: 'إرسال إشعار الرفض',
                },
            }
        }

        const prompt = `Based on this candidate evaluation, provide a hiring recommendation in TWO languages: English and Arabic.

**Candidate:** ${candidateName}
**Overall Score:** ${scoringResult.overallScore}%
**Job:** ${jobCriteria.title}

**Evaluation Summary (English):**
${scoringResult.summary.en}

**Strengths (English):**
${scoringResult.strengths.en.map(s => `- ${s}`).join('\n')}

**Weaknesses (English):**
${scoringResult.weaknesses.en.map(w => `- ${w}`).join('\n')}

**Red Flags (English):**
${scoringResult.redFlags.en.length > 0 ? scoringResult.redFlags.en.map(r => `- ${r}`).join('\n') : '- None identified'}

**Why Section (English):**
${scoringResult.whySection.en}

**TASK:**
Provide a recommendation with BILINGUAL output (English and Arabic):
1. Clear hire/hold/reject decision
2. Confidence level in the decision
3. Concise reasoning in bullet points (bilingual)
4. 3-5 follow-up interview questions to address gaps/concerns (bilingual)
5. Recommended next action (bilingual)

**Return JSON with BILINGUAL structure:**
{
    "recommendation": "<hire|hold|reject>",
    "confidence": <0-100, how confident in this recommendation>,
    "reason": {
        "en": "<1-2 bullet points - max 15 words each>",
        "ar": "<1-2 bullet points - max 15 words each>"
    },
    "suggestedQuestions": {
        "en": [
            "<concise interview question 1>",
            "<concise interview question 2>",
            "<concise interview question 3>"
        ],
        "ar": [
            "<concise interview question 1>",
            "<concise interview question 2>",
            "<concise interview question 3>"
        ]
    },
    "nextBestAction": {
        "en": "<action bullet - max 15 words>",
        "ar": "<action bullet - max 15 words>"
    }
}

**Decision Guidelines:**
- HIRE (Score > 80%, no major red flags): Strong candidate, proceed to next stage
- HOLD (Score 60-80% OR has concerns): Needs more evaluation, has potential
- REJECT (Score < 60% OR critical red flags): Not suitable for the role

**CRITICAL FORMATTING RULES:**
- BULLET POINTS ONLY. NO PARAGRAPHS ALLOWED.
- Maximum 15 words per bullet point. No exceptions.
- Be direct and analytical. No filler phrases or conversational language.
- Use concrete facts and numbers. Avoid fluffy descriptors.
- Ensure Arabic translations are professional, formal, and culturally appropriate
- Each array in suggestedQuestions must have the same number of items in both languages

Return ONLY valid JSON.`

        const result = await model.generateContent(prompt)
        let responseText = result.response.text().trim()
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const recommendation = JSON.parse(responseText)

        console.log('[Scoring Engine] Recommendation:', recommendation.recommendation)
        console.log('[Scoring Engine] Confidence:', recommendation.confidence, '%')

        return {
            success: true,
            recommendation: normalizeRecommendation(recommendation.recommendation),
            confidence: recommendation.confidence || 70,
            reason: normalizeBilingualText(recommendation.reason, ''),
            suggestedQuestions: normalizeBilingualTextArray(recommendation.suggestedQuestions),
            nextBestAction: normalizeBilingualText(recommendation.nextBestAction, 'Review candidate profile'),
        }
    } catch (error) {
        console.error('[Scoring Engine] Recommendation error:', error)
        return {
            success: false,
            recommendation: 'pending',
            confidence: 0,
            reason: { en: '', ar: '' },
            suggestedQuestions: { en: [], ar: [] },
            nextBestAction: { en: '', ar: '' },
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Check if salary expectation is within budget
 */
export function checkBudget(
    salaryExpectation?: number,
    budgetMin?: number,
    budgetMax?: number
): BudgetCheckResult {
    if (!salaryExpectation) {
        return { withinBudget: true }
    }

    if (!budgetMax) {
        return {
            withinBudget: true,
            salaryExpectation,
        }
    }

    const withinBudget = salaryExpectation <= budgetMax
    const difference = salaryExpectation - budgetMax

    return {
        withinBudget,
        salaryExpectation,
        budgetMin,
        budgetMax,
        difference: withinBudget ? undefined : difference,
        redFlag: !withinBudget
            ? `Salary expectation (${salaryExpectation.toLocaleString()}) exceeds budget (max ${budgetMax.toLocaleString()}) by ${difference.toLocaleString()}`
            : undefined,
    }
}

/**
 * Calculate total years of experience from work history
 */
export function calculateTotalExperience(experience: Array<{ startDate?: string; endDate?: string; isCurrent?: boolean }>): number {
    let totalMonths = 0

    for (const job of experience) {
        if (!job.startDate) continue

        const start = parseDate(job.startDate)
        const end = job.isCurrent || !job.endDate ? new Date() : parseDate(job.endDate)

        if (start && end) {
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
            totalMonths += Math.max(0, months)
        }
    }

    return Math.round(totalMonths / 12 * 10) / 10 // Round to 1 decimal
}

/**
 * Match skills between candidate and job requirements
 */
export function matchSkills(
    candidateSkills: Array<{ name: string; category?: string }>,
    requiredSkills: Array<{ name: string; importance: 'required' | 'preferred' }>
): { matched: string[]; missing: string[]; extra: string[]; matchPercentage: number } {
    const candidateSkillNames = new Set(candidateSkills.map(s => s.name.toLowerCase()))
    const matched: string[] = []
    const missing: string[] = []

    for (const skill of requiredSkills) {
        const found = candidateSkillNames.has(skill.name.toLowerCase()) ||
            Array.from(candidateSkillNames).some(cs => 
                cs.includes(skill.name.toLowerCase()) || 
                skill.name.toLowerCase().includes(cs)
            )

        if (found) {
            matched.push(skill.name)
        } else if (skill.importance === 'required') {
            missing.push(skill.name)
        }
    }

    const requiredSkillNames = new Set(requiredSkills.map(s => s.name.toLowerCase()))
    const extra = candidateSkills
        .filter(s => !requiredSkillNames.has(s.name.toLowerCase()))
        .map(s => s.name)

    const requiredCount = requiredSkills.filter(s => s.importance === 'required').length
    const matchPercentage = requiredCount > 0 
        ? Math.round((matched.filter(m => 
            requiredSkills.find(r => r.name.toLowerCase() === m.toLowerCase())?.importance === 'required'
        ).length / requiredCount) * 100)
        : 100

    return { matched, missing, extra, matchPercentage }
}

// Helper functions
function buildCandidateProfile(candidateData: CandidateData): string {
    const { personalData, parsedResume, voiceAnalysis, textResponses, urlContent } = candidateData
    
    let profile = `
## Basic Information
- Name: ${personalData.name}
- Email: ${personalData.email}
- Phone: ${personalData.phone}
- Age: ${personalData.age || 'Not provided'}
- Years of Experience (Self-reported): ${personalData.yearsOfExperience || 'Not provided'}
${personalData.linkedinUrl ? `- LinkedIn: ${personalData.linkedinUrl}` : ''}
${personalData.behanceUrl ? `- Behance: ${personalData.behanceUrl}` : ''}
${personalData.portfolioUrl ? `- Portfolio: ${personalData.portfolioUrl}` : ''}
`

    if (parsedResume) {
        profile += `
## Resume/CV Summary
${parsedResume.summary || 'No summary available'}

### Skills (${parsedResume.skills.length} total)
${parsedResume.skills.map(s => `- ${s.name} (${s.category}, ${s.proficiency})`).join('\n')}

### Work Experience (${parsedResume.experience.length} positions)
${parsedResume.experience.map(e => `
- **${e.title}** at ${e.company}
  Duration: ${e.duration || 'Unknown'}
  ${e.responsibilities.length > 0 ? `Responsibilities: ${e.responsibilities.slice(0, 3).join('; ')}` : ''}
`).join('')}

### Education
${parsedResume.education.map(e => `- ${e.degree} in ${e.field || 'N/A'} from ${e.institution} (${e.graduationYear || 'N/A'})`).join('\n')}

### Languages
${parsedResume.languages.map(l => `- ${l.language}: ${l.proficiency}`).join('\n')}

### Certifications
${parsedResume.certifications.length > 0 ? parsedResume.certifications.join(', ') : 'None listed'}
`
    }

    if (voiceAnalysis.length > 0) {
        profile += `
## Voice Interview Responses
${voiceAnalysis.map(v => `
### Question (Weight: ${v.questionWeight}/10): ${v.questionText}
**Response:** ${v.transcript}
${v.analysis?.sentiment ? `**Sentiment:** ${v.analysis.sentiment.label} (${v.analysis.sentiment.score.toFixed(2)})` : ''}
${v.analysis?.confidence ? `**Confidence Score:** ${v.analysis.confidence.score}%` : ''}
${v.analysis?.keyPhrases?.length ? `**Key Phrases:** ${v.analysis.keyPhrases.join(', ')}` : ''}
`).join('')}
`
    }

    if (textResponses.length > 0) {
        profile += `
## Written Responses
${textResponses.map(t => `
### Question: ${t.questionText}
**Answer:** ${t.answer}
`).join('')}
`
    }

    // Add extracted URL content (LinkedIn, GitHub, Portfolio, Behance)
    if (urlContent) {
        profile += `
${urlContent}
`
    }

    return profile
}

function buildCriteriaList(jobCriteria: CandidateEvaluationInput['jobCriteria']): string {
    let criteria = `
### Required Skills (Weight: 10)
${jobCriteria.skills.filter(s => s.importance === 'required').map(s => `- ${s.name} (${s.type || 'general'})`).join('\n') || '- None specified'}

### Preferred Skills (Weight: 5)
${jobCriteria.skills.filter(s => s.importance === 'preferred').map(s => `- ${s.name} (${s.type || 'general'})`).join('\n') || '- None specified'}

### Experience Requirement
- Minimum ${jobCriteria.minExperience} years of experience

### Language Requirements
${jobCriteria.languages.map(l => `- ${l.language}: ${l.level} level`).join('\n') || '- None specified'}

### Custom Criteria
${jobCriteria.criteria.map(c => `
- **${c.name}** (Weight: ${c.weight}/10, ${c.required ? 'REQUIRED' : 'Preferred'})
  ${c.description}
`).join('') || '- None specified'}
`
    return criteria
}

/**
 * Normalize bilingual text, handling both object and string formats
 */
function normalizeBilingualText(value: unknown, defaultValue: string = ''): BilingualText {
    if (!value) {
        return { en: defaultValue, ar: defaultValue }
    }
    
    if (typeof value === 'string') {
        // Legacy single string format - use same value for both languages
        return { en: value, ar: value }
    }
    
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>
        return {
            en: typeof obj.en === 'string' ? obj.en : defaultValue,
            ar: typeof obj.ar === 'string' ? obj.ar : defaultValue,
        }
    }
    
    return { en: defaultValue, ar: defaultValue }
}

/**
 * Normalize bilingual text array, handling both object and array formats
 */
function normalizeBilingualTextArray(value: unknown): BilingualTextArray {
    if (!value) {
        return { en: [], ar: [] }
    }
    
    if (Array.isArray(value)) {
        // Legacy array format - use same values for both languages
        return {
            en: value.map(String),
            ar: value.map(String),
        }
    }
    
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>
        return {
            en: Array.isArray(obj.en) ? obj.en.map(String) : [],
            ar: Array.isArray(obj.ar) ? obj.ar.map(String) : [],
        }
    }
    
    return { en: [], ar: [] }
}

function normalizeCriteriaMatches(matches: unknown[]): CriteriaMatch[] {
    return matches.map((m: unknown) => {
        const match = m as Record<string, unknown>
        return {
            criteriaName: String(match.criteriaName || ''),
            matched: Boolean(match.matched),
            score: Math.max(0, Math.min(100, Number(match.score) || 0)),
            weight: Math.max(1, Math.min(10, Number(match.weight) || 5)),
            reason: normalizeBilingualText(match.reason, ''),
            evidence: normalizeBilingualTextArray(match.evidence),
        }
    }).filter(m => m.criteriaName)
}

function calculateWeightedScore(criteriaMatches: CriteriaMatch[]): number {
    if (criteriaMatches.length === 0) return 0

    const totalWeight = criteriaMatches.reduce((sum, m) => sum + m.weight, 0)
    const weightedSum = criteriaMatches.reduce((sum, m) => sum + (m.score * m.weight), 0)

    return Math.round(weightedSum / totalWeight)
}

function normalizeRecommendation(rec: string): 'hire' | 'hold' | 'reject' | 'pending' {
    const normalized = rec?.toLowerCase()
    if (normalized === 'hire') return 'hire'
    if (normalized === 'hold') return 'hold'
    if (normalized === 'reject') return 'reject'
    return 'pending'
}

function parseDate(dateStr: string): Date | null {
    try {
        // Handle various formats: YYYY-MM, YYYY, MM/YYYY
        if (/^\d{4}$/.test(dateStr)) {
            return new Date(parseInt(dateStr), 0, 1)
        }
        if (/^\d{4}-\d{2}$/.test(dateStr)) {
            const [year, month] = dateStr.split('-').map(Number)
            return new Date(year, month - 1, 1)
        }
        return new Date(dateStr)
    } catch {
        return null
    }
}

export default {
    scoreCandidate,
    generateRecommendation,
    checkBudget,
    calculateTotalExperience,
    matchSkills,
}

