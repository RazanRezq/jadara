import mongoose, { Schema, Document, Model } from 'mongoose'

export type Permission =
    // User Management
    | 'users.view'
    | 'users.create'
    | 'users.edit'
    | 'users.delete'
    | 'users.export'
    | 'users.import'
    // Job Management
    | 'jobs.view'
    | 'jobs.create'
    | 'jobs.edit'
    | 'jobs.delete'
    | 'jobs.publish'
    // Applicant Management
    | 'applicants.view'
    | 'applicants.edit'
    | 'applicants.delete'
    | 'applicants.export'
    // Evaluation
    | 'evaluations.view'
    | 'evaluations.create'
    | 'evaluations.edit'
    | 'evaluations.delete'
    // Questions
    | 'questions.view'
    | 'questions.create'
    | 'questions.edit'
    | 'questions.delete'
    // Company Settings
    | 'company.view'
    | 'company.edit'
    // System Settings
    | 'system.view'
    | 'system.edit'
    | 'system.logs'
    | 'system.sessions'
    // Audit Logs
    | 'audit.view'
    | 'audit.export'
    // Notifications
    | 'notifications.view'
    | 'notifications.manage'

export interface IPermissionSet extends Document {
    role: 'reviewer' | 'admin' | 'superadmin'
    displayName: {
        en: string
        ar: string
    }
    description: {
        en: string
        ar: string
    }
    permissions: Permission[]
    isCustom: boolean
    isActive: boolean
    createdBy?: mongoose.Types.ObjectId
    updatedBy?: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const PermissionSetSchema = new Schema<IPermissionSet>(
    {
        role: {
            type: String,
            enum: ['reviewer', 'admin', 'superadmin'],
            required: true,
            unique: true,
            index: true,
        },
        displayName: {
            en: {
                type: String,
                required: true,
            },
            ar: {
                type: String,
                required: true,
            },
        },
        description: {
            en: {
                type: String,
                required: true,
            },
            ar: {
                type: String,
                required: true,
            },
        },
        permissions: {
            type: [String],
            required: true,
            default: [],
        },
        isCustom: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        collection: 'permission_sets',
    }
)

// Indexes
PermissionSetSchema.index({ role: 1, isActive: 1 })

// Default permission sets
const defaultPermissionSets = {
    reviewer: {
        role: 'reviewer',
        displayName: {
            en: 'Reviewer',
            ar: 'مراجع',
        },
        description: {
            en: 'Can evaluate applicants and manage their assigned tasks',
            ar: 'يمكنه تقييم المتقدمين وإدارة المهام المخصصة له',
        },
        permissions: [
            'applicants.view',
            'evaluations.view',
            'evaluations.create',
            'evaluations.edit',
            'jobs.view',
            'questions.view',
            'notifications.view',
        ],
        isCustom: false,
        isActive: true,
    },
    admin: {
        role: 'admin',
        displayName: {
            en: 'Administrator',
            ar: 'مدير',
        },
        description: {
            en: 'Full access to jobs, applicants, and team management',
            ar: 'وصول كامل إلى الوظائف والمتقدمين وإدارة الفريق',
        },
        permissions: [
            'users.view',
            'users.create',
            'users.edit',
            'users.export',
            'users.import',
            'jobs.view',
            'jobs.create',
            'jobs.edit',
            'jobs.delete',
            'jobs.publish',
            'applicants.view',
            'applicants.edit',
            'applicants.delete',
            'applicants.export',
            'evaluations.view',
            'evaluations.create',
            'evaluations.edit',
            'evaluations.delete',
            'questions.view',
            'questions.create',
            'questions.edit',
            'questions.delete',
            'company.view',
            'company.edit',
            'notifications.view',
            'notifications.manage',
        ],
        isCustom: false,
        isActive: true,
    },
    superadmin: {
        role: 'superadmin',
        displayName: {
            en: 'Super Administrator',
            ar: 'مدير عام',
        },
        description: {
            en: 'Full system access with advanced settings and monitoring',
            ar: 'وصول كامل للنظام مع الإعدادات المتقدمة والمراقبة',
        },
        permissions: [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.export',
            'users.import',
            'jobs.view',
            'jobs.create',
            'jobs.edit',
            'jobs.delete',
            'jobs.publish',
            'applicants.view',
            'applicants.edit',
            'applicants.delete',
            'applicants.export',
            'evaluations.view',
            'evaluations.create',
            'evaluations.edit',
            'evaluations.delete',
            'questions.view',
            'questions.create',
            'questions.edit',
            'questions.delete',
            'company.view',
            'company.edit',
            'system.view',
            'system.edit',
            'system.logs',
            'system.sessions',
            'audit.view',
            'audit.export',
            'notifications.view',
            'notifications.manage',
        ],
        isCustom: false,
        isActive: true,
    },
}

// Static methods interface
interface IPermissionSetModel extends Model<IPermissionSet> {
    initializeDefaults(): Promise<void>
}

// Static method to initialize default permissions
PermissionSetSchema.statics.initializeDefaults = async function () {
    for (const [role, permissionSet] of Object.entries(defaultPermissionSets)) {
        const exists = await this.findOne({ role })
        if (!exists) {
            await this.create(permissionSet as any)
        }
    }
}

const PermissionSet = (mongoose.models.PermissionSet ||
    mongoose.model<IPermissionSet, IPermissionSetModel>(
        'PermissionSet',
        PermissionSetSchema
    )) as IPermissionSetModel

export default PermissionSet
