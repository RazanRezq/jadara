/**
 * SmartRecruit AI - URL Content Extractor Service
 * Extracts meaningful content from candidate profile URLs (LinkedIn, GitHub, Portfolio)
 * for enhanced AI evaluation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as cheerio from 'cheerio'
import axios from 'axios'

const GEMINI_MODEL = 'gemini-2.5-flash-lite'

// ScrapingDog API Configuration
const SCRAPINGDOG_API_KEY = process.env.SCRAPINGDOG_API_KEY
const SCRAPINGDOG_API_URL = 'https://api.scrapingdog.com/profile'

// Rate limiting configuration
const API_DELAY_MS = 2000 // 2 seconds between Gemini API calls to respect rate limits
let lastGeminiCallTime = 0

// ============================================================================
// Types
// ============================================================================

export interface ExtractedUrlContent {
    url: string
    type: 'linkedin' | 'github' | 'portfolio' | 'behance' | 'other'
    success: boolean
    content?: {
        summary: string
        highlights: string[]
        skills: string[]
        projects: ProjectInfo[]
        experience: string[]
        rawText?: string
    }
    error?: string
    fetchedAt: Date
}

export interface ProjectInfo {
    name: string
    description: string
    technologies: string[]
    url?: string
    stars?: number
    forks?: number
}

export interface UrlExtractionResult {
    success: boolean
    extractedUrls: ExtractedUrlContent[]
    combinedSummary: string
    totalProjectsFound: number
    allSkills: string[]
    errors: string[]
}

// ============================================================================
// Rate Limiting Utility
// ============================================================================

/**
 * Wait to respect API rate limits
 */
