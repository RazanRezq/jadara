import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'superadmin' | 'admin' | 'reviewer'

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId
    email: string
    password: string
    name: string
    role: UserRole
    avatar?: string
    isActive: boolean
    lastLogin?: Date
    createdAt: Date
    updatedAt: Date
    comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password by default in queries
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },
        role: {
            type: String,
            enum: ['superadmin', 'admin', 'reviewer'],
            default: 'reviewer',
        },
        avatar: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

// Hash password before saving
userSchema.pre<IUser>('save', async function () {
    if (!this.isModified('password')) {
        return
    }

    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
})

// Compare password method
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password)
}

// Indexes for common queries
userSchema.index({ email: 1, isActive: 1 }) // For login queries
userSchema.index({ role: 1, isActive: 1 }) // For finding users by role
userSchema.index({ isActive: 1, createdAt: -1 }) // For listing active users

// Prevent model recompilation in development
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', userSchema)

export default User
