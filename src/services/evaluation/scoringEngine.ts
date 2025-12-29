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
        questionWeight: number
        answer: string
    }>
    urlContent?: string // Formatted content extracted from LinkedIn, GitHub, Portfolio, etc.
    additionalNotes?: string // Candidate's freeform notes
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
        const candidateProfile = buildCandidateProfile(candidateData, jobCriteria)
        
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

**CRITICAL EVALUATION RULES:**

*** SCREENING QUESTION EVALUATION LOGIC ***
1. **MATCH vs MISMATCH Logic:**
   - Each screening question has an "Ideal Answer" (YES or NO).
   - Compare: Candidate Answer vs. Ideal Answer.
   - IF MATCH (✅): Candidate answered correctly → No issue.
   - IF MISMATCH (❌): Candidate's answer differs from requirement.

2. **KNOCKOUT QUESTION HANDLING:**
   - IF MISMATCH (❌) AND [KNOCKOUT QUESTION] is TRUE:
     a) DO NOT REJECT IMMEDIATELY.
     b) CHECK "Additional Notes" section for keywords/justifications related to this question.
     c) IF VALID JUSTIFICATION FOUND (e.g., "I can start in 1 week", "I have family obligations but flexible"):
        → DECISION: HOLD/REVIEW (Yellow Flag) - Mention: "Candidate provided justification: [quote]"
     d) IF NO JUSTIFICATION OR INSUFFICIENT:
        → Suggestion: REJECT (Red Flag) - Add to redFlags: "Failed knockout question: [question text]"

3. **Example Scenarios:**
   - Q: "Do you have a criminal record?" (Ideal: NO, Knockout: YES)
     * Candidate: NO → ✅ MATCH → Proceed
     * Candidate: YES + Notes: "Minor traffic violation 10 years ago, record cleared" → ⚠️ HOLD (check notes)
     * Candidate: YES + No Notes → 🚫 REJECT (add to redFlags)
   
   - Q: "Can you start immediately?" (Ideal: YES, Knockout: YES)
     * Candidate: YES → ✅ MATCH → Proceed
     * Candidate: NO + Notes: "I can start in 2 weeks after giving notice" → ⚠️ HOLD (reasonable)
     * Candidate: NO + No Notes → 🚫 REJECT

4. 🌐 **LANGUAGE REQUIREMENTS:** Compare candidate's language proficiency against required levels. Flag any gaps in redFlags.
5. 💰 **SALARY ALIGNMENT:** If salary expectation is far outside budget range, note in weaknesses.
6. 📝 **ADDITIONAL NOTES:** ALWAYS check this section for context about ANY mismatch.
7. 📊 **EXPERIENCE GAP:** Compare years of experience against minimum required.

**Language Support:**
- Provide all output in BOTH English (en) and Arabic (ar).
- Use RTL-appropriate formatting for Arabic text.
- Professional tone in both languages.

**TASK:**
Analyze the candidate comprehensively against ALL criteria, including screening questions, language requirements, and experience. Provide the evaluation report in TWO languages: English (under "en") and Arabic (under "ar"). Ensure the Arabic translation is professional and accurate.

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

