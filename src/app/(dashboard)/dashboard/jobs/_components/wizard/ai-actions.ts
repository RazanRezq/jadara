"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import dbConnect from "@/lib/mongodb"
import CompanyProfile from "@/models/CompanyProfile/companyProfileSchema"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

// Use gemini-2.0-flash model (1500 requests/day free tier vs 20 for 2.5-flash-lite)
const MODEL_NAME = "gemini-2.0-flash"

interface GenerateJobDescriptionInput {
    jobTitle: string
    employmentType: string
    workPlace: string
    vibeChips: string[]
    benefitChips: string[]
    toneOfVoice?: string
    emojiStyle?: string
    customDetails?: string
    refinementInstruction?: string
    currentDescription?: string
}

/**
 * Smart AI Job Description Generator
 * Fetches company profile and generates contextual job descriptions
 */
export async function generateJobDescription(
    input: GenerateJobDescriptionInput
): Promise<{ success: boolean; description?: string; error?: string }> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY

        if (!apiKey) {
            console.error("[AI] GOOGLE_API_KEY not found in environment variables")
            return {
                success: false,
                error: "API key not configured. Please add GOOGLE_API_KEY to your .env.local file and restart the server.",
            }
        }

        console.log("[AI] Generating job description with smart context...")
        console.log("[AI] Job:", input.jobTitle, input.employmentType, input.workPlace)
        console.log("[AI] Vibe:", input.vibeChips.join(", "))
        console.log("[AI] Benefits:", input.benefitChips.join(", "))

        // Fetch company profile from database with resilience and fallbacks
        await dbConnect()
        
        let companyName = "Our Company | شركتنا"
        let industry = "General Industry | صناعة عامة"
        let bio = "A forward-thinking organization committed to excellence and innovation. | منظمة تفكر بشكل استباقي ملتزمة بالتميز والابتكار."
        let website = ""

        try {
            const companyProfile = await CompanyProfile.findOne()
            
            if (companyProfile) {
                // Use real company data
                companyName = companyProfile.companyName
                industry = companyProfile.industry || industry
                bio = companyProfile.bio || bio
                website = companyProfile.website || ""
                console.log("[AI] ✅ Using company profile:", companyName, "-", industry)
            } else {
                console.warn("[AI] ⚠️  No company profile found - using generic defaults")
            }
        } catch (error) {
            console.error("[AI] ⚠️  Error fetching company profile - using generic defaults:", error)
        }

        console.log("[AI] Company:", companyName, "-", industry)

        // Filter remote work benefits if employment type is not remote
        let filteredBenefitChips = [...input.benefitChips]
        const isRemoteEmployment = input.employmentType.toLowerCase().includes('remote') || 
                                   input.employmentType.includes('عن بعد') ||
                                   input.employmentType.toLowerCase().includes('من المنزل')
        
        if (!isRemoteEmployment) {
            const remoteKeywords = ['remote', 'work from home', 'عن بعد', 'عن بُعد', 'منزل', 'معدات العمل عن بُعد']
            filteredBenefitChips = filteredBenefitChips.filter(benefit => {
                const benefitLower = benefit.toLowerCase()
                return !remoteKeywords.some(keyword => benefitLower.includes(keyword.toLowerCase()))
            })
            
            if (filteredBenefitChips.length !== input.benefitChips.length) {
                console.log("[AI] 🔧 Filtered out remote work benefits (employment type is not remote)")
            }
        }

        // Detect language from job title (Arabic if contains Arabic characters, otherwise English)
        const isArabic = /[\u0600-\u06FF]/.test(input.jobTitle)
        const language = isArabic ? "Arabic" : "English"

        // Re-initialize with fresh API key
        const genAIInstance = new GoogleGenerativeAI(apiKey)

        // Try with and without "models/" prefix
        const modelVariants = [MODEL_NAME, `models/${MODEL_NAME}`]
        let lastError: Error | null = null

        for (const modelName of modelVariants) {
            try {
                console.log(`[AI] Trying model: ${modelName}`)
                const model = genAIInstance.getGenerativeModel({ model: modelName })

                // Determine if this is a refinement request
                const isRefinement = !!input.refinementInstruction && !!input.currentDescription
                
                // Build tone instruction
                const toneInstruction = input.toneOfVoice 
                    ? `**Tone of Voice:** ${input.toneOfVoice}\n` 
                    : ""
                
                // Build emoji style instruction
                let emojiInstruction = ""
                if (input.emojiStyle === "no-emojis") {
                    emojiInstruction = `**CRITICAL: NO EMOJIS ALLOWED** - Do NOT use ANY emojis anywhere in the description.\n`
                } else if (input.emojiStyle === "moderate") {
                    emojiInstruction = `**Emoji Usage - MODERATE Style:** 
- Use emojis to enhance readability and visual appeal
- Add 1-2 emojis per section header (e.g., "## 🚀 About the Role", "## 💼 Key Responsibilities")
- Add emojis to 2-3 bullet points per section to highlight key points
- Keep it professional but engaging
- Examples: ✨ 🎯 💡 🌟 🔥 💪 📈 🎓 🏆 ⚡ 🌍 💻 📱 🎨 🔧
- Total emojis in description: 8-12 emojis throughout the entire description
\n`
                }
                
                // Build custom details instruction
                const customDetailsInstruction = input.customDetails
                    ? `**Additional Custom Details:** ${input.customDetails}\n`
                    : ""

                // Build refinement instruction if present
                const refinementSection = isRefinement
                    ? `**Refinement Request:** ${input.refinementInstruction}\n**Current Description:**\n${input.currentDescription}\n\n**Task:** Apply the refinement instruction to the current description above.\n`
                    : ""

                // Construct rich prompt with company context
                const prompt = isRefinement
                    ? `You are an expert recruiter for ${companyName}.

${refinementSection}${toneInstruction}${emojiInstruction}${customDetailsInstruction}**Important Instructions:**
- Apply the refinement while maintaining the original structure and key information
- Keep the same language (${language})
- Maintain professional quality
- Output STRICTLY clean Markdown
- Use ## for section headers (e.g., ## About the Role)
- Use - for bullet points
- Use **bold** for emphasis
- Do NOT use any HTML tags (no <p>, no <div>, no <b>, no <br>)
- Do NOT add specific years of experience or hard skills lists
- Focus on Role Responsibilities, Objectives, Company Culture, and Benefits

**Format:**
Use clean Markdown format ONLY:
## About the Role
[content]

## Key Responsibilities
- [responsibility 1]
- [responsibility 2]

## What We Offer
- [benefit 1]
- [benefit 2]`
                    : `You are an expert recruiter for ${companyName}.

**Company Context:**
- Industry: ${industry}
- About Us: ${bio}
${website ? `- Website: ${website}` : ""}

**Job Details:**
- Job Title: ${input.jobTitle}
- Employment Type: ${input.employmentType} (STRICTLY respect this - do NOT change it to Remote if it's On-site, or vice versa)
- Work Place: ${input.workPlace}

**Company Atmosphere & Vibe:**
${input.vibeChips.length > 0 ? input.vibeChips.map(v => `- ${v}`).join("\n") : "- Professional and collaborative"}

**Benefits & Perks:**
${filteredBenefitChips.length > 0 ? filteredBenefitChips.map(b => `- ${b}`).join("\n") : "- Competitive compensation"}

${toneInstruction}${emojiInstruction}${customDetailsInstruction}**Task:**
Write a compelling, professional job description in ${language} language that:
1. Starts with an engaging 2-3 sentence overview of the role
2. Clearly outlines key responsibilities (use bullet points with dashes)
3. Describes role objectives and company culture
4. Highlights the company atmosphere and benefits naturally
5. Reflects the company's culture and industry
6. Uses language appropriate for ${industry}
7. Is between 250-400 words

**CRITICAL CONSTRAINTS:**
- DO NOT generate specific years of experience (e.g., "5 years of React")
- DO NOT create hard skills lists (e.g., "React, Node.js, MongoDB")
- Focus on: Role Responsibilities, Objectives, Company Culture, and Benefits
- STRICTLY respect the Employment Type: ${input.employmentType} - do NOT change it or mention remote work if not remote
- Use the exact company name: ${companyName} - do NOT use "Our Company" or generic terms
- The employment type is strictly ${input.employmentType}. Do NOT mention remote work if the type is not remote.

**LOCALIZATION REQUIREMENTS (${language}):**
${language === "Arabic" ? `
- TRANSLATE Employment Type to Arabic: "Full-time" → "دوام كامل", "Part-time" → "دوام جزئي", "Contract" → "عقد", "Freelance" → "عمل حر", "Remote" → "عن بُعد", "On-site" → "في الموقع", "Hybrid" → "هجين"
- TRANSLATE Location names to Arabic: "Istanbul" → "إسطنبول", "Dubai" → "دبي", "Cairo" → "القاهرة", "Riyadh" → "الرياض", etc.
- If mentioning salary/currency and it's "TRY" or "TL", write it as "ليرة تركية" (Turkish Lira) in Arabic
- Do NOT leave English terms like "Full-time" or "Istanbul" in Arabic text - they MUST be translated
` : `
- Use proper English terminology throughout
- If mentioning salary/currency "TRY" or "TL", write it as "Turkish Lira" or "TRY"
`}

**OUTPUT FORMAT - CRITICAL:**
Output STRICTLY clean Markdown. Follow these rules:
- Use ## for section headers (e.g., ## About the Role or ## المسؤوليات)
- Use - for bullet points
- Use **bold** for emphasis
- DO NOT use any HTML tags (no <p>, no <div dir="rtl">, no <b>, no <br>)
- Keep the structure clean and RTL-friendly
- Be specific, professional, and make it compelling to attract top talent

**Example Format:**
## About the Role
[2-3 sentence overview]

## Key Responsibilities
- [responsibility 1]
- [responsibility 2]
- [responsibility 3]

## What We Offer
- [benefit 1]
- [benefit 2]
- [benefit 3]`

                console.log(`[AI] Calling generateContent for ${modelName}...`)
                const result = await model.generateContent(prompt)
                console.log(`[AI] Got response from ${modelName}`)

                const response = await result.response
                const description = response.text().trim()
                console.log(`[AI] Response text length:`, description.length)

                if (!description || description.length < 100) {
                    return {
                        success: false,
                        error: "Generated description is too short. Please try again.",
                    }
                }

                console.log("[AI] ✅ Job description generated successfully!")
                return {
                    success: true,
                    description,
                }
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error))
                lastError = err
                console.error(`[AI] Model ${modelName} failed:`)
                console.error(`[AI] Error message:`, err.message)
                if (err.stack) {
                    console.error(`[AI] Error stack:`, err.stack.substring(0, 500))
                }
                continue
            }
        }

        // If all models failed, return error with details
        console.error("[AI] All models failed. Last error:", lastError?.message)
        const errorMessage = lastError?.message || "Unknown error occurred"

        // Provide more specific error messages
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            return {
                success: false,
                error: `Model not found. Please verify your API key at https://makersuite.google.com/app/apikey and ensure it has access to Gemini models.`,
            }
        }

        if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("401") || errorMessage.includes("403")) {
            return {
                success: false,
                error: "Invalid API key. Please check your GOOGLE_API_KEY in .env.local file.",
            }
        }

        return {
            success: false,
            error: `API Error: ${errorMessage}. Please check your API key and try again.`,
        }
    } catch (error) {
        console.error("[AI] Error generating job description:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error | unknown

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            // Check if error is retryable (503, 429, or network errors)
            const isRetryable = 
                (error instanceof Error && (
                    error.message.includes('503') ||
                    error.message.includes('Service Unavailable') ||
                    error.message.includes('overloaded') ||
                    error.message.includes('429') ||
                    error.message.includes('rate limit') ||
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('ETIMEDOUT')
                ))

            if (!isRetryable || attempt === maxRetries - 1) {
                throw error
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = initialDelay * Math.pow(2, attempt)
            console.log(`[AI] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw lastError
}

/**
 * Enhanced Skill Extraction with AI
 * Extracts explicit skills from description and infers standard skills based on job title
 */
interface ExtractedSkill {
    name: string
    type: 'technical' | 'soft'
    importance: 'must_have' | 'nice_to_have'
    reason: 'explicit' | 'inferred'
}

export async function extractSkillsFromDescription(input: {
    jobTitle: string
    description: string
    locale?: string
}): Promise<{ success: boolean; skills?: ExtractedSkill[]; error?: string }> {
    try {
        const apiKey = process.env.GOOGLE_API_KEY

        if (!apiKey) {
            console.error("[AI] GOOGLE_API_KEY not found in environment variables")
            return {
                success: false,
                error: "API key not configured. Please add GOOGLE_API_KEY to your .env.local file and restart the server.",
            }
        }

        console.log("[AI] Extracting skills from job description...")
        console.log("[AI] Job Title:", input.jobTitle)

        const genAIInstance = new GoogleGenerativeAI(apiKey)
        const model = genAIInstance.getGenerativeModel({ model: MODEL_NAME })

        // Detect if Arabic language is requested
        const isArabic = input.locale === 'ar'
        
        // Build localization instruction for Arabic
        const localizationInstruction = isArabic 
            ? `
**CRITICAL LOCALIZATION RULES FOR ARABIC:**

**Skill Names Translation Logic:**
1. **Technical/Universal Terms** (DO NOT translate - keep in English):
   - Programming languages: React, Node.js, Python, Java, JavaScript, TypeScript, C++, etc.
   - Frameworks & Libraries: Angular, Vue, Django, Spring, Laravel, etc.
   - Technologies: AWS, Azure, Docker, Kubernetes, MongoDB, PostgreSQL, etc.
   - Software: Photoshop, Illustrator, AutoCAD, Microsoft Office, SAP, etc.
   - Certifications: PMP, CPA, AWS Certified, Google Analytics, etc.
   - Universal terms: SEO, CRM, API, UI/UX, DevOps, etc.

2. **Translatable Skills** (translate to Arabic):
   - Soft skills: "Communication" → "التواصل", "Teamwork" → "العمل الجماعي", "Leadership" → "القيادة"
   - General abilities: "Problem Solving" → "حل المشكلات", "Time Management" → "إدارة الوقت"
   - Language skills: "English" → "الإنجليزية", "Arabic" → "العربية"
   - Industry-specific non-technical: "Customer Service" → "خدمة العملاء", "Sales" → "المبيعات"

**Metadata (ALWAYS translate to Arabic):**
- **Type field:** "technical" → "تقنية", "soft" → "مهارة ناعمة"  
- **Reason field:** "explicit" → "صريح", "inferred" → "مستنتج"

**EXAMPLE for Arabic:**
[
  {
    "name": "React",
    "type": "تقنية",
    "importance": "must_have",
    "reason": "صريح"
  },
  {
    "name": "التواصل",
    "type": "مهارة ناعمة",
    "importance": "nice_to_have",
    "reason": "مستنتج"
  },
  {
    "name": "AWS",
    "type": "تقنية",
    "importance": "must_have",
    "reason": "صريح"
  },
  {
    "name": "القيادة",
    "type": "مهارة ناعمة",
    "importance": "nice_to_have",
    "reason": "مستنتج"
  }
]
`
            : `
**LOCALIZATION RULES FOR ENGLISH:**
- Keep all fields in English
- Use "technical" or "soft" for type
- Use "explicit" or "inferred" for reason
`

        const prompt = `You are an expert HR analyst specializing in skill extraction and job analysis.

**Job Title:** ${input.jobTitle}

**Job Description:**
${input.description}

**Task:**
Extract and categorize skills from the job description above. Return a structured JSON array with the following format:

1. **Explicit Skills**: Skills explicitly mentioned in the job description (e.g., "React", "AWS", "Communication")
2. **Inferred Skills**: Standard skills typically required for this job title, even if not explicitly mentioned

For each skill, provide:
- \`name\`: The skill name in ENGLISH (e.g., "React", "Teamwork", "Python")
- \`type\`: Either "technical" or "soft" (localized based on language below)
- \`importance\`: Either "must_have" (essential/required) or "nice_to_have" (preferred/bonus)
- \`reason\`: Either "explicit" (found in description) or "inferred" (standard for job title) (localized based on language below)

**Rules:**
1. Extract 5-10 explicit skills from the description
2. Infer 3-5 standard skills for the job title
3. Focus on concrete, searchable skills
4. Avoid generic terms like "good at work" - be specific
5. Prioritize technical skills for technical roles
6. Include relevant soft skills (communication, teamwork, problem-solving)
7. Mark skills mentioned in description as "explicit" and "must_have"
8. Mark inferred standard skills as "inferred" and appropriate importance level

${localizationInstruction}

**Output Format:**
Return ONLY a valid JSON array with no additional text or markdown`

        console.log(`[AI] Calling generateContent for skill extraction...`)
        
        // Use retry logic with exponential backoff
        const result = await retryWithBackoff(
            () => model.generateContent(prompt),
            3, // max 3 retries
            1000 // initial delay 1 second
        )
        
        console.log(`[AI] Got response from skill extraction`)

        const response = await result.response
        let responseText = response.text().trim()
        console.log(`[AI] Response text length:`, responseText.length)

        // Clean up the response (remove markdown code blocks if present)
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        // Extract JSON object/array if there's extra text
        const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
        if (jsonMatch) {
            responseText = jsonMatch[0]
        }

        // Try to parse JSON, with error recovery
        let skills: ExtractedSkill[]
        try {
            skills = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[AI Actions] JSON Parse Error:', parseError)
            console.error('[AI Actions] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            
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
                skills = JSON.parse(fixedText)
                console.log('[AI Actions] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[AI Actions] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

        if (!Array.isArray(skills) || skills.length === 0) {
            return {
                success: false,
                error: "No skills extracted. Please try again.",
            }
        }

        console.log("[AI] ✅ Skills extracted successfully:", skills.length)
        return {
            success: true,
            skills,
        }
    } catch (error) {
        console.error("[AI] Error extracting skills:", error)
        
        // Provide user-friendly error messages
        let errorMessage = "Unknown error occurred"
        
        if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase()
            
            if (errorMsg.includes('503') || errorMsg.includes('service unavailable') || errorMsg.includes('overloaded')) {
                errorMessage = "The AI service is temporarily overloaded. Please wait a moment and try again."
            } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
                errorMessage = "Too many requests. Please wait a few seconds before trying again."
            } else if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('api_key')) {
                errorMessage = "Invalid API key. Please check your GOOGLE_API_KEY configuration."
            } else if (errorMsg.includes('network') || errorMsg.includes('econnreset') || errorMsg.includes('etimedout')) {
                errorMessage = "Network error. Please check your internet connection and try again."
            } else if (errorMsg.includes('json') || errorMsg.includes('parse')) {
                errorMessage = "Failed to parse AI response. Please try again."
            } else {
                errorMessage = error.message
            }
        }
        
        return {
            success: false,
            error: errorMessage,
        }
    }
}
