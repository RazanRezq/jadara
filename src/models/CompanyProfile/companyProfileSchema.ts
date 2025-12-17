import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ICompanyProfile extends Document {
    _id: mongoose.Types.ObjectId
    companyName: string
    industry: string
    bio: string
    website: string
    createdAt: Date
    updatedAt: Date
}

const companyProfileSchema = new Schema<ICompanyProfile>(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        industry: {
            type: String,
            required: [true, 'Industry is required'],
            trim: true,
        },
        bio: {
            type: String,
            required: [true, 'Company bio is required'],
            trim: true,
        },
        website: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
)

// Singleton pattern - only allow one company profile
companyProfileSchema.pre('save', async function () {
    const Model = this.constructor as Model<ICompanyProfile>
    const count = await Model.countDocuments({
        _id: { $ne: this._id },
    })
    
    if (count > 0) {
        throw new Error('Only one company profile is allowed')
    }
})

const CompanyProfile: Model<ICompanyProfile> =
    mongoose.models.CompanyProfile ||
    mongoose.model<ICompanyProfile>('CompanyProfile', companyProfileSchema)

export default CompanyProfile