**JSON FORMATTING RULES (CRITICAL):**
- Return ONLY valid JSON - no comments, no trailing commas, no extra text
- All strings must use double quotes ("), never single quotes (')
- Arrays must have commas between elements: ["item1", "item2", "item3"]
- NO trailing commas: ["item1", "item2"] NOT ["item1", "item2",]
- Ensure all brackets are properly closed: { }, [ ]
- Test your JSON before returning it

Return ONLY valid JSON. No explanations, no markdown, just pure JSON.`

        const result = await model.generateContent(prompt)
        let responseText = result.response.text().trim()
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // Try to parse JSON, with error recovery
        let evaluation
        try {
            evaluation = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[Scoring Engine] JSON Parse Error:', parseError)
            console.error('[Scoring Engine] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            console.error('[Scoring Engine] Problematic JSON (around error):', responseText.substring(2200, 2400))
            
            // Try to fix common JSON issues
            let fixedText = responseText
                // Fix trailing commas in arrays
                .replace(/,(\s*[}\]])/g, '$1')
                // Fix missing commas between array elements
                .replace(/"\s*\n\s*"/g, '",\n"')
                // Fix single quotes to double quotes
                .replace(/'/g, '"')
            
            try {
                evaluation = JSON.parse(fixedText)
                console.log('[Scoring Engine] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[Scoring Engine] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

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

        // Build AI Analysis Breakdown for transparency
        console.log('[Scoring Engine] Building AI Analysis Breakdown...')
        const aiAnalysisBreakdown = buildAIAnalysisBreakdown(candidateData, jobCriteria, {
            success: true,
            overallScore,
            criteriaMatches,
            strengths,
            weaknesses,
            redFlags,
            summary,
            whySection,
        })
        console.log('[Scoring Engine] AI Analysis Breakdown complete')

        return {
            success: true,
            overallScore,
            criteriaMatches,
            strengths,
            weaknesses,
            redFlags,
            summary,
            whySection,
            aiAnalysisBreakdown,
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
        
        // Clean JSON response - remove markdown code blocks
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // Extract JSON object/array if there's extra text
        const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
        if (jsonMatch) {
            responseText = jsonMatch[0]
        }
        
        // Try to parse JSON, with error recovery
        let recommendation
        try {
            recommendation = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[Recommendation Engine] JSON Parse Error:', parseError)
            console.error('[Recommendation Engine] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            
            // Try to fix common JSON issues
            let fixedText = responseText
                // Fix trailing commas in arrays/objects
                .replace(/,(\s*[}\]])/g, '$1')
                // Fix missing commas between array elements
                .replace(/"\s*\n\s*"/g, '",\n"')
                // Fix single quotes to double quotes (but be careful with apostrophes in text)
                .replace(/([{,]\s*)'/g, '$1"')
                .replace(/'\s*([,}])/g, '"$1')
                // Remove any text after the closing bracket
                .replace(/([}\]])[\s\S]*$/, '$1')
            
            try {
                recommendation = JSON.parse(fixedText)
                console.log('[Recommendation Engine] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[Recommendation Engine] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

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
/**
 * Compare candidate's language level against required level
 */
function compareLevels(candidateLevel?: string, requiredLevel?: string): string {
    const levels = ['beginner', 'intermediate', 'advanced', 'native']
    const candIdx = levels.indexOf(candidateLevel?.toLowerCase() || '')
    const reqIdx = levels.indexOf(requiredLevel?.toLowerCase() || '')
    
    if (candIdx === -1) return '❌ [NOT PROVIDED]'
    if (reqIdx === -1) return '❓'
    if (candIdx >= reqIdx) return '✅ [MEETS REQUIREMENT]'
    const gap = reqIdx - candIdx
    return `❌ [GAP: ${gap} level${gap > 1 ? 's' : ''} below]`
}

function buildCandidateProfile(candidateData: CandidateData, jobCriteria: CandidateEvaluationInput['jobCriteria']): string {
    const { personalData, parsedResume, voiceAnalysis, textResponses, urlContent } = candidateData
    
    let profile = `
## Basic Information
- Name: ${personalData.name}
- Email: ${personalData.email}
- Phone: ${personalData.phone}
- Age: ${personalData.age || 'Not provided'}
- Years of Experience (Self-reported): ${personalData.yearsOfExperience || 'Not provided'} ${jobCriteria.minExperience ? `[Required: ${jobCriteria.minExperience}+ years]` : ''}
- Salary Expectation: ${personalData.salaryExpectation ? `${personalData.salaryExpectation}` : 'Not provided'} ${jobCriteria.salaryMin && jobCriteria.salaryMax ? `[Budget: ${jobCriteria.salaryMin}-${jobCriteria.salaryMax}]` : ''}
${personalData.linkedinUrl ? `- LinkedIn: ${personalData.linkedinUrl}` : ''}
${personalData.behanceUrl ? `- Behance: ${personalData.behanceUrl}` : ''}
${personalData.portfolioUrl ? `- Portfolio: ${personalData.portfolioUrl}` : ''}
`

    // ADD SCREENING QUESTIONS SECTION (CRITICAL FOR HR)
    if (personalData.screeningAnswers && jobCriteria.screeningQuestions && jobCriteria.screeningQuestions.length > 0) {
        profile += `
## 🚨 SCREENING QUESTIONS (HR-CRITICAL)
`
        for (const sq of jobCriteria.screeningQuestions) {
            const candidateAnswer = personalData.screeningAnswers[sq.question]
            const idealAnswer = sq.idealAnswer
            const isMatch = candidateAnswer === idealAnswer
            
            const candidateAnswerText = candidateAnswer === true ? '✅ YES' : candidateAnswer === false ? '❌ NO' : '⚠️ Not answered'
            const idealAnswerText = idealAnswer ? 'YES' : 'NO'
            const matchStatus = isMatch ? '✅ MATCH' : '❌ MISMATCH'
            const knockoutWarning = sq.disqualify ? ' **[KNOCKOUT QUESTION]**' : ''
            
            profile += `- **Q:** ${sq.question}
  **Ideal Answer:** ${idealAnswerText}
  **Candidate Answer:** ${candidateAnswerText}
  **Status:** ${matchStatus}${knockoutWarning}\n`
        }
    }

    // ADD LANGUAGE PROFICIENCY COMPARISON
    if (jobCriteria.languages && jobCriteria.languages.length > 0) {
        profile += `
## 🌐 LANGUAGE REQUIREMENTS
`
        for (const reqLang of jobCriteria.languages) {
            const candidateLevel = personalData.languageProficiency?.[reqLang.language]
            const levelComparison = compareLevels(candidateLevel, reqLang.level)
            profile += `- **${reqLang.language}:** Required=${reqLang.level.toUpperCase()}, Candidate=${candidateLevel?.toUpperCase() || 'NOT PROVIDED'} ${levelComparison}\n`
        }
    }

    // ADD ADDITIONAL NOTES FROM CANDIDATE
    if (candidateData.additionalNotes) {
        profile += `
## 📝 CANDIDATE'S ADDITIONAL NOTES
${candidateData.additionalNotes}
`
    }

    profile += `
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
### Question (Weight: ${t.questionWeight}/10): ${t.questionText}
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

/**
 * Build AI Analysis Breakdown for transparency
 * Shows WHAT the AI analyzed and WHY it made decisions
 */
export function buildAIAnalysisBreakdown(
    candidateData: CandidateData,
    jobCriteria: CandidateEvaluationInput['jobCriteria'],
    scoringResult: ScoringResult
): import('./types').AIAnalysisBreakdown {
    const breakdown: import('./types').AIAnalysisBreakdown = {}

    // 1. Screening Questions Analysis
    if (candidateData.personalData.screeningAnswers && jobCriteria.screeningQuestions && jobCriteria.screeningQuestions.length > 0) {
        const failedKnockouts: Array<{ question: string; answer: boolean; impact: string }> = []
        const passedQuestions: string[] = []
        const mismatches: string[] = []

        for (const sq of jobCriteria.screeningQuestions) {
            const candidateAnswer = candidateData.personalData.screeningAnswers[sq.question]
            const idealAnswer = sq.idealAnswer
            const isMatch = candidateAnswer === idealAnswer
            
            if (isMatch) {
                passedQuestions.push(sq.question)
            } else {
                // Mismatch detected
                if (sq.disqualify) {
                    // Check additional notes for justification
                    const hasJustification = candidateData.additionalNotes && 
                        candidateData.additionalNotes.length > 20 // At least some meaningful text
                    
                    failedKnockouts.push({
                        question: sq.question,
                        answer: candidateAnswer ?? false,
                        impact: hasJustification 
                            ? 'Critical - But candidate provided justification (review required)' 
                            : 'Critical - Auto-reject trigger (no justification)'
                    })
                } else {
                    mismatches.push(sq.question)
                }
            }
        }

        breakdown.screeningQuestionsAnalysis = {
            totalQuestions: jobCriteria.screeningQuestions.length,
            knockoutQuestions: jobCriteria.screeningQuestions.filter(sq => sq.disqualify).length,
            failedKnockouts,
            passedQuestions,
            aiReasoning: {
                en: failedKnockouts.length > 0
                    ? `Candidate failed ${failedKnockouts.length} critical screening question(s). ${failedKnockouts.some(f => f.impact.includes('justification')) ? 'Some have justifications that need review.' : 'No justifications provided - recommend rejection.'}`
                    : mismatches.length > 0
                    ? `Candidate answered ${mismatches.length} non-critical question(s) differently than ideal. Review recommended.`
                    : `Candidate passed all ${jobCriteria.screeningQuestions.length} screening questions successfully.`,
                ar: failedKnockouts.length > 0
                    ? `فشل المرشح في ${failedKnockouts.length} سؤال فحص حرج. ${failedKnockouts.some(f => f.impact.includes('justification')) ? 'البعض لديه مبررات تحتاج إلى مراجعة.' : 'لا توجد مبررات - يوصى بالرفض.'}`
                    : mismatches.length > 0
                    ? `أجاب المرشح على ${mismatches.length} سؤال غير حرج بشكل مختلف عن المثالي. يوصى بالمراجعة.`
                    : `اجتاز المرشح جميع أسئلة الفحص الـ ${jobCriteria.screeningQuestions.length} بنجاح.`
            }
        }
    }

    // 2. Voice Responses Analysis
    if (candidateData.voiceAnalysis && candidateData.voiceAnalysis.length > 0) {
        const totalWeight = candidateData.voiceAnalysis.reduce((sum, v) => sum + v.questionWeight, 0)
        const responses = candidateData.voiceAnalysis.map(v => ({
            questionText: v.questionText,
            weight: v.questionWeight,
            transcriptLength: v.transcript.length,
            sentiment: v.analysis?.sentiment?.label || 'neutral',
            confidence: v.analysis?.confidence?.score || 0,
            aiReasoning: {
                en: v.analysis?.sentiment?.label === 'positive'
                    ? `Strong response with ${v.analysis?.confidence?.score || 0}% confidence. Shows clarity and conviction.`
                    : v.analysis?.sentiment?.label === 'negative'
                    ? `Hesitant response with concerns. Confidence ${v.analysis?.confidence?.score || 0}%.`
                    : `Neutral response. Adequate but unremarkable. Confidence ${v.analysis?.confidence?.score || 0}%.`,
                ar: v.analysis?.sentiment?.label === 'positive'
                    ? `إجابة قوية بثقة ${v.analysis?.confidence?.score || 0}٪. تظهر وضوحاً وقناعة.`
                    : v.analysis?.sentiment?.label === 'negative'
                    ? `إجابة مترددة مع مخاوف. الثقة ${v.analysis?.confidence?.score || 0}٪.`
                    : `إجابة محايدة. كافية لكن غير ملحوظة. الثقة ${v.analysis?.confidence?.score || 0}٪.`
            }
        }))

        const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length

        breakdown.voiceResponsesAnalysis = {
            totalResponses: candidateData.voiceAnalysis.length,
            totalWeight,
            responses,
            overallImpact: {
                en: avgConfidence >= 80
                    ? `Voice responses demonstrate strong confidence (${Math.round(avgConfidence)}% avg). Candidate communicates effectively.`
                    : avgConfidence >= 60
                    ? `Voice responses show moderate confidence (${Math.round(avgConfidence)}% avg). Acceptable communication skills.`
                    : `Voice responses lack confidence (${Math.round(avgConfidence)}% avg). May need improvement in communication.`,
                ar: avgConfidence >= 80
                    ? `تُظهر الردود الصوتية ثقة قوية (${Math.round(avgConfidence)}٪ متوسط). المرشح يتواصل بفعالية.`
                    : avgConfidence >= 60
                    ? `تُظهر الردود الصوتية ثقة متوسطة (${Math.round(avgConfidence)}٪ متوسط). مهارات تواصل مقبولة.`
                    : `تفتقر الردود الصوتية إلى الثقة (${Math.round(avgConfidence)}٪ متوسط). قد تحتاج إلى تحسين في التواصل.`
            }
        }
    }

    // 3. Text Responses Analysis
    if (candidateData.textResponses && candidateData.textResponses.length > 0) {
        const totalWeight = candidateData.textResponses.reduce((sum, t) => sum + t.questionWeight, 0)
        const responses = candidateData.textResponses.map(t => {
            const wordCount = t.answer.split(/\s+/).length
            let quality: string = 'average'
            if (wordCount < 20) quality = 'poor'
            else if (wordCount < 50) quality = 'average'
            else if (wordCount < 100) quality = 'good'
            else quality = 'excellent'

            return {
                questionText: t.questionText,
                weight: t.questionWeight,
                wordCount,
                quality,
                aiReasoning: {
                    en: wordCount >= 100
                        ? `Comprehensive answer (${wordCount} words). Shows depth of thought and thoroughness.`
                        : wordCount >= 50
                        ? `Good answer (${wordCount} words). Adequate detail and clarity.`
                        : wordCount >= 20
                        ? `Brief answer (${wordCount} words). Addresses question but lacks detail.`
                        : `Very short answer (${wordCount} words). Insufficient detail provided.`,
                    ar: wordCount >= 100
                        ? `إجابة شاملة (${wordCount} كلمة). تُظهر عمق التفكير والشمولية.`
                        : wordCount >= 50
                        ? `إجابة جيدة (${wordCount} كلمة). تفاصيل ووضوح كافيان.`
                        : wordCount >= 20
                        ? `إجابة موجزة (${wordCount} كلمة). تتناول السؤال لكن تفتقر إلى التفاصيل.`
                        : `إجابة قصيرة جداً (${wordCount} كلمة). تفاصيل غير كافية.`
                }
            }
        })

        const avgWordCount = Math.round(responses.reduce((sum, r) => sum + r.wordCount, 0) / responses.length)

        breakdown.textResponsesAnalysis = {
            totalResponses: candidateData.textResponses.length,
            totalWeight,
            responses,
            overallImpact: {
                en: avgWordCount >= 75
                    ? `Written responses are detailed (${avgWordCount} words avg). Candidate provides thorough explanations.`
                    : avgWordCount >= 35
                    ? `Written responses are adequate (${avgWordCount} words avg). Sufficient but could be more detailed.`
                    : `Written responses are brief (${avgWordCount} words avg). Lacks sufficient detail in answers.`,
                ar: avgWordCount >= 75
                    ? `الردود المكتوبة مفصلة (${avgWordCount} كلمة متوسط). المرشح يقدم تفسيرات شاملة.`
                    : avgWordCount >= 35
                    ? `الردود المكتوبة كافية (${avgWordCount} كلمة متوسط). كافية لكن يمكن أن تكون أكثر تفصيلاً.`
                    : `الردود المكتوبة موجزة (${avgWordCount} كلمة متوسط). تفتقر إلى تفاصيل كافية في الإجابات.`
            }
        }
    }

    // 4. Additional Notes Analysis
    if (candidateData.additionalNotes) {
        const notesLength = candidateData.additionalNotes.length
        const keyPoints = candidateData.additionalNotes
            .split(/[.،;]\s+/)
            .filter(s => s.trim().length > 10)
            .slice(0, 3)

        breakdown.additionalNotesAnalysis = {
            notesProvided: true,
            notesLength,
            keyPointsExtracted: keyPoints,
            aiReasoning: {
                en: keyPoints.length > 0
                    ? `Candidate provided context: ${keyPoints.join('; ')}. This information adds valuable context to the application.`
                    : `Candidate provided additional notes but without specific actionable information.`,
                ar: keyPoints.length > 0
                    ? `قدم المرشح سياقاً: ${keyPoints.join('؛ ')}. هذه المعلومات تضيف سياقاً قيماً للطلب.`
                    : `قدم المرشح ملاحظات إضافية لكن بدون معلومات محددة قابلة للتنفيذ.`
            }
        }
    }

    // 5. External Profiles Analysis
    if (candidateData.urlContent) {
        const hasLinkedIn = candidateData.personalData.linkedinUrl ? true : false
        const hasPortfolio = candidateData.personalData.portfolioUrl ? true : false

        breakdown.externalProfilesAnalysis = {
            linkedinAnalyzed: hasLinkedIn,
            githubAnalyzed: false,
            portfolioAnalyzed: hasPortfolio,
            skillsDiscovered: 0,
            projectsFound: 0,
            aiReasoning: {
                en: hasLinkedIn || hasPortfolio
                    ? `External profiles analyzed. Online presence adds credibility to resume claims.`
                    : `No external profiles provided for verification.`,
                ar: hasLinkedIn || hasPortfolio
                    ? `تم تحليل الملفات الخارجية. الوجود عبر الإنترنت يضيف مصداقية لادعاءات السيرة الذاتية.`
                    : `لم يتم تقديم ملفات خارجية للتحقق.`
            }
        }
    }

    // 6. Language Requirements Analysis
    if (jobCriteria.languages && jobCriteria.languages.length > 0) {
        const levels = ['beginner', 'intermediate', 'advanced', 'native']
        const gaps: Array<{ language: string; required: string; candidate: string; gapLevel: number }> = []

        for (const reqLang of jobCriteria.languages) {
            const candidateLevel = candidateData.personalData.languageProficiency?.[reqLang.language]
            if (candidateLevel) {
                const reqIdx = levels.indexOf(reqLang.level.toLowerCase())
                const candIdx = levels.indexOf(candidateLevel.toLowerCase())
                if (candIdx < reqIdx) {
                    gaps.push({
                        language: reqLang.language,
                        required: reqLang.level,
                        candidate: candidateLevel,
                        gapLevel: reqIdx - candIdx
                    })
                }
            } else {
                gaps.push({
                    language: reqLang.language,
                    required: reqLang.level,
                    candidate: 'not provided',
                    gapLevel: 4
                })
            }
        }

        breakdown.languageRequirementsAnalysis = {
            totalLanguages: jobCriteria.languages.length,
            meetsAllRequirements: gaps.length === 0,
            gaps,
            aiReasoning: {
                en: gaps.length === 0
                    ? `Candidate meets all ${jobCriteria.languages.length} language requirements.`
                    : `Candidate has ${gaps.length} language gap(s): ${gaps.map(g => `${g.language} (has ${g.candidate}, needs ${g.required})`).join(', ')}.`,
                ar: gaps.length === 0
                    ? `المرشح يستوفي جميع متطلبات اللغات الـ ${jobCriteria.languages.length}.`
                    : `لدى المرشح ${gaps.length} فجوة لغوية: ${gaps.map(g => `${g.language} (لديه ${g.candidate}، يحتاج ${g.required})`).join('، ')}.`
            }
        }
    }

    // 7. Experience Analysis
    if (jobCriteria.minExperience && candidateData.personalData.yearsOfExperience !== undefined) {
        const meetsRequirement = candidateData.personalData.yearsOfExperience >= jobCriteria.minExperience
        const gap = meetsRequirement ? 0 : jobCriteria.minExperience - candidateData.personalData.yearsOfExperience

        breakdown.experienceAnalysis = {
            selfReported: candidateData.personalData.yearsOfExperience,
            required: jobCriteria.minExperience,
            meetsRequirement,
            gap: meetsRequirement ? undefined : gap,
            aiReasoning: {
                en: meetsRequirement
                    ? `Candidate has ${candidateData.personalData.yearsOfExperience} years experience, exceeding the ${jobCriteria.minExperience} year minimum.`
                    : `Candidate has only ${candidateData.personalData.yearsOfExperience} years, ${gap} year(s) below the ${jobCriteria.minExperience} year requirement.`,
                ar: meetsRequirement
                    ? `المرشح لديه ${candidateData.personalData.yearsOfExperience} سنة خبرة، تتجاوز الحد الأدنى ${jobCriteria.minExperience} سنة.`
                    : `المرشح لديه ${candidateData.personalData.yearsOfExperience} سنة فقط، ${gap} سنة أقل من المطلوب ${jobCriteria.minExperience} سنة.`
            }
        }
    }

    // 8. Scoring Breakdown (from criteriaMatches)
    if (scoringResult.criteriaMatches && scoringResult.criteriaMatches.length > 0) {
        const criteriaWeights = scoringResult.criteriaMatches.map(cm => ({
            criteriaName: cm.criteriaName,
            weight: cm.weight,
            score: cm.score,
            contribution: (cm.weight * cm.score),
            aiReasoning: cm.reason
        }))

        const totalWeightedScore = scoringResult.overallScore

        breakdown.scoringBreakdown = {
            criteriaWeights,
            totalWeightedScore,
            aiSummary: scoringResult.summary
        }
    }

    return breakdown
}

export default {
    scoreCandidate,
    generateRecommendation,
    checkBudget,
    calculateTotalExperience,
    matchSkills,
    buildAIAnalysisBreakdown,
}