async function waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - lastGeminiCallTime
    
    if (timeSinceLastCall < API_DELAY_MS) {
        const waitTime = API_DELAY_MS - timeSinceLastCall
        console.log(`[Rate Limiter] Waiting ${waitTime}ms before next Gemini API call...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastGeminiCallTime = Date.now()
}

// ============================================================================
// Safe Fetch Utility (handles non-standard HTTP status codes)
// ============================================================================

interface SafeFetchResult {
    ok: boolean
    status: number
    statusText: string
    text: string
    error?: string
}

/**
 * Safe fetch that handles non-standard HTTP status codes (like LinkedIn's 999)
 * Uses a raw HTTP approach to avoid Node.js fetch's status validation
 */
async function safeFetch(url: string, options: RequestInit = {}): Promise<SafeFetchResult> {
    try {
        // Use AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            redirect: 'follow',
        })

        clearTimeout(timeoutId)

        // Read the response body
        const text = await response.text()

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            text,
        }
    } catch (error) {
        // Handle RangeError from non-standard status codes (e.g., LinkedIn's 999)
        if (error instanceof RangeError && error.message.includes('status')) {
            console.warn(`[SafeFetch] Non-standard HTTP status detected for ${url}`)
            return {
                ok: false,
                status: 999, // LinkedIn's block status
                statusText: 'Non-standard status (likely blocked by site)',
                text: '',
                error: 'Site returned non-standard status code (access blocked)',
            }
        }

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                ok: false,
                status: 0,
                statusText: 'Request timeout',
                text: '',
                error: 'Request timed out',
            }
        }

        // Handle other errors
        return {
            ok: false,
            status: 0,
            statusText: 'Fetch error',
            text: '',
            error: error instanceof Error ? error.message : 'Unknown fetch error',
        }
    }
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract content from all provided URLs
 */
export async function extractUrlsContent(urls: {
    linkedinUrl?: string
    githubUrl?: string
    portfolioUrl?: string
    behanceUrl?: string
}): Promise<UrlExtractionResult> {
    const extractedUrls: ExtractedUrlContent[] = []
    const errors: string[] = []
    const allSkills = new Set<string>()
    let totalProjects = 0

    console.log('[URL Extractor] Starting extraction for URLs:', {
        linkedin: urls.linkedinUrl ? '✓' : '✗',
        github: urls.githubUrl ? '✓' : '✗',
        portfolio: urls.portfolioUrl ? '✓' : '✗',
        behance: urls.behanceUrl ? '✓' : '✗',
    })

    // Process URLs sequentially to respect rate limits
    // (parallel would be faster but causes rate limiting issues)
    
    if (urls.linkedinUrl) {
        const result = await extractLinkedInContent(urls.linkedinUrl)
        extractedUrls.push(result)
        if (result.success && result.content) {
            result.content.skills.forEach(s => allSkills.add(s))
            totalProjects += result.content.projects.length
        } else if (result.error) {
            errors.push(`linkedin: ${result.error}`)
        }
    }

    if (urls.githubUrl) {
        const result = await extractGitHubContent(urls.githubUrl)
        extractedUrls.push(result)
        if (result.success && result.content) {
            result.content.skills.forEach(s => allSkills.add(s))
            totalProjects += result.content.projects.length
        } else if (result.error) {
            errors.push(`github: ${result.error}`)
        }
    }

    if (urls.portfolioUrl) {
        const result = await extractPortfolioContent(urls.portfolioUrl)
        extractedUrls.push(result)
        if (result.success && result.content) {
            result.content.skills.forEach(s => allSkills.add(s))
            totalProjects += result.content.projects.length
        } else if (result.error) {
            errors.push(`portfolio: ${result.error}`)
        }
    }

    if (urls.behanceUrl && urls.behanceUrl !== urls.portfolioUrl) {
        const result = await extractBehanceContent(urls.behanceUrl)
        extractedUrls.push(result)
        if (result.success && result.content) {
            result.content.skills.forEach(s => allSkills.add(s))
            totalProjects += result.content.projects.length
        } else if (result.error) {
            errors.push(`behance: ${result.error}`)
        }
    }

    // Generate combined summary
    const combinedSummary = generateCombinedSummary(extractedUrls)

    console.log('[URL Extractor] Extraction complete:')
    console.log(`  - URLs processed: ${extractedUrls.length}`)
    console.log(`  - Skills found: ${allSkills.size}`)
    console.log(`  - Projects found: ${totalProjects}`)
    console.log(`  - Errors: ${errors.length}`)

    return {
        success: extractedUrls.some(u => u.success), // Success if at least one URL extracted
        extractedUrls,
        combinedSummary,
        totalProjectsFound: totalProjects,
        allSkills: Array.from(allSkills),
        errors,
    }
}

// ============================================================================
// LinkedIn Extraction (via Apify)
// ============================================================================

/**
 * LinkedIn profile data interface from ScrapingDog API
 * NOTE: ScrapingDog returns snake_case field names
 */
interface LinkedInProfileData {
    fullName?: string
    first_name?: string
    last_name?: string
    linkedin_internal_id?: string
    public_identifier?: string
    headline?: string
    summary?: string
    about?: string
    location?: string
    followers?: string
    connections?: string
    background_cover_image_url?: string
    profile_photo?: string
    
    // Experience (not "positions")
    experience?: Array<{
        company_name?: string
        company_image?: string
        company_url?: string
        title?: string
        description?: string
        start_date?: string
        end_date?: string
        location?: string
    }>
    
    // Education (not "educations")
    education?: Array<{
        school_name?: string
        school_image?: string
        degree?: string
        field_of_study?: string
        start_date?: string
        end_date?: string
        description?: string
    }>
    
    // Skills
    skills?: Array<{
        name?: string
    }> | string[]
    
    // Languages
    languages?: Array<{
        name?: string
        proficiency?: string
    }>
    
    // Certifications
    certification?: Array<{
        company_name?: string
        company_image?: string
        company_url?: string
        certification?: string
        credential_id?: string
        credential_url?: string
        issue_date?: string
    }>
    
    // Volunteering
    volunteering?: Array<{
        title?: string
        organization?: string
        description?: string
    }>
    
    // Articles, Description, Activities
    articles?: any[]
    description?: {
        description1?: string
        description2?: string
        description3?: string
        description3_link?: string
    }
    activities?: Array<{
        link?: string
        image?: string
        title?: string
        activity?: string
    }>
    
    // People/Recommendations
    people_also_viewed?: any[]
    similar_profiles?: any[]
    recommendations?: any[]
    
    // Other fields
    publications?: any[]
    courses?: any[]
    projects?: any[]
    awards?: any[]
    organizations?: any[]
    score?: any[]
}

/**
 * Format LinkedIn profile data into a clean string for LLM evaluation
 * Updated to handle ScrapingDog's snake_case field names
 */
function formatLinkedInProfileForLLM(profile: LinkedInProfileData, url: string): string {
    const parts: string[] = []

    // Name and Headline - USE snake_case
    const fullName = profile.fullName || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    if (fullName) {
        parts.push(`**Name:** ${fullName}`)
    }
    
    if (profile.headline) {
        parts.push(`**Headline:** ${profile.headline}`)
    }

    // LinkedIn ID
    if (profile.public_identifier) {
        parts.push(`**LinkedIn ID:** ${profile.public_identifier}`)
    }

    // Location
    if (profile.location) {
        parts.push(`**Location:** ${profile.location}`)
    }

    // Connections and Followers
    if (profile.connections) {
        parts.push(`**Connections:** ${profile.connections}`)
    }
    if (profile.followers) {
        parts.push(`**Followers:** ${profile.followers}`)
    }

    // About/Summary - CHECK BOTH about and summary
    if (profile.about || profile.summary) {
        parts.push(`\n**About:**`)
        parts.push(profile.about || profile.summary || '')
    }

    // Description sections
    if (profile.description) {
        if (profile.description.description1) {
            parts.push(`\n**Additional Info:** ${profile.description.description1}`)
        }
        if (profile.description.description2) {
            parts.push(profile.description.description2)
        }
        if (profile.description.description3) {
            parts.push(profile.description.description3)
        }
    }

    // Experience - USE "experience" not "positions" and snake_case field names
    if (profile.experience && profile.experience.length > 0) {
        parts.push(`\n**Experience:**`)
        profile.experience.slice(0, 5).forEach(exp => {
            const title = exp.title || 'Position'
            const company = exp.company_name || 'Company'  // company_name not companyName
            const dates = [exp.start_date, exp.end_date || 'Present'].filter(Boolean).join(' - ')
            parts.push(`- ${title} at ${company}${dates ? ` (${dates})` : ''}`)
            if (exp.location) {
                parts.push(`  Location: ${exp.location}`)
            }
            if (exp.description) {
                const desc = exp.description.length > 200 
                    ? exp.description.substring(0, 200) + '...' 
                    : exp.description
                parts.push(`  ${desc}`)
            }
        })
    }

    // Education - USE "education" not "educations" and snake_case
    if (profile.education && profile.education.length > 0) {
        parts.push(`\n**Education:**`)
        profile.education.slice(0, 3).forEach(edu => {
            const school = edu.school_name || 'School'  // school_name not schoolName
            const degree = edu.degree || ''
            const field = edu.field_of_study || ''      // field_of_study not fieldOfStudy
            const dates = [edu.start_date, edu.end_date].filter(Boolean).join(' - ')
            parts.push(`- ${degree} ${field ? `in ${field}` : ''} from ${school}${dates ? ` (${dates})` : ''}`)
            if (edu.description) {
                parts.push(`  ${edu.description}`)
            }
        })
    }

    // Skills
    if (profile.skills && profile.skills.length > 0) {
        parts.push(`\n**Skills:**`)
        const skillNames = profile.skills.map(s => 
            typeof s === 'string' ? s : s.name
        ).filter(Boolean)
        parts.push(skillNames.slice(0, 20).join(', '))
    }

    // Languages
    if (profile.languages && profile.languages.length > 0) {
        parts.push(`\n**Languages:**`)
        profile.languages.forEach(lang => {
            parts.push(`- ${lang.name}${lang.proficiency ? ` (${lang.proficiency})` : ''}`)
        })
    }

    // Certifications
    if (profile.certification && profile.certification.length > 0) {
        parts.push(`\n**Certifications:**`)
        profile.certification.slice(0, 5).forEach(cert => {
            const certName = cert.certification || 'Certification'
            const company = cert.company_name || ''
            const issueDate = cert.issue_date || ''
            parts.push(`- ${certName}${company ? ` from ${company}` : ''}${issueDate ? ` (${issueDate})` : ''}`)
            if (cert.credential_id) {
                parts.push(`  Credential ID: ${cert.credential_id}`)
            }
        })
    }

    // Volunteering
    if (profile.volunteering && profile.volunteering.length > 0) {
        parts.push(`\n**Volunteering:**`)
        profile.volunteering.forEach(vol => {
            parts.push(`- ${vol.title || 'Volunteer'} at ${vol.organization || 'Organization'}`)
            if (vol.description) {
                parts.push(`  ${vol.description}`)
            }
        })
    }

    // Activities
    if (profile.activities && profile.activities.length > 0) {
        parts.push(`\n**Recent Activities:**`)
        profile.activities.slice(0, 5).forEach(activity => {
            if (activity.title) {
                parts.push(`- ${activity.title}`)
            }
            if (activity.activity) {
                parts.push(`  ${activity.activity}`)
            }
        })
    }

    // LinkedIn URL
    parts.push(`\n**LinkedIn Profile:** ${url}`)

    return parts.join('\n')
}

async function extractLinkedInContent(linkedinUrl: string): Promise<ExtractedUrlContent> {
    const result: ExtractedUrlContent = {
        url: linkedinUrl,
        type: 'linkedin',
        success: false,
        fetchedAt: new Date(),
    }

    try {
        console.log('[LinkedIn Extractor] Processing with ScrapingDog:', linkedinUrl)

        // Validate URL format
        if (!linkedinUrl.includes('linkedin.com/in/')) {
            result.error = 'Invalid LinkedIn URL format'
            return result
        }

        // Check if ScrapingDog API key is configured
        if (!SCRAPINGDOG_API_KEY) {
            console.warn('[LinkedIn Extractor] SCRAPINGDOG_API_KEY not configured, using fallback')
            result.content = {
                summary: `LinkedIn profile provided: ${linkedinUrl}`,
                highlights: ['LinkedIn profile URL provided - ScrapingDog API key not configured'],
                skills: [],
                projects: [],
                experience: [],
                rawText: `LinkedIn Profile: ${linkedinUrl}`,
            }
            result.success = true
            return result
        }

        console.log('[LinkedIn Extractor] Calling ScrapingDog API with full URL...')

        // Call ScrapingDog API for LinkedIn profile scraping
        // Note: Pass the FULL URL as 'id' parameter (not just the username)
        const response = await axios.get(SCRAPINGDOG_API_URL, {
            params: {
                api_key: SCRAPINGDOG_API_KEY,
                type: 'profile',
                id: linkedinUrl  // Pass full URL, not extracted username
            },
            timeout: 30000  // 30 second timeout to prevent hanging
        })

        if (response.status !== 200) {
            console.error('[LinkedIn Extractor] ScrapingDog API error:', response.status, response.statusText)
            result.error = `ScrapingDog API returned status ${response.status}`
            return result
        }

        // 🔥 CRITICAL FIX: ScrapingDog returns an ARRAY with the profile as first element!
        // Debug log the raw response structure
        console.log('[LinkedIn Extractor] 📦 Raw response type:', typeof response.data)
        console.log('[LinkedIn Extractor] 📦 Is array?:', Array.isArray(response.data))
        
        // Extract profile data - handle both array and object responses
        let profileData: LinkedInProfileData
        
        if (Array.isArray(response.data)) {
            // ScrapingDog returns: [{profile data}]
            console.log('[LinkedIn Extractor] 📦 Array length:', response.data.length)
            if (response.data.length === 0) {
                console.warn('[LinkedIn Extractor] ScrapingDog returned empty array')
                result.content = {
                    summary: `LinkedIn profile provided: ${linkedinUrl}`,
                    highlights: ['LinkedIn profile URL provided - scraper returned empty array'],
                    skills: [],
                    projects: [],
                    experience: [],
                    rawText: `LinkedIn Profile: ${linkedinUrl}`,
                }
                result.success = true
                return result
            }
            profileData = response.data[0] as LinkedInProfileData
            console.log('[LinkedIn Extractor] ✅ Extracted profile from array[0]')
        } else if (response.data && typeof response.data === 'object') {
            // Direct object response (fallback)
            profileData = response.data as LinkedInProfileData
            console.log('[LinkedIn Extractor] ✅ Using direct object response')
        } else {
            console.warn('[LinkedIn Extractor] ScrapingDog returned unexpected data type:', typeof response.data)
            result.content = {
                summary: `LinkedIn profile provided: ${linkedinUrl}`,
                highlights: ['LinkedIn profile URL provided - unexpected response format'],
                skills: [],
                projects: [],
                experience: [],
                rawText: `LinkedIn Profile: ${linkedinUrl}`,
            }
            result.success = true
            return result
        }

        if (!profileData) {
            console.warn('[LinkedIn Extractor] ScrapingDog returned no data')
            result.content = {
                summary: `LinkedIn profile provided: ${linkedinUrl}`,
                highlights: ['LinkedIn profile URL provided - scraper returned no data'],
                skills: [],
                projects: [],
                experience: [],
                rawText: `LinkedIn Profile: ${linkedinUrl}`,
            }
            result.success = true
            return result
        }

        // Debug log what we actually received
        console.log('[LinkedIn Extractor] 📦 Profile data keys:', Object.keys(profileData).slice(0, 15))
        console.log('[LinkedIn Extractor] 📦 Sample data:', {
            fullName: profileData.fullName,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            location: profileData.location,
            connections: profileData.connections,
            experienceCount: profileData.experience?.length || 0
        })

        console.log('[LinkedIn Extractor] Successfully extracted LinkedIn profile data')

        // More lenient validation - if we have ANY profile information, it's useful
        // Fixed: Use .length > 0 instead of truthy check on trimmed strings
        const hasName = !!(profileData.fullName || profileData.first_name || profileData.last_name)
        const hasLocation = !!(profileData.location && typeof profileData.location === 'string' && profileData.location.trim().length > 0)
        const hasHeadline = !!(profileData.headline && typeof profileData.headline === 'string' && profileData.headline.trim().length > 0)
        const hasConnections = !!(profileData.connections && profileData.connections.length > 0)
        const hasExperience = !!(profileData.experience && Array.isArray(profileData.experience) && profileData.experience.length > 0)
        const hasEducation = !!(profileData.education && Array.isArray(profileData.education) && profileData.education.length > 0)
        const hasSkills = !!(profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0)
        const hasAbout = !!(profileData.about && typeof profileData.about === 'string' && profileData.about.trim().length > 0)
        const hasCertifications = !!(profileData.certification && Array.isArray(profileData.certification) && profileData.certification.length > 0)

        console.log('[LinkedIn Extractor] 🔍 Data validation:', {
            hasName,
            hasLocation,
            hasHeadline,
            hasConnections,
            hasExperience,
            hasEducation,
            hasSkills,
            hasAbout,
            hasCertifications
        })

        // Accept if we have at least name OR location OR connections OR any content
        const hasUsefulData = hasName || hasLocation || hasHeadline || hasConnections || 
                              hasExperience || hasEducation || hasSkills || hasAbout || hasCertifications

        console.log('[LinkedIn Extractor] ✅ Has useful data:', hasUsefulData)

        if (!hasUsefulData) {
            console.warn('[LinkedIn Extractor] ⚠️ LinkedIn returned empty data - profile may be private or incomplete')
            result.content = {
                summary: `LinkedIn profile provided: ${linkedinUrl} (Profile appears to be private or empty)`,
                highlights: ['LinkedIn profile URL provided - scraper returned no useful data (profile may be private)'],
                skills: [],
                projects: [],
                experience: [],
                rawText: `LinkedIn Profile: ${linkedinUrl} - No data extracted (likely private profile)`,
            }
            result.success = true // Still mark as success so evaluation continues
            return result
        }

        // Format the profile data for LLM
        const formattedProfile = formatLinkedInProfileForLLM(profileData, linkedinUrl)

        // Extract skills as array
        const skills: string[] = []
        if (profileData.skills) {
            for (const skill of profileData.skills) {
                const skillName = typeof skill === 'string' ? skill : skill.name
                if (skillName) skills.push(skillName)
            }
        }

        // Extract experience as array of strings - USE CORRECT FIELD NAMES
        const experience: string[] = []
        if (profileData.experience) {  // Changed from positions
            for (const position of profileData.experience.slice(0, 5)) {
                const expStr = `${position.title || 'Position'} at ${position.company_name || 'Company'}`  // company_name
                experience.push(expStr)
            }
        }

        // Build highlights - USE CORRECT FIELD NAMES
        const highlights: string[] = []
        const fullName = profileData.fullName || [profileData.first_name, profileData.last_name].filter(Boolean).join(' ')
        if (fullName) highlights.push(`Name: ${fullName}`)
        if (profileData.headline) highlights.push(profileData.headline)
        if (profileData.experience?.length) {  // Changed from positions
            highlights.push(`${profileData.experience.length} work experience(s)`)
        }
        if (profileData.education?.length) {   // Changed from educations
            highlights.push(`${profileData.education.length} education record(s)`)
        }
        if (skills.length > 0) {
            highlights.push(`${skills.length} skills listed`)
        }
        if (profileData.certification?.length) {  // Add certification count
            highlights.push(`${profileData.certification.length} certification(s)`)
        }

        // Build summary
        let summary = ''
        if (fullName && profileData.headline) {
            summary = `${fullName} - ${profileData.headline}`
        } else if (profileData.summary) {
            summary = profileData.summary.substring(0, 200) + (profileData.summary.length > 200 ? '...' : '')
        } else {
            summary = `LinkedIn profile: ${linkedinUrl}`
        }

        result.content = {
            summary,
            highlights,
            skills: skills.slice(0, 20),
            projects: [], // LinkedIn doesn't have projects in the traditional sense
            experience,
            rawText: formattedProfile, // This is the key - formatted content for LLM
        }
        result.success = true

        console.log('[LinkedIn Extractor] Extraction complete:')
        console.log(`  - Name: ${fullName || 'N/A'}`)
        console.log(`  - Skills: ${skills.length}`)
        console.log(`  - Experience: ${experience.length}`)

    } catch (error) {
        console.error('[LinkedIn Extractor] ScrapingDog error:', error)
        
        // Graceful fallback - return the URL as reference
        result.error = error instanceof Error ? error.message : 'Unknown Apify error'
        result.content = {
            summary: `LinkedIn profile provided: ${linkedinUrl}`,
            highlights: ['LinkedIn profile URL provided - extraction failed, manual review recommended'],
            skills: [],
            projects: [],
            experience: [],
            rawText: `LinkedIn Profile: ${linkedinUrl}\n\nNote: Automated extraction failed. Please review manually.`,
        }
        result.success = true // Partial success - we have the URL for reference
    }

    return result
}

// ============================================================================
// GitHub Extraction
// ============================================================================

async function extractGitHubContent(githubUrl: string): Promise<ExtractedUrlContent> {
    const result: ExtractedUrlContent = {
        url: githubUrl,
        type: 'github',
        success: false,
        fetchedAt: new Date(),
    }

    try {
        console.log('[GitHub Extractor] Processing:', githubUrl)

        // Extract username from URL
        const usernameMatch = githubUrl.match(/github\.com\/([^\/\?]+)/i)
        if (!usernameMatch) {
            result.error = 'Invalid GitHub URL format'
            return result
        }

        const username = usernameMatch[1]
        console.log('[GitHub Extractor] Username:', username)

        // Fetch user profile via GitHub API (no auth needed for public data)
        // Add small delay between GitHub API calls
        const userResponse = await safeFetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SmartRecruit-AI',
            },
        })

        if (!userResponse.ok) {
            result.error = `GitHub API error: ${userResponse.status}`
            return result
        }

        const userData = JSON.parse(userResponse.text)

        // Small delay before next API call
        await new Promise(resolve => setTimeout(resolve, 500))

        const reposResponse = await safeFetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SmartRecruit-AI',
            },
        })

        const reposData = reposResponse.ok ? JSON.parse(reposResponse.text) : []

        // Extract languages from repos
        const languages = new Set<string>()
        const projects: ProjectInfo[] = []

        for (const repo of reposData.slice(0, 10)) {
            if (repo.language) {
                languages.add(repo.language)
            }
            
            // Skip additional language fetches to reduce API calls
            // Use the primary language from repo data
            
            projects.push({
                name: repo.name,
                description: repo.description || 'No description',
                technologies: repo.language ? [repo.language] : [],
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
            })
        }

        // Build highlights
        const highlights: string[] = []
        if (userData.public_repos > 0) {
            highlights.push(`${userData.public_repos} public repositories`)
        }
        if (userData.followers > 0) {
            highlights.push(`${userData.followers} followers on GitHub`)
        }
        
        const totalStars = projects.reduce((sum, p) => sum + (p.stars || 0), 0)
        if (totalStars > 0) {
            highlights.push(`${totalStars} total stars across repositories`)
        }

        // Get pinned/notable projects
        const notableProjects = projects.filter(p => (p.stars || 0) > 0 || (p.forks || 0) > 0)
        if (notableProjects.length > 0) {
            highlights.push(`Notable projects: ${notableProjects.slice(0, 3).map(p => p.name).join(', ')}`)
        }

        result.content = {
            summary: userData.bio || `GitHub developer with ${userData.public_repos} repositories`,
            highlights,
            skills: Array.from(languages),
            projects,
            experience: [
                userData.company ? `Works at ${userData.company}` : '',
                userData.location ? `Located in ${userData.location}` : '',
                userData.hireable ? 'Open to opportunities' : '',
            ].filter(Boolean),
        }
        result.success = true

        console.log('[GitHub Extractor] Successfully extracted:')
        console.log(`  - Languages: ${languages.size}`)
        console.log(`  - Projects: ${projects.length}`)

    } catch (error) {
        console.error('[GitHub Extractor] Error:', error)
        result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
}

// ============================================================================
// Portfolio/Website Extraction
// ============================================================================

async function extractPortfolioContent(portfolioUrl: string): Promise<ExtractedUrlContent> {
    const result: ExtractedUrlContent = {
        url: portfolioUrl,
        type: 'portfolio',
        success: false,
        fetchedAt: new Date(),
    }

    try {
        console.log('[Portfolio Extractor] Processing:', portfolioUrl)

        // Check if this is actually a GitHub URL
        if (portfolioUrl.includes('github.com')) {
            return extractGitHubContent(portfolioUrl)
        }

        const response = await safeFetch(portfolioUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartRecruit/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        })

        if (!response.ok) {
            result.error = response.error || `Failed to fetch portfolio: ${response.status}`
            return result
        }

        // First try basic extraction with cheerio
        const basicExtraction = extractBasicInfoFromHtml(response.text, 'portfolio')
        
        // Use Gemini for deeper analysis if we have substantial content
        if (response.text.length > 500) {
            await waitForRateLimit()
            const extracted = await extractWithGemini(response.text, 'portfolio', portfolioUrl)
            
            if (extracted) {
                result.content = extracted
                result.success = true
                return result
            }
        }

        // Fallback to basic extraction
        if (basicExtraction) {
            result.content = basicExtraction
            result.success = true
        } else {
            result.error = 'Failed to parse portfolio content'
        }

    } catch (error) {
        console.error('[Portfolio Extractor] Error:', error)
        result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
}

// ============================================================================
// Behance Extraction
// ============================================================================

async function extractBehanceContent(behanceUrl: string): Promise<ExtractedUrlContent> {
    const result: ExtractedUrlContent = {
        url: behanceUrl,
        type: 'behance',
        success: false,
        fetchedAt: new Date(),
    }

    try {
        console.log('[Behance Extractor] Processing:', behanceUrl)

        if (!behanceUrl.includes('behance.net')) {
            result.error = 'Invalid Behance URL format'
            return result
        }

        const response = await safeFetch(behanceUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SmartRecruit/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        })

        if (!response.ok) {
            result.error = response.error || `Failed to fetch Behance profile: ${response.status}`
            return result
        }

        // First try basic extraction with cheerio
        const basicExtraction = extractBasicInfoFromHtml(response.text, 'behance')
        
        // Use Gemini for deeper analysis if we have substantial content
        if (response.text.length > 500) {
            await waitForRateLimit()
            const extracted = await extractWithGemini(response.text, 'behance', behanceUrl)
            
            if (extracted) {
                result.content = extracted
                result.success = true
                return result
            }
        }

        // Fallback to basic extraction
        if (basicExtraction) {
            result.content = basicExtraction
            result.success = true
        } else {
            result.error = 'Failed to parse Behance content'
        }

    } catch (error) {
        console.error('[Behance Extractor] Error:', error)
        result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
}

// ============================================================================
// Cheerio-Based Basic HTML Extraction (No API needed)
// ============================================================================

function extractBasicInfoFromHtml(
    html: string,
    sourceType: 'linkedin' | 'portfolio' | 'behance'
): ExtractedUrlContent['content'] | null {
    try {
        const $ = cheerio.load(html)

        // Remove script and style elements
        $('script, style, noscript').remove()

        // Extract text content
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

        // Extract meta description
        const metaDescription = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content') || ''

        // Extract title
        const pageTitle = $('title').text() || $('h1').first().text() || ''

        // Common skill keywords to look for
        const commonSkills = [
            'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Vue', 'Angular',
            'Node.js', 'Express', 'Django', 'Flask', 'Ruby', 'Rails', 'PHP', 'Laravel',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
            'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST',
            'HTML', 'CSS', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap',
            'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InDesign',
            'UI/UX', 'Product Design', 'Graphic Design', 'Motion Design',
            'Agile', 'Scrum', 'Project Management', 'Team Lead',
            'Machine Learning', 'AI', 'Data Science', 'Analytics',
            'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin',
            'C#', '.NET', 'C++', 'Go', 'Rust', 'Scala',
        ]

        // Find skills mentioned in the content
        const foundSkills: string[] = []
        const textLower = bodyText.toLowerCase()
        
        for (const skill of commonSkills) {
            if (textLower.includes(skill.toLowerCase())) {
                foundSkills.push(skill)
            }
        }

        // Extract links that might be projects
        const projectLinks: { name: string; url: string }[] = []
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            
            if (text && text.length > 2 && text.length < 50 && 
                !href.startsWith('#') && 
                !href.includes('linkedin.com') &&
                !href.includes('facebook.com') &&
                !href.includes('twitter.com')) {
                projectLinks.push({ name: text, url: href })
            }
        })

        // Build content
        const content: ExtractedUrlContent['content'] = {
            summary: metaDescription || pageTitle || `${sourceType} profile`,
            highlights: [],
            skills: foundSkills.slice(0, 15),
            projects: projectLinks.slice(0, 5).map(p => ({
                name: p.name,
                description: '',
                technologies: [],
                url: p.url,
            })),
            experience: [],
        }

        // Add some highlights based on content
        if (pageTitle) {
            content.highlights.push(pageTitle)
        }

        return content

    } catch (error) {
        console.error('[Basic Extractor] Cheerio error:', error)
        return null
    }
}

// ============================================================================
// Gemini-Based Content Extraction (with rate limiting)
// ============================================================================

async function extractWithGemini(
    html: string,
    sourceType: 'linkedin' | 'portfolio' | 'behance',
    url: string
): Promise<ExtractedUrlContent['content'] | null> {
    try {
        const googleKey = process.env.GOOGLE_API_KEY
        if (!googleKey) {
            console.error('[URL Extractor] GOOGLE_API_KEY not configured')
            return null
        }

        const genAI = new GoogleGenerativeAI(googleKey)
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

        // Use cheerio to extract clean text (reduces token usage)
        const $ = cheerio.load(html)
        $('script, style, noscript, nav, footer, header').remove()
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000)

        const sourceInstructions = {
            linkedin: 'This is a LinkedIn profile page. Extract professional information, work history, skills, and endorsements.',
            portfolio: 'This is a personal portfolio website. Extract projects, skills, work samples, and professional achievements.',
            behance: 'This is a Behance creative portfolio. Extract design projects, tools used, creative skills, and project descriptions.',
        }

        const prompt = `You are an expert at extracting professional information from web content.
${sourceInstructions[sourceType]}

**URL:** ${url}

**Page Content:**
${cleanText}

**Extract and return JSON with this structure:**
{
    "summary": "<2-3 sentence professional summary based on the content>",
    "highlights": [
        "<key achievement or highlight 1>",
        "<key achievement or highlight 2>",
        "<key achievement or highlight 3>"
    ],
    "skills": [
        "<skill 1>",
        "<skill 2>",
        "<skill 3>"
    ],
    "projects": [
        {
            "name": "<project name>",
            "description": "<brief description>",
            "technologies": ["<tech 1>", "<tech 2>"]
        }
    ],
    "experience": [
        "<relevant experience or role 1>",
        "<relevant experience or role 2>"
    ]
}

**Guidelines:**
- Extract ONLY factual information from the content
- Focus on professional skills, projects, and achievements
- Include all technologies, tools, and frameworks mentioned
- If information is not available, use empty arrays []
- Maximum 10 items per array
- Be concise but informative

Return ONLY valid JSON, no additional text.`

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
        let parsedData
        try {
            parsedData = JSON.parse(responseText)
        } catch (parseError) {
            console.error('[URL Extractor] JSON Parse Error:', parseError)
            console.error('[URL Extractor] Problematic JSON (first 500 chars):', responseText.substring(0, 500))
            
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
                console.log('[URL Extractor] Successfully parsed JSON after fixes')
            } catch (secondError) {
                console.error('[URL Extractor] Still failed after fixes:', secondError)
                throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
            }
        }

        return {
            summary: parsedData.summary || '',
            highlights: parsedData.highlights || [],
            skills: parsedData.skills || [],
            projects: (parsedData.projects || []).map((p: Record<string, unknown>) => ({
                name: String(p.name || ''),
                description: String(p.description || ''),
                technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
            })),
            experience: parsedData.experience || [],
        }

    } catch (error) {
        // Handle rate limiting specifically
        if (error instanceof Error && error.message.includes('429')) {
            console.warn('[URL Extractor] Rate limited by Gemini API, using basic extraction')
            return null
        }
        console.error('[URL Extractor] Gemini extraction error:', error)
        return null
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateCombinedSummary(extractedUrls: ExtractedUrlContent[]): string {
    const summaries: string[] = []

    for (const extracted of extractedUrls) {
        if (extracted.success && extracted.content?.summary) {
            const typeLabel = {
                linkedin: '**LinkedIn**',
                github: '**GitHub**',
                portfolio: '**Portfolio**',
                behance: '**Behance**',
                other: '**Other**',
            }[extracted.type]

            summaries.push(`${typeLabel}: ${extracted.content.summary}`)
        }
    }

    return summaries.length > 0 
        ? summaries.join('\n\n') 
        : 'No content could be extracted from provided URLs.'
}

/**
 * Detect if a URL is a GitHub URL and extract it from portfolio URL if needed
 */
export function detectGitHubUrl(urls: { portfolioUrl?: string; linkedinUrl?: string }): string | undefined {
    // Check if portfolio URL is actually GitHub
    if (urls.portfolioUrl?.includes('github.com')) {
        return urls.portfolioUrl
    }
    return undefined
}

/**
 * Format extracted content for AI evaluation context
 */
export function formatExtractedContentForEvaluation(result: UrlExtractionResult): string {
    if (!result.success || result.extractedUrls.length === 0) {
        return 'No external profile content available.'
    }

    let formatted = '## External Profiles & Online Presence\n\n'

    // Add detailed LinkedIn profile data if available (from Apify)
    const linkedinData = result.extractedUrls.find(u => u.type === 'linkedin' && u.success && u.content?.rawText)
    if (linkedinData?.content?.rawText) {
        formatted += `### LinkedIn Profile (Verified Data)\n`
        formatted += linkedinData.content.rawText + '\n\n'
    }

    // Add other profile summaries
    const otherSummaries = result.extractedUrls
        .filter(u => u.type !== 'linkedin' && u.success && u.content?.summary)
        .map(u => {
            const typeLabels: Record<string, string> = {
                linkedin: '**LinkedIn**',
                github: '**GitHub**',
                portfolio: '**Portfolio**',
                behance: '**Behance**',
                other: '**Other**',
            }
            const typeLabel = typeLabels[u.type] || '**Profile**'
            return `${typeLabel}: ${u.content!.summary}`
        })
    
    if (otherSummaries.length > 0) {
        formatted += otherSummaries.join('\n\n') + '\n\n'
    }

    // Add skills discovered
    if (result.allSkills.length > 0) {
        formatted += `### Skills from Online Profiles\n`
        formatted += result.allSkills.join(', ') + '\n\n'
    }

    // Add projects
    if (result.totalProjectsFound > 0) {
        formatted += `### Projects Found (${result.totalProjectsFound} total)\n`
        
        for (const extracted of result.extractedUrls) {
            if (extracted.success && extracted.content?.projects.length) {
                for (const project of extracted.content.projects.slice(0, 5)) {
                    formatted += `- **${project.name}**: ${project.description}`
                    if (project.technologies.length > 0) {
                        formatted += ` (${project.technologies.join(', ')})`
                    }
                    if (project.stars && project.stars > 0) {
                        formatted += ` ⭐${project.stars}`
                    }
                    formatted += '\n'
                }
            }
        }
        formatted += '\n'
    }

    // Add highlights (excluding LinkedIn which is already detailed above)
    const allHighlights: string[] = []
    for (const extracted of result.extractedUrls) {
        if (extracted.type !== 'linkedin' && extracted.success && extracted.content?.highlights) {
            allHighlights.push(...extracted.content.highlights)
        }
    }
    
    if (allHighlights.length > 0) {
        formatted += `### Key Highlights\n`
        for (const highlight of allHighlights.slice(0, 10)) {
            formatted += `- ${highlight}\n`
        }
    }

    return formatted
}

export default {
    extractUrlsContent,
    formatExtractedContentForEvaluation,
    detectGitHubUrl,
}
