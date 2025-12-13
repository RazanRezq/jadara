import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI

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

const users = [
    {
        email: 'superadmin@goielts.com',
        password: 'superadmin123',
        name: 'Super Admin',
        role: 'superadmin',
    },
    {
        email: 'admin@goielts.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
    },
    {
        email: 'reviewer@goielts.com',
        password: 'reviewer123',
        name: 'Content Reviewer',
        role: 'reviewer',
    },
]

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDB')

        for (const userData of users) {
            const existingUser = await User.findOne({ email: userData.email })

            if (existingUser) {
                console.log(`User ${userData.email} already exists, skipping...`)
                continue
            }

            const salt = await bcrypt.genSalt(12)
            const hashedPassword = await bcrypt.hash(userData.password, salt)

            await User.create({
                ...userData,
                password: hashedPassword,
            })

            console.log(`Created user: ${userData.email} (${userData.role})`)
        }

        console.log('\n✅ Seed completed successfully!')
        console.log('\nTest credentials:')
        console.log('- Super Admin: superadmin@goielts.com / superadmin123')
        console.log('- Admin: admin@goielts.com / admin123')
        console.log('- Reviewer: reviewer@goielts.com / reviewer123')
    } catch (error) {
        console.error('Seed error:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seed()

