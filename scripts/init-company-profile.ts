import mongoose from 'mongoose'
import CompanyProfile from '../src/models/CompanyProfile/companyProfileSchema'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI environment variable')
    process.exit(1)
}

const companyData = {
    companyName: 'Jadara Recruitment Solutions',
    industry: 'Human Resources & Talent Acquisition',
    bio: 'Jadara (جدارة) is a pioneering provider of intelligent recruitment solutions in the MENA region. We leverage cutting-edge AI technology combined with deep HR expertise to help organizations discover and hire exceptional talent efficiently and fairly. Our comprehensive platform supports blind hiring practices, multilingual assessments in Arabic and English, and AI-powered candidate evaluation. Founded on the principles of competence (جدارة) and fairness, we enable companies to make data-driven hiring decisions while reducing bias. Our solutions include smart job creation, automated candidate screening, collaborative evaluation workflows, and real-time recruitment analytics. Whether you\'re hiring for technical roles, management positions, or specialized talent, Jadara provides the tools and insights needed to build high-performing teams.',
    website: 'https://jadara.com',
}

async function initCompanyProfile() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDB\n')

        // Check if profile already exists
        const existingProfile = await CompanyProfile.findOne()

        if (existingProfile) {
            console.log('📋 Company profile already exists:')
            console.log(`   Company: ${existingProfile.companyName}`)
            console.log(`   Industry: ${existingProfile.industry}`)
            console.log(`   Website: ${existingProfile.website}`)
            console.log('\n⚠️  To update, please use the admin dashboard or delete existing profile first.')
        } else {
            const profile = await CompanyProfile.create(companyData)
            console.log('✅ Company profile created successfully!\n')
            console.log('📋 Profile Details:')
            console.log(`   Company Name: ${profile.companyName}`)
            console.log(`   Industry: ${profile.industry}`)
            console.log(`   Website: ${profile.website}`)
            console.log(`   Bio: ${profile.bio.substring(0, 100)}...`)
            console.log('\n💡 You can edit this profile in Settings > Company (admin access required)')
        }

    } catch (error) {
        console.error('❌ Error initializing company profile:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

initCompanyProfile()
