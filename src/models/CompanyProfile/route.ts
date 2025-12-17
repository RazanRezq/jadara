import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import { z } from 'zod'
import CompanyProfile, { ICompanyProfile } from './companyProfileSchema'

// Validation schema
const companyProfileSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    industry: z.string().min(1, 'Industry is required'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    website: z
        .union([
            z.string().url('Invalid URL format'),
            z.literal(''),
        ])
        .optional()
        .default(''),
})

const app = new Hono()

// Get company profile (accessible to all authenticated users)
app.get('/profile', async (c) => {
    try {
        await dbConnect()

        let profile = await CompanyProfile.findOne()

        // If no profile exists, return default empty values
        if (!profile) {
            return c.json({
                success: true,
                profile: {
                    companyName: '',
                    industry: '',
                    bio: '',
                    website: '',
                },
            })
        }

        return c.json({
            success: true,
            profile: {
                _id: profile._id,
                companyName: profile.companyName,
                industry: profile.industry,
                bio: profile.bio,
                website: profile.website,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
            },
        })
    } catch (error) {
        return c.json(
            {
                success: false,
                error: 'Failed to fetch company profile',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

// Create or update company profile (admin/superadmin only)
app.post('/profile', async (c) => {
    try {
        await dbConnect()
        const data = await c.req.json()
        const userRole = c.req.query('userRole')

        console.log('[CompanyProfile] Update request - userRole:', userRole, 'data keys:', Object.keys(data))

        // Check permissions - only admin or superadmin can update
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            console.warn('[CompanyProfile] Unauthorized access attempt - role:', userRole)
            return c.json(
                {
                    success: false,
                    error: 'Unauthorized. Only admins can update company profile.',
                },
                403
            )
        }

        // Validate data
        let validatedData
        try {
            validatedData = companyProfileSchema.parse(data)
            console.log('[CompanyProfile] Validation passed:', Object.keys(validatedData))
        } catch (validationError) {
            console.error('[CompanyProfile] Validation failed:', validationError)
            throw validationError
        }

        // Check if profile exists
        let profile = await CompanyProfile.findOne()

        if (profile) {
            // Update existing profile
            console.log('[CompanyProfile] Updating existing profile:', profile._id)
            profile.companyName = validatedData.companyName
            profile.industry = validatedData.industry
            profile.bio = validatedData.bio
            profile.website = validatedData.website || ''
            await profile.save()
            console.log('[CompanyProfile] Profile updated successfully')
        } else {
            // Create new profile
            console.log('[CompanyProfile] Creating new profile')
            profile = await CompanyProfile.create(validatedData)
            console.log('[CompanyProfile] Profile created successfully:', profile._id)
        }

        const responseData = {
            success: true,
            message: 'Company profile updated successfully',
            profile: {
                _id: profile._id.toString(),
                companyName: profile.companyName,
                industry: profile.industry,
                bio: profile.bio,
                website: profile.website,
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
            },
        }

        console.log('[CompanyProfile] Returning success response')
        return c.json(responseData, 200)
    } catch (error) {
        console.error('[CompanyProfile] Error updating profile:', error)
        
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
            console.error('[CompanyProfile] Validation errors:', errorMessages)
            return c.json(
                {
                    success: false,
                    error: `Validation error: ${errorMessages}`,
                    details: error.issues,
                },
                400
            )
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('[CompanyProfile] Unexpected error:', errorMessage)
        
        return c.json(
            {
                success: false,
                error: `Failed to update company profile: ${errorMessage}`,
                details: errorMessage,
            },
            500
        )
    }
})

export default app


