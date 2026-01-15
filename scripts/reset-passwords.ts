import mongoose from 'mongoose'
import User from '../src/models/Users/userSchema'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
    console.error('Please define MONGODB_URI environment variable')
    process.exit(1)
}

// Known passwords from seed script
const userPasswords: Record<string, string> = {
    'superadmin@jadara.com': 'superadmin123',
    'admin@jadara.com': 'admin123',
    'reviewer@jadara.com': 'reviewer123',
}

async function resetPasswords() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDB\n')

        for (const [email, password] of Object.entries(userPasswords)) {
            const user = await User.findOne({ email }).select('+password')

            if (!user) {
                console.log(`⚠️  User ${email} not found, skipping...`)
                continue
            }

            // Set new password (will be hashed by pre-save hook)
            user.password = password
            await user.save()

            console.log(`✅ Reset password for ${email} (${user.role})`)
        }

        console.log('\n✅ Password reset completed successfully!')
        console.log('\nYou can now log in with:')
        console.log('- Super Admin: superadmin@jadara.com / superadmin123')
        console.log('- Admin: admin@jadara.com / admin123')
        console.log('- Reviewer: reviewer@jadara.com / reviewer123')
    } catch (error) {
        console.error('❌ Password reset error:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

resetPasswords()












