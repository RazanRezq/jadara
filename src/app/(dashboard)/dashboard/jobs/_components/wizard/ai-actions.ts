"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import dbConnect from "@/lib/mongodb"
import CompanyProfile from "@/models/CompanyProfile/companyProfileSchema"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

// Use gemini-2.5-flash model
const MODEL_NAME = "gemini-2.5-flash"

interface GenerateJobDescriptionInput {
    jobTitle: string
    employmentType: string
    workPlace: string
    vibeChips: string[]
    benefitChips: string[]
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

        // Fetch company profile from database
        await dbConnect()
        const companyProfile = await CompanyProfile.findOne()

        // Use company profile if available, otherwise use defaults
        const companyName = companyProfile?.companyName || "Our Company"
        const industry = companyProfile?.industry || "Technology"
        const bio = companyProfile?.bio || "A forward-thinking organization committed to excellence and innovation."
        const website = companyProfile?.website || ""

        if (!companyProfile) {
            console.warn("[AI] No company profile found, using default values")
        } else {
            console.log("[AI] Company:", companyProfile.companyName, "-", companyProfile.industry)
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

                // Construct rich prompt with company context
                const prompt = `You are an expert recruiter for **${companyName}**.

**Company Context:**
- Industry: ${industry}
- About Us: ${bio}
${website ? `- Website: ${website}` : ""}

**Job Details:**
- Job Title: ${input.jobTitle}
- Employment Type: ${input.employmentType}
- Work Place: ${input.workPlace}

**Company Atmosphere & Vibe:**
${input.vibeChips.length > 0 ? input.vibeChips.map(v => `- ${v}`).join("\n") : "- Professional and collaborative"}

**Benefits & Perks:**
${input.benefitChips.length > 0 ? input.benefitChips.map(b => `- ${b}`).join("\n") : "- Competitive compensation"}

**Task:**
Write a compelling, professional job description in **${language}** language that:
1. Starts with an engaging 2-3 sentence overview of the role
2. Clearly outlines key responsibilities (use bullet points)
3. Lists required qualifications and skills
4. Highlights the company atmosphere and benefits naturally
5. Reflects the company's culture and industry
6. Uses professional language appropriate for ${industry}
7. Is between 250-400 words

**Format:**
Use Markdown formatting with clear sections:
## About the Role
## Key Responsibilities
## Required Qualifications
## What We Offer

Be specific, professional, and make it compelling to attract top talent. Ensure the tone matches the selected vibe chips.`

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
