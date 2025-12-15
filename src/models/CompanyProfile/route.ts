import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import { z } from 'zod'
import CompanyProfile, { ICompanyProfile } from './companyProfileSchema'

// Validation schema
const companyProfileSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    industry: z.string().min(1, 'Industry is required'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
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

// Create or update company profile (admin/super admin only)
app.post('/profile', async (c) => {
    try {
        await dbConnect()
        const data = await c.req.json()
        const userRole = c.req.query('userRole')

        // Check permissions - only admin or super admin can update
        if (userRole !== 'admin' && userRole !== 'super admin') {
            return c.json(
                {
                    success: false,
                    error: 'Unauthorized. Only admins can update company profile.',
                },
                403
            )
        }

        // Validate data
        const validatedData = companyProfileSchema.parse(data)

        // Check if profile exists
        let profile = await CompanyProfile.findOne()

        if (profile) {
            // Update existing profile
            profile.companyName = validatedData.companyName
            profile.industry = validatedData.industry
            profile.bio = validatedData.bio
            profile.website = validatedData.website || ''
            await profile.save()
        } else {
            // Create new profile
            profile = await CompanyProfile.create(validatedData)
        }

        return c.json({
            success: true,
            message: 'Company profile updated successfully',
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
        if (error instanceof z.ZodError) {
            return c.json(
                {
                    success: false,
                    error: 'Validation error',
                    details: error.errors,
                },
                400
            )
        }

        return c.json(
            {
                success: false,
                error: 'Failed to update company profile',
                details:
                    error instanceof Error ? error.message : 'Unknown error',
            },
            500
        )
    }
})

export default app


