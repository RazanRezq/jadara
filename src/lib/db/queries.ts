import dbConnect from '@/lib/mongodb'
import Review from '@/models/Reviews/reviewSchema'
import mongoose from 'mongoose'

/**
 * Get rating distribution for a specific reviewer
 * Returns count of candidates rated at each star level (1-5)
 */
export async function getRatingDistribution(reviewerId: string) {
    await dbConnect()

    const result = await Review.aggregate([
        {
            $match: {
                reviewerId: new mongoose.Types.ObjectId(reviewerId),
            },
        },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: -1 }, // Sort by rating descending (5, 4, 3, 2, 1)
        },
    ])

    // Transform result to ensure all star ratings are present (even if count is 0)
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
        const found = result.find((r) => r._id === rating)
        return {
            rating,
            count: found?.count || 0,
        }
    })

    const total = distribution.reduce((acc, item) => acc + item.count, 0)

    return {
        distribution,
        total,
    }
}
