import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISystemConfig extends Document {
    // Email Configuration
    email: {
        provider: 'sendgrid' | 'resend' | 'aws-ses' | 'smtp'
        apiKey?: string
        fromEmail: string
        fromName: string
        replyTo?: string
        smtpHost?: string
        smtpPort?: number
        smtpUser?: string
        smtpPassword?: string
        enabled: boolean
    }

    // AI Configuration
    ai: {
        provider: 'google-gemini' | 'openai' | 'anthropic'
        apiKey?: string
        model: string
        temperature: number
        maxTokens: number
        enabled: boolean
        fallbackModel?: string
    }

    // Application Settings
    application: {
        siteName: string
        siteUrl: string
        maintenanceMode: boolean
        allowPublicRegistration: boolean
        defaultLanguage: 'en' | 'ar'
        timezone: string
        dateFormat: string
        timeFormat: string
    }

    // Security Settings
    security: {
        sessionTimeout: number // in minutes
        maxLoginAttempts: number
        lockoutDuration: number // in minutes
        passwordMinLength: number
        passwordRequireUppercase: boolean
        passwordRequireNumbers: boolean
        passwordRequireSpecialChars: boolean
        requireEmailVerification: boolean
        require2FA: boolean
        allowedDomains: string[] // Email domain whitelist
    }

    // File Storage Settings
    storage: {
        provider: 'digitalocean' | 'aws-s3' | 'local'
        region?: string
        bucket?: string
        accessKeyId?: string
        secretAccessKey?: string
        maxFileSize: number // in MB
        allowedFileTypes: string[]
    }

    // Notification Settings
    notifications: {
        enabled: boolean
        emailNotifications: boolean
        inAppNotifications: boolean
        slackWebhook?: string
        discordWebhook?: string
    }

    // Audit Log Settings
    auditLogs: {
        enabled: boolean
        retentionDays: number
        logLevel: 'all' | 'warnings' | 'errors-only'
    }

    // Feature Flags
    features: {
        enableVoiceRecording: boolean
        enableAIEvaluation: boolean
        enableInterviewScheduling: boolean
        enableOfferManagement: boolean
        enableVideoInterviews: boolean
    }

    // Timestamps
    lastUpdatedBy?: {
        userId: mongoose.Types.ObjectId
        email: string
        name: string
    }
    createdAt: Date
    updatedAt: Date
}

const SystemConfigSchema = new Schema<ISystemConfig>(
    {
        email: {
            provider: {
                type: String,
                enum: ['sendgrid', 'resend', 'aws-ses', 'smtp'],
                default: 'resend',
            },
            apiKey: String,
            fromEmail: {
                type: String,
                default: 'noreply@goielts.com',
            },
            fromName: {
                type: String,
                default: 'GoIELTS Recruitment',
            },
            replyTo: String,
            smtpHost: String,
            smtpPort: Number,
            smtpUser: String,
            smtpPassword: String,
            enabled: {
                type: Boolean,
                default: false,
            },
        },

        ai: {
            provider: {
                type: String,
                enum: ['google-gemini', 'openai', 'anthropic'],
                default: 'google-gemini',
            },
            apiKey: String,
            model: {
                type: String,
                default: 'gemini-2.0-flash-lite',
            },
            temperature: {
                type: Number,
                default: 0.7,
                min: 0,
                max: 2,
            },
            maxTokens: {
                type: Number,
                default: 8000,
            },
            enabled: {
                type: Boolean,
                default: true,
            },
            fallbackModel: String,
        },

        application: {
            siteName: {
                type: String,
                default: 'GoIELTS Recruitment',
            },
            siteUrl: {
                type: String,
                default: 'https://goielts.com',
            },
            maintenanceMode: {
                type: Boolean,
                default: false,
            },
            allowPublicRegistration: {
                type: Boolean,
                default: false,
            },
            defaultLanguage: {
                type: String,
                enum: ['en', 'ar'],
                default: 'ar',
            },
            timezone: {
                type: String,
                default: 'Asia/Riyadh',
            },
            dateFormat: {
                type: String,
                default: 'yyyy-MM-dd',
            },
            timeFormat: {
                type: String,
                default: 'HH:mm',
            },
        },

        security: {
            sessionTimeout: {
                type: Number,
                default: 10080, // 7 days in minutes
            },
            maxLoginAttempts: {
                type: Number,
                default: 5,
            },
            lockoutDuration: {
                type: Number,
                default: 30, // minutes
            },
            passwordMinLength: {
                type: Number,
                default: 8,
            },
            passwordRequireUppercase: {
                type: Boolean,
                default: true,
            },
            passwordRequireNumbers: {
                type: Boolean,
                default: true,
            },
            passwordRequireSpecialChars: {
                type: Boolean,
                default: false,
            },
            requireEmailVerification: {
                type: Boolean,
                default: false,
            },
            require2FA: {
                type: Boolean,
                default: false,
            },
            allowedDomains: {
                type: [String],
                default: [],
            },
        },

        storage: {
            provider: {
                type: String,
                enum: ['digitalocean', 'aws-s3', 'local'],
                default: 'digitalocean',
            },
            region: String,
            bucket: String,
            accessKeyId: String,
            secretAccessKey: String,
            maxFileSize: {
                type: Number,
                default: 10, // MB
            },
            allowedFileTypes: {
                type: [String],
                default: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'mp3', 'wav', 'm4a'],
            },
        },

        notifications: {
            enabled: {
                type: Boolean,
                default: true,
            },
            emailNotifications: {
                type: Boolean,
                default: false,
            },
            inAppNotifications: {
                type: Boolean,
                default: true,
            },
            slackWebhook: String,
            discordWebhook: String,
        },

        auditLogs: {
            enabled: {
                type: Boolean,
                default: true,
            },
            retentionDays: {
                type: Number,
                default: 90,
            },
            logLevel: {
                type: String,
                enum: ['all', 'warnings', 'errors-only'],
                default: 'all',
            },
        },

        features: {
            enableVoiceRecording: {
                type: Boolean,
                default: true,
            },
            enableAIEvaluation: {
                type: Boolean,
                default: true,
            },
            enableInterviewScheduling: {
                type: Boolean,
                default: false,
            },
            enableOfferManagement: {
                type: Boolean,
                default: false,
            },
            enableVideoInterviews: {
                type: Boolean,
                default: false,
            },
        },

        lastUpdatedBy: {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            email: String,
            name: String,
        },
    },
    {
        timestamps: true,
        collection: 'systemconfig',
    }
)

const SystemConfig: Model<ISystemConfig> =
    mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema)

export default SystemConfig
