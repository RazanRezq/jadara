import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI environment variable')
    process.exit(1)
}

// User schema for seeding
const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, enum: ['superadmin', 'admin', 'reviewer'], default: 'reviewer' },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
)

const User = mongoose.models.User || mongoose.model('User', userSchema)

// Demo user configuration
const DEMO_USER = {
    email: 'demo@jadara.app',
    password: 'demo123', // Must be at least 6 characters for validation
    name: 'Demo User',
    role: 'admin' as const, // Admin role so they can see most features
}

async function seedDemoUser() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('🔌 Connected to MongoDB')
        console.log('')

        // Check if demo user already exists
        const existingUser = await User.findOne({ email: DEMO_USER.email })

        if (existingUser) {
            console.log('⚠️  Demo user already exists, updating password...')
            
            // Update the password
            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(DEMO_USER.password, salt)
            
            existingUser.password = hashedPassword
            await existingUser.save()
            
            console.log('✅ Demo user password updated!')
            console.log(`   Email: ${DEMO_USER.email}`)
            console.log(`   Role: ${existingUser.role}`)
        } else {
            // Hash the password
            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(DEMO_USER.password, salt)

            // Create the demo user
            const newUser = await User.create({
                ...DEMO_USER,
                password: hashedPassword,
            })

            console.log('✅ Demo user created successfully!')
            console.log('')
            console.log('📋 Demo User Credentials:')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log(`   📧 Email:    ${DEMO_USER.email}`)
            console.log(`   🔑 Password: ${DEMO_USER.password}`)
            console.log(`   👤 Role:     ${DEMO_USER.role}`)
            console.log(`   🆔 User ID:  ${newUser._id}`)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }

        console.log('')
        console.log('🔒 Demo Mode Features:')
        console.log('   - Read-only access (no create/update/delete)')
        console.log('   - Demo badge shown in header')
        console.log('   - All destructive actions are blocked')
        console.log('')

    } catch (error) {
        console.error('❌ Error seeding demo user:', error)
    } finally {
        await mongoose.disconnect()
        console.log('📴 Disconnected from MongoDB')
        process.exit(0)
    }
}

seedDemoUser()
