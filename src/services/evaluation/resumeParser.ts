/**
 * SmartRecruit AI - Resume Parser Service
 * Extracts structured data from PDF resumes and external profile links
 * Falls back to OpenAI when Gemini quota is exceeded
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { ParsedResume, ExtractedSkill, WorkExperience, Education, LanguageSkill } from './types'

// Gemini 2.0 Flash for resume parsing
const GEMINI_MODEL = 'gemini-2.0-flash-lite'

// Initialize OpenAI client (lazy)
let openaiClient: OpenAI | null = null
function getOpenAIClient(): OpenAI | null {
    if (openaiClient) return openaiClient
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return null
    openaiClient = new OpenAI({ apiKey })
    return openaiClient
}

/**
 * Parse resume from PDF URL
 * Extracts skills, experience, education, and more
 */
export async function parseResume(cvUrl: string): Promise<ParsedResume> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        
        if (!googleKey) {
            return {
                success: false,
                error: 'GOOGLE_API_KEY not configured',
            }
        }

        console.log('[Resume Parser] Parsing resume from:', cvUrl)

        // Fetch the PDF file
        const pdfResponse = await fetch(cvUrl)
        if (!pdfResponse.ok) {
            return {
                success: false,
                error: `Failed to fetch resume: ${pdfResponse.statusText}`,
            }
        }

        const pdfBuffer = await pdfResponse.arrayBuffer()
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64')

        // Use Gemini's vision capability to extract text from PDF
        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // First, extract raw text from PDF
        const extractPrompt = `Extract ALL text content from this PDF resume. 
Include everything: contact info, summary, skills, experience, education, certifications, languages.
Output the raw text content, preserving structure with line breaks.`

        const extractResult = await model.generateContent([
            extractPrompt,
            {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Pdf,
                },
            },
        ])

        const rawText = extractResult.response.text()
        console.log('[Resume Parser] Raw text extracted, length:', rawText.length)

        // Now parse the extracted text into structured data
        const parsePrompt = `You are an expert HR resume parser. Analyze this resume text and extract structured information.

**Resume Text:**
${rawText}

**Extract and return a JSON object with this EXACT structure:**
{
    "summary": "<professional summary if present, or generate a brief one based on experience>",
    "skills": [
        {
            "name": "<skill name>",
            "category": "<technical|soft|language|tool>",
            "yearsOfExperience": <number or null>,
            "proficiency": "<beginner|intermediate|advanced|expert>"
        }
    ],
    "experience": [
        {
            "title": "<job title>",
            "company": "<company name>",
            "startDate": "<YYYY-MM or YYYY>",
            "endDate": "<YYYY-MM or YYYY or null if current>",
            "isCurrent": <true|false>,
            "duration": "<calculated duration, e.g., '2 years 3 months'>",
            "responsibilities": ["<responsibility 1>", "<responsibility 2>"],
            "achievements": ["<achievement 1>", "<achievement 2>"]
        }
    ],
    "education": [
        {
            "degree": "<degree name>",
            "institution": "<school/university name>",
            "field": "<field of study>",
            "graduationYear": "<YYYY>",
            "gpa": "<GPA if mentioned>"
        }
    ],
    "languages": [
        {
            "language": "<language name>",
            "proficiency": "<beginner|intermediate|advanced|native>"
        }
    ],
    "certifications": ["<certification 1>", "<certification 2>"],
    "links": {
        "linkedin": "<URL or null>",
        "portfolio": "<URL or null>",
        "behance": "<URL or null>",
        "github": "<URL or null>",
        "other": ["<other URLs>"]
    }
}

**Important:**
- Extract ALL skills mentioned (technical, soft skills, tools, frameworks)
- Calculate experience durations accurately
- Infer proficiency levels from context if not explicitly stated
- Keep original language (Arabic/English) for job titles and descriptions
- Return ONLY valid JSON, no additional text`

        const parseResult = await model.generateContent(parsePrompt)
        let responseText = parseResult.response.text().trim()
        
        // Clean JSON response - remove markdown code blocks
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        // Extract JSON object/array if there's extra text
        const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
        if (jsonMatch) {
            responseText = jsonMatch[0]
        }
        
        // Try to parse JSON, with error recovery
        let parsedData
        try {
            parsedData = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[Resume Parser] JSON Parse Error:', parseError)
            console.error('[Resume Parser] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            
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
                parsedData = JSON.parse(fixedText)
                console.log('[Resume Parser] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[Resume Parser] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

        console.log('[Resume Parser] Parsed successfully:')
        console.log('  - Skills:', parsedData.skills?.length || 0)
        console.log('  - Experience:', parsedData.experience?.length || 0)
        console.log('  - Education:', parsedData.education?.length || 0)

        return {
            success: true,
            profile: {
                summary: parsedData.summary || '',
                skills: normalizeSkills(parsedData.skills || []),
                experience: normalizeExperience(parsedData.experience || []),
                education: normalizeEducation(parsedData.education || []),
                languages: normalizeLanguages(parsedData.languages || []),
                certifications: parsedData.certifications || [],
                links: {
                    linkedin: parsedData.links?.linkedin || undefined,
                    portfolio: parsedData.links?.portfolio || undefined,
                    behance: parsedData.links?.behance || undefined,
                    github: parsedData.links?.github || undefined,
                    other: parsedData.links?.other || [],
                },
            },
            rawText,
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Resume Parser] Error:', error)

        // Check if this is a quota exceeded error (429)
        const is429Error = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')

        if (is429Error) {
            console.log('🔄 [Resume Parser] Gemini quota exceeded, trying OpenAI fallback...')
            const openaiResult = await parseResumeWithOpenAI(cvUrl)
            if (openaiResult.success) {
                console.log('✅ [Resume Parser] OpenAI fallback successful!')
                return openaiResult
            }
            console.error('❌ [Resume Parser] OpenAI fallback also failed:', openaiResult.error)
        }

        return {
            success: false,
            error: errorMessage,
        }
    }
}

/**
 * OpenAI fallback for resume parsing
 * Used when Gemini quota is exceeded (429 errors)
 */
async function parseResumeWithOpenAI(cvUrl: string): Promise<ParsedResume> {
    const openai = getOpenAIClient()
    if (!openai) {
        return {
            success: false,
            error: 'OpenAI API key not configured for fallback',
        }
    }

    try {
        console.log('🔄 [OpenAI Resume] Parsing resume from:', cvUrl)

        // Fetch the PDF
        const pdfResponse = await fetch(cvUrl)
        if (!pdfResponse.ok) {
            return {
                success: false,
                error: `Failed to fetch resume: ${pdfResponse.statusText}`,
            }
        }

        const pdfBuffer = await pdfResponse.arrayBuffer()
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64')

        // Use GPT-4 Vision to analyze the PDF
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are an expert HR resume parser. Analyze this PDF resume and extract structured information.

Extract and return a JSON object with this structure:
{
    "summary": "<professional summary>",
    "skills": [{"name": "<skill>", "category": "<technical|soft|language|tool>", "proficiency": "<beginner|intermediate|advanced|expert>"}],
    "experience": [{"title": "<job title>", "company": "<company>", "startDate": "<YYYY-MM>", "endDate": "<YYYY-MM or null>", "isCurrent": <bool>, "duration": "<duration>", "responsibilities": ["<list>"], "achievements": ["<list>"]}],
    "education": [{"degree": "<degree>", "institution": "<school>", "field": "<field>", "graduationYear": "<YYYY>"}],
    "languages": [{"language": "<language>", "proficiency": "<beginner|intermediate|advanced|native>"}],
    "certifications": ["<list>"],
    "links": {"linkedin": "<url>", "portfolio": "<url>", "github": "<url>", "other": ["<urls>"]}
}

Return ONLY valid JSON.`,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:application/pdf;base64,${base64Pdf}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 4000,
        })

        let responseText = response.choices[0]?.message?.content?.trim() || '{}'
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        const jsonMatch = responseText.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
            responseText = jsonMatch[0]
        }

        const parsedData = JSON.parse(responseText)

        console.log('✅ [OpenAI Resume] Parsed successfully')

        return {
            success: true,
            profile: {
                summary: parsedData.summary || '',
                skills: normalizeSkills(parsedData.skills || []),
                experience: normalizeExperience(parsedData.experience || []),
                education: normalizeEducation(parsedData.education || []),
                languages: normalizeLanguages(parsedData.languages || []),
                certifications: parsedData.certifications || [],
                links: {
                    linkedin: parsedData.links?.linkedin || undefined,
                    portfolio: parsedData.links?.portfolio || undefined,
                    behance: parsedData.links?.behance || undefined,
                    github: parsedData.links?.github || undefined,
                    other: parsedData.links?.other || [],
                },
            },
            rawText: responseText,
        }
    } catch (error) {
        console.error('❌ [OpenAI Resume] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'OpenAI fallback failed',
        }
    }
}

/**
 * Scrape and parse LinkedIn profile (basic implementation)
 * Note: Full scraping requires specialized APIs due to LinkedIn's restrictions
 */
export async function parseLinkedInProfile(linkedinUrl: string): Promise<ParsedResume> {
    try {
        console.log('[LinkedIn Parser] Parsing:', linkedinUrl)

        // For production, use LinkedIn API or a scraping service like Proxycurl
        // This is a placeholder that returns basic info
        
        // Validate LinkedIn URL
        if (!linkedinUrl.includes('linkedin.com/in/')) {
            return {
                success: false,
                error: 'Invalid LinkedIn URL format',
            }
        }

        // In production, you would use:
        // 1. LinkedIn API (requires OAuth)
        // 2. Third-party APIs like Proxycurl, PhantomBuster
        // 3. Custom scraping solution (be careful of ToS)

        console.log('[LinkedIn Parser] Note: LinkedIn scraping requires specialized API')
        
        return {
            success: false,
            error: 'LinkedIn parsing requires API integration. URL saved for reference.',
        }
    } catch (error) {
        console.error('[LinkedIn Parser] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Parse Behance/Portfolio profile
 */
export async function parsePortfolioProfile(portfolioUrl: string): Promise<ParsedResume> {
    try {
        console.log('[Portfolio Parser] Parsing:', portfolioUrl)

        const googleKey = process.env.GOOGLE_API_KEY
        if (!googleKey) {
            return {
                success: false,
                error: 'GOOGLE_API_KEY not configured',
            }
        }

        // Fetch the portfolio page
        const response = await fetch(portfolioUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartRecruit/1.0)',
            },
        })

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to fetch portfolio: ${response.statusText}`,
            }
        }

        const html = await response.text()

        // Use Gemini to extract relevant information from HTML
        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        const prompt = `Analyze this portfolio/Behance page HTML and extract:
1. Skills demonstrated
2. Project types/categories
3. Tools/software used
4. Any professional information

HTML content (first 15000 chars):
${html.substring(0, 15000)}

Return JSON:
{
    "skills": ["skill1", "skill2"],
    "projectTypes": ["type1", "type2"],
    "tools": ["tool1", "tool2"],
    "summary": "<brief summary of portfolio>"
}

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
        let portfolioData
        try {
            portfolioData = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[Portfolio Parser] JSON Parse Error:', parseError)
            console.error('[Portfolio Parser] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            
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
                portfolioData = JSON.parse(fixedText)
                console.log('[Portfolio Parser] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[Portfolio Parser] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

        const skills: ExtractedSkill[] = [
            ...(portfolioData.skills || []).map((s: string) => ({
                name: s,
                category: 'technical' as const,
                proficiency: 'advanced' as const,
            })),
            ...(portfolioData.tools || []).map((t: string) => ({
                name: t,
                category: 'tool' as const,
                proficiency: 'intermediate' as const,
            })),
        ]

        return {
            success: true,
            profile: {
                summary: portfolioData.summary || '',
                skills,
                experience: [],
                education: [],
                languages: [],
                certifications: [],
                links: {
                    portfolio: portfolioUrl,
                },
            },
        }
    } catch (error) {
        console.error('[Portfolio Parser] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Merge profiles from multiple sources (CV, LinkedIn, Behance)
 */
export async function mergeProfiles(
    cvProfile?: ParsedResume['profile'],
    linkedInProfile?: ParsedResume['profile'],
    portfolioProfile?: ParsedResume['profile']
): Promise<ParsedResume['profile']> {
    const mergedProfile: ParsedResume['profile'] = {
        summary: '',
        skills: [],
        experience: [],
        education: [],
        languages: [],
        certifications: [],
        links: {},
    }

    // Priority: CV > LinkedIn > Portfolio
    const profiles = [cvProfile, linkedInProfile, portfolioProfile].filter(Boolean)

    for (const profile of profiles) {
        if (!profile) continue

        // Take the longest summary
        if (profile.summary && profile.summary.length > (mergedProfile.summary?.length || 0)) {
            mergedProfile.summary = profile.summary
        }

        // Merge skills (deduplicate by name)
        const existingSkillNames = new Set(mergedProfile.skills.map(s => s.name.toLowerCase()))
        for (const skill of profile.skills) {
            if (!existingSkillNames.has(skill.name.toLowerCase())) {
                mergedProfile.skills.push(skill)
                existingSkillNames.add(skill.name.toLowerCase())
            }
        }

        // Merge experience (deduplicate by company + title)
        const existingExp = new Set(mergedProfile.experience.map(e => `${e.company}-${e.title}`.toLowerCase()))
        for (const exp of profile.experience) {
            const key = `${exp.company}-${exp.title}`.toLowerCase()
            if (!existingExp.has(key)) {
                mergedProfile.experience.push(exp)
                existingExp.add(key)
            }
        }

        // Merge education
        const existingEdu = new Set(mergedProfile.education.map(e => `${e.institution}-${e.degree}`.toLowerCase()))
        for (const edu of profile.education) {
            const key = `${edu.institution}-${edu.degree}`.toLowerCase()
            if (!existingEdu.has(key)) {
                mergedProfile.education.push(edu)
                existingEdu.add(key)
            }
        }

        // Merge languages
        const existingLangs = new Set(mergedProfile.languages.map(l => l.language.toLowerCase()))
        for (const lang of profile.languages) {
            if (!existingLangs.has(lang.language.toLowerCase())) {
                mergedProfile.languages.push(lang)
                existingLangs.add(lang.language.toLowerCase())
            }
        }

        // Merge certifications
        const existingCerts = new Set(mergedProfile.certifications.map(c => c.toLowerCase()))
        for (const cert of profile.certifications) {
            if (!existingCerts.has(cert.toLowerCase())) {
                mergedProfile.certifications.push(cert)
                existingCerts.add(cert.toLowerCase())
            }
        }

        // Merge links
        mergedProfile.links = {
            ...mergedProfile.links,
            ...profile.links,
        }
    }

    return mergedProfile
}

// Helper functions for normalization
function normalizeSkills(skills: unknown[]): ExtractedSkill[] {
    return skills.map((s: unknown) => {
        const skill = s as Record<string, unknown>
        return {
            name: String(skill.name || ''),
            category: (skill.category as ExtractedSkill['category']) || 'technical',
            yearsOfExperience: typeof skill.yearsOfExperience === 'number' ? skill.yearsOfExperience : undefined,
            proficiency: (skill.proficiency as ExtractedSkill['proficiency']) || 'intermediate',
        }
    }).filter(s => s.name)
}

function normalizeExperience(experiences: unknown[]): WorkExperience[] {
    return experiences.map((e: unknown) => {
        const exp = e as Record<string, unknown>
        return {
            title: String(exp.title || ''),
            company: String(exp.company || ''),
            startDate: exp.startDate ? String(exp.startDate) : undefined,
            endDate: exp.endDate ? String(exp.endDate) : undefined,
            isCurrent: Boolean(exp.isCurrent),
            duration: exp.duration ? String(exp.duration) : undefined,
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.map(String) : [],
            achievements: Array.isArray(exp.achievements) ? exp.achievements.map(String) : [],
        }
    }).filter(e => e.title && e.company)
}

function normalizeEducation(education: unknown[]): Education[] {
    return education.map((e: unknown) => {
        const edu = e as Record<string, unknown>
        return {
            degree: String(edu.degree || ''),
            institution: String(edu.institution || ''),
            field: edu.field ? String(edu.field) : undefined,
            graduationYear: edu.graduationYear ? String(edu.graduationYear) : undefined,
            gpa: edu.gpa ? String(edu.gpa) : undefined,
        }
    }).filter(e => e.degree && e.institution)
}

function normalizeLanguages(languages: unknown[]): LanguageSkill[] {
    return languages.map((l: unknown) => {
        const lang = l as Record<string, unknown>
        return {
            language: String(lang.language || ''),
            proficiency: (lang.proficiency as LanguageSkill['proficiency']) || 'intermediate',
        }
    }).filter(l => l.language)
}

export default {
    parseResume,
    parseLinkedInProfile,
    parsePortfolioProfile,
    mergeProfiles,
}




