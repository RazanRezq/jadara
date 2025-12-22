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
const SCRAPINGDOG_API_KEY = process.env.SCRAPINGDOG_API_KEY || '69490bf1d46e913011598893'
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
 * LinkedIn profile data interface from Apify scraper
 */
interface LinkedInProfileData {
    firstName?: string
    lastName?: string
    headline?: string
    summary?: string
    location?: string
    positions?: Array<{
        title?: string
        companyName?: string
        description?: string
        startDate?: string
        endDate?: string
        location?: string
    }>
    educations?: Array<{
        schoolName?: string
        degree?: string
        fieldOfStudy?: string
        startDate?: string
        endDate?: string
    }>
    skills?: Array<{
        name?: string
    }> | string[]
    languages?: Array<{
        name?: string
        proficiency?: string
    }>
    certifications?: Array<{
        name?: string
        authority?: string
    }>
}

/**
 * Format LinkedIn profile data into a clean string for LLM evaluation
 */
function formatLinkedInProfileForLLM(profile: LinkedInProfileData, url: string): string {
    const parts: string[] = []

    // Name and Headline
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    if (fullName) {
        parts.push(`**Name:** ${fullName}`)
    }
    if (profile.headline) {
        parts.push(`**Headline:** ${profile.headline}`)
    }
    if (profile.location) {
        parts.push(`**Location:** ${profile.location}`)
    }

    // Summary/About
    if (profile.summary) {
        parts.push(`\n**Summary:**\n${profile.summary}`)
    }

    // Experience
    if (profile.positions && profile.positions.length > 0) {
        parts.push('\n**Experience:**')
        for (const position of profile.positions.slice(0, 5)) {
            const dateRange = [position.startDate, position.endDate || 'Present'].filter(Boolean).join(' - ')
            parts.push(`- ${position.title || 'Position'} at ${position.companyName || 'Company'}${dateRange ? ` (${dateRange})` : ''}`)
            if (position.description) {
                // Truncate long descriptions
                const desc = position.description.length > 200 
                    ? position.description.substring(0, 200) + '...' 
                    : position.description
                parts.push(`  ${desc}`)
            }
        }
    }

    // Education
    if (profile.educations && profile.educations.length > 0) {
        parts.push('\n**Education:**')
        for (const edu of profile.educations.slice(0, 3)) {
            const degree = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ')
            parts.push(`- ${degree || 'Degree'} from ${edu.schoolName || 'Institution'}`)
        }
    }

    // Skills
    if (profile.skills && profile.skills.length > 0) {
        const skillNames = profile.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
        if (skillNames.length > 0) {
            parts.push(`\n**Skills:** ${skillNames.slice(0, 20).join(', ')}`)
        }
    }

    // Certifications
    if (profile.certifications && profile.certifications.length > 0) {
        parts.push('\n**Certifications:**')
        for (const cert of profile.certifications.slice(0, 5)) {
            parts.push(`- ${cert.name || 'Certification'}${cert.authority ? ` (${cert.authority})` : ''}`)
        }
    }

    // Languages
    if (profile.languages && profile.languages.length > 0) {
        const langList = profile.languages.map(l => 
            l.proficiency ? `${l.name} (${l.proficiency})` : l.name
        ).filter(Boolean)
        if (langList.length > 0) {
            parts.push(`\n**Languages:** ${langList.join(', ')}`)
        }
    }

    parts.push(`\n**Profile URL:** ${url}`)

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

        // Extract LinkedIn profile ID from URL
        // Example: https://www.linkedin.com/in/williamhgates -> williamhgates
        const profileIdMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/)
        if (!profileIdMatch || !profileIdMatch[1]) {
            result.error = 'Could not extract LinkedIn profile ID from URL'
            return result
        }

        const profileId = profileIdMatch[1]
        console.log('[LinkedIn Extractor] Extracted profile ID:', profileId)

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

        console.log('[LinkedIn Extractor] Calling ScrapingDog API...')

        // Call ScrapingDog API for LinkedIn profile scraping
        const response = await axios.get(SCRAPINGDOG_API_URL, {
            params: {
                api_key: SCRAPINGDOG_API_KEY,
                id: profileId,
                type: 'profile',
                premium: 'true',
                webhook: 'false',
                fresh: 'false'
            },
            timeout: 120000 // 2 minute timeout
        })

        if (response.status !== 200) {
            console.error('[LinkedIn Extractor] ScrapingDog API error:', response.status, response.statusText)
            result.error = `ScrapingDog API returned status ${response.status}`
            return result
        }

        const profileData = response.data as LinkedInProfileData

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

        console.log('[LinkedIn Extractor] Successfully extracted LinkedIn profile data')

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

        // Extract experience as array of strings
        const experience: string[] = []
        if (profileData.positions) {
            for (const position of profileData.positions.slice(0, 5)) {
                const expStr = `${position.title || 'Position'} at ${position.companyName || 'Company'}`
                experience.push(expStr)
            }
        }

        // Build highlights
        const highlights: string[] = []
        const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ')
        if (fullName) highlights.push(`Name: ${fullName}`)
        if (profileData.headline) highlights.push(profileData.headline)
        if (profileData.positions?.length) {
            highlights.push(`${profileData.positions.length} work experience(s)`)
        }
        if (profileData.educations?.length) {
            highlights.push(`${profileData.educations.length} education record(s)`)
        }
        if (skills.length > 0) {
            highlights.push(`${skills.length} skills listed`)
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
        
        // Clean JSON response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const parsedData = JSON.parse(responseText)

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
