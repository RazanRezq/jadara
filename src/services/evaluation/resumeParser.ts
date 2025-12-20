/**
 * SmartRecruit AI - Resume Parser Service
 * Extracts structured data from PDF resumes and external profile links
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ParsedResume, ExtractedSkill, WorkExperience, Education, LanguageSkill } from './types'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'

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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

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
        
        // Clean JSON response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const parsedData = JSON.parse(responseText)

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
        console.error('[Resume Parser] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
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
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const portfolioData = JSON.parse(responseText)

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

