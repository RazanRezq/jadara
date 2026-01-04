import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"
import Applicant from "@/models/Applicants/applicantSchema"
import Job from "@/models/Jobs/jobSchema"
import User from "@/models/Users/userSchema"
// Note: Evaluation import removed as it's no longer used in admin stats
import Review from "@/models/Reviews/reviewSchema"
import Interview from "@/models/Interviews/interviewSchema"
import Response from "@/models/Responses/responseSchema"
import { AdminView } from "./_components/admin-view"
import { ReviewerDashboardClient } from "@/components/dashboard/reviewer-dashboard-client"
import { SuperAdminView } from "./_components/super-admin-view"

// Helper function to get admin/recruiter stats
async function getAdminStats() {
    await dbConnect()

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Get today's start and tomorrow's end for upcoming interviews
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(now)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2)
    tomorrowEnd.setHours(0, 0, 0, 0)

    // Use Promise.all to run queries in parallel
    const [
        totalApplicants,
        totalApplicantsLastMonth,
        activeJobs,
        activeJobsLastMonth,
        totalHired,
        totalHiredLastMonth,
        upcomingInterviewsCount,
        upcomingInterviewsCountLastMonth,
        upcomingInterviewsData,
        actionCenterData,
        recentCandidatesData,
    ] = await Promise.all([
        // Total completed applicants (current)
        Applicant.countDocuments({ isComplete: true }),

        // Total completed applicants (last month for trend)
        Applicant.countDocuments({
            isComplete: true,
            submittedAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }
        }),

        // Active jobs count
        Job.countDocuments({ status: "active" }),

        // Active jobs last month (for trend)
        Job.countDocuments({
            status: "active",
            createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }
        }),

        // Total hired count
        Applicant.countDocuments({ status: "hired" }),

        // Total hired last month
        Applicant.countDocuments({
            status: "hired",
            updatedAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }
        }),

        // Upcoming interviews count (today and tomorrow)
        Interview.countDocuments({
            scheduledDate: { $gte: todayStart, $lt: tomorrowEnd },
            status: { $in: ["scheduled", "confirmed"] }
        }),

        // Interviews count last month (for trend)
        Interview.countDocuments({
            scheduledDate: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            status: { $in: ["scheduled", "confirmed"] }
        }),

        // Upcoming interviews details (today and tomorrow)
        Interview.aggregate([
            {
                $match: {
                    scheduledDate: { $gte: todayStart, $lt: tomorrowEnd },
                    status: { $in: ["scheduled", "confirmed"] }
                }
            },
            { $sort: { scheduledDate: 1, scheduledTime: 1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "applicants",
                    localField: "applicantId",
                    foreignField: "_id",
                    as: "applicant"
                }
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "job"
                }
            },
            {
                $project: {
                    _id: 1,
                    scheduledDate: 1,
                    scheduledTime: 1,
                    meetingLink: 1,
                    candidateName: { $arrayElemAt: ["$applicant.personalData.name", 0] },
                    jobTitle: { $arrayElemAt: ["$job.title", 0] },
                    applicantId: 1
                }
            }
        ]),

        // Action center: Candidates with team reviews awaiting final decision (not hired/rejected/withdrawn)
        // IMPORTANT: Only counts reviews from users with role='reviewer' (not admin/superadmin)
        Applicant.aggregate([
            {
                $match: {
                    status: { $in: ["screening", "interviewing", "evaluated", "shortlisted"] },
                    isComplete: true
                }
            },
            {
                // Lookup reviews with pipeline to filter by reviewer role
                $lookup: {
                    from: "reviews",
                    let: { applicantId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$applicantId", "$$applicantId"] } } },
                        {
                            // Join with users to get reviewer role
                            $lookup: {
                                from: "users",
                                localField: "reviewerId",
                                foreignField: "_id",
                                as: "reviewer"
                            }
                        },
                        { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: false } },
                        // Only include reviews from users with role='reviewer'
                        { $match: { "reviewer.role": "reviewer" } },
                        { $project: { rating: 1, reviewerId: 1 } }
                    ],
                    as: "reviewerOnlyReviews"
                }
            },
            {
                // Also get ALL reviews for avgRating calculation (includes admin reviews)
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "applicantId",
                    as: "allReviews"
                }
            },
            {
                $match: {
                    // Only show candidates that have at least one review from a reviewer
                    "reviewerOnlyReviews.0": { $exists: true }
                }
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "job"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: "$personalData.name",
                    email: "$personalData.email",
                    jobTitle: { $arrayElemAt: ["$job.title", 0] },
                    jobId: 1,
                    // Average rating from ALL reviews (for decision-making context)
                    avgRating: { $avg: "$allReviews.rating" },
                    // Count ONLY reviewer reviews (matches what reviewer sees)
                    reviewCount: { $size: "$reviewerOnlyReviews" },
                    submittedAt: 1
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 10 }
        ]),

        // Recent candidates with AI scores and team ratings
        // IMPORTANT: reviewCount only counts reviews from users with role='reviewer'
        Applicant.aggregate([
            {
                $match: {
                    isComplete: true,
                    submittedAt: { $exists: true }
                }
            },
            { $sort: { submittedAt: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "job"
                }
            },
            {
                // Lookup reviews with pipeline to filter by reviewer role
                $lookup: {
                    from: "reviews",
                    let: { applicantId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$applicantId", "$$applicantId"] } } },
                        {
                            $lookup: {
                                from: "users",
                                localField: "reviewerId",
                                foreignField: "_id",
                                as: "reviewer"
                            }
                        },
                        { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: false } },
                        { $match: { "reviewer.role": "reviewer" } },
                        { $project: { rating: 1 } }
                    ],
                    as: "reviewerOnlyReviews"
                }
            },
            {
                // Also get ALL reviews for avgRating
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "applicantId",
                    as: "allReviews"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: "$personalData.name",
                    email: "$personalData.email",
                    jobTitle: { $arrayElemAt: ["$job.title", 0] },
                    jobId: 1,
                    status: 1,
                    aiScore: 1,
                    avgRating: { $avg: "$allReviews.rating" },
                    // Count ONLY reviewer reviews
                    reviewCount: { $size: "$reviewerOnlyReviews" },
                    submittedAt: 1
                }
            }
        ])
    ])

    // Calculate trends (percentage change from last month)
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    // Format upcoming interviews
    const todayStr = now.toISOString().split('T')[0]
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

    const upcomingInterviews = upcomingInterviewsData.map((interview: any) => {
        const interviewDate = new Date(interview.scheduledDate).toISOString().split('T')[0]
        return {
            _id: interview._id.toString(),
            candidateName: interview.candidateName || "Unknown",
            jobTitle: interview.jobTitle || "Unknown",
            scheduledTime: interview.scheduledTime,
            meetingLink: interview.meetingLink,
            applicantId: interview.applicantId?.toString(),
            isToday: interviewDate === todayStr,
            isTomorrow: interviewDate === tomorrowStr
        }
    })

    // Format action center data
    const actionCenter = actionCenterData.map((item: any) => ({
        _id: item._id.toString(),
        name: item.name || "Unknown",
        email: item.email || "",
        jobTitle: item.jobTitle || "Unknown",
        jobId: item.jobId?.toString() || "",
        avgRating: Math.round((item.avgRating || 0) * 10) / 10,
        reviewCount: item.reviewCount || 0,
        submittedAt: item.submittedAt
    }))

    // Format recent candidates
    const recentCandidates = recentCandidatesData.map((item: any) => ({
        _id: item._id.toString(),
        name: item.name || "Unknown",
        email: item.email || "",
        jobTitle: item.jobTitle || "Unknown",
        jobId: item.jobId?.toString() || "",
        status: item.status,
        aiScore: item.aiScore || 0,
        avgRating: item.avgRating ? Math.round(item.avgRating * 10) / 10 : null,
        reviewCount: item.reviewCount || 0,
        submittedAt: item.submittedAt
    }))

    return {
        // Stats cards data
        totalApplicants,
        totalApplicantsTrend: calculateTrend(totalApplicants, totalApplicantsLastMonth),
        activeJobs,
        activeJobsTrend: calculateTrend(activeJobs, activeJobsLastMonth),
        upcomingInterviewsCount,
        upcomingInterviewsTrend: calculateTrend(upcomingInterviewsCount, upcomingInterviewsCountLastMonth),
        totalHired,
        totalHiredTrend: calculateTrend(totalHired, totalHiredLastMonth),
        // Action center
        actionCenter,
        // Upcoming interviews
        upcomingInterviews,
        // Recent candidates table
        recentCandidates,
    }
}

// Helper function to get reviewer stats using Reviews collection
async function getReviewerStats(userId: string, userName: string) {
    await dbConnect()

    // Fetch all non-archived applicants and all reviews by this reviewer in parallel
    const [applicants, reviews, jobs, ratingDistribution] = await Promise.all([
        // Get all complete applicants (reviewer should see all they've reviewed, regardless of status)
        Applicant.find({
            isComplete: true,
            status: { $nin: ['archived', 'withdrawn'] } // Exclude only archived/withdrawn
        })
            .sort({ createdAt: -1 })
            .select('_id personalData jobId status createdAt sessionId aiScore')
            .lean(),

        // Get all reviews by this reviewer
        Review.find({ reviewerId: userId })
            .select('applicantId rating createdAt')
            .lean(),

        // Get all jobs for lookup
        Job.find({})
            .select('_id title')
            .lean(),

        // Get rating distribution for this reviewer
        Review.aggregate([
            {
                $match: {
                    reviewerId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: -1 },
            },
        ]),
    ])

    // Create a Map of reviewed applicant IDs with their review data for O(1) lookup
    const reviewedApplicantsMap = new Map(
        reviews.map((r: any) => [
            r.applicantId.toString(),
            {
                rating: r.rating,
                reviewedAt: r.createdAt
            }
        ])
    )

    // Create a job lookup map
    const jobMap = new Map(
        jobs.map((j: any) => [j._id.toString(), j.title])
    )

    // ONLY include applicants that have been reviewed by this reviewer
    const completedApplicants: any[] = []

    for (const app of applicants) {
        const applicantId = app._id.toString()
        const reviewData = reviewedApplicantsMap.get(applicantId)

        // Only include if this reviewer has reviewed this applicant
        if (reviewData) {
            const jobTitle = jobMap.get(app.jobId?.toString()) || 'Unknown Position'

            completedApplicants.push({
                _id: applicantId,
                name: app.personalData?.name || 'Unknown',
                email: app.personalData?.email || '',
                jobId: app.jobId?.toString() || '',
                jobTitle,
                status: app.status,
                createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
                sessionId: app.sessionId,
                aiScore: app.aiScore ? Number(app.aiScore) : 0,
                myRating: Number(reviewData.rating),
                reviewedAt: reviewData.reviewedAt ? new Date(reviewData.reviewedAt).toISOString() : null,
            })
        }
    }

    // Calculate stats based on reviewed applicants only
    const totalReviewed = completedApplicants.length

    // Transform rating distribution to ensure all star ratings are present
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
        const found = ratingDistribution.find((r: any) => r._id === rating)
        return {
            rating,
            count: found?.count || 0,
        }
    })

    const ratingDistributionData = {
        distribution,
        total: distribution.reduce((acc, item) => acc + item.count, 0),
    }

    return {
        userId,
        userName,
        stats: {
            total: totalReviewed,
            pending: 0, // No longer showing pending since we only show reviewed
            completed: totalReviewed,
            progressPercent: 100, // Always 100% since we only show completed
        },
        pendingApplicants: [], // Empty since we only show reviewed applicants
        completedApplicants,
        ratingDistribution: ratingDistributionData,
    }
}

// Helper function to get super admin stats
async function getSuperAdminStats() {
    await dbConnect()

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Run all queries in parallel for performance
    const [
        totalUsers,
        totalJobs,
        users,
        usersByRole,
        activeUsers,
        inactiveUsers,
        recentActiveUsers,
        reviewsByDecision,
        interviewsByStatus,
        responsesByType,
        applicantsByStatus,
        totalApplicants,
        totalInterviews,
        totalReviews,
        totalResponses
    ] = await Promise.all([
        // Basic counts
        User.countDocuments(),
        Job.countDocuments(),

        // Recent users list
        User.find()
            .select("name email role isActive lastLogin")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),

        // Users by role
        User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]),

        // Active/Inactive users
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),

        // Users who logged in last 30 days
        User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } }),

        // Reviews by decision type
        Review.aggregate([
            { $group: { _id: "$decision", count: { $sum: 1 } } }
        ]),

        // Interviews by status
        Interview.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),

        // Responses by type
        Response.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]),

        // Applicants by status
        Applicant.aggregate([
            { $match: { isComplete: true } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]),

        // Total counts for percentages
        Applicant.countDocuments({ isComplete: true }),
        Interview.countDocuments(),
        Review.countDocuments(),
        Response.countDocuments()
    ])

    // Format users list
    const usersFormatted = users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
    }))

    // Process role stats
    const roleStats = {
        superadmin: 0,
        admin: 0,
        reviewer: 0
    }
    usersByRole.forEach((item: any) => {
        if (item._id in roleStats) {
            roleStats[item._id as keyof typeof roleStats] = item.count
        }
    })

    // Process review stats by decision
    const reviewStats: Record<string, number> = {
        strong_hire: 0,
        recommended: 0,
        neutral: 0,
        not_recommended: 0,
        strong_no: 0
    }
    reviewsByDecision.forEach((item: any) => {
        if (item._id in reviewStats) {
            reviewStats[item._id] = item.count
        }
    })

    // Process interview stats
    const interviewStats: Record<string, number> = {
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
        rescheduled: 0
    }
    interviewsByStatus.forEach((item: any) => {
        if (item._id in interviewStats) {
            interviewStats[item._id] = item.count
        }
    })

    // Process response stats
    const responseStats: Record<string, number> = {
        text: 0,
        voice: 0,
        'multiple-choice': 0,
        file: 0
    }
    responsesByType.forEach((item: any) => {
        if (item._id in responseStats) {
            responseStats[item._id] = item.count
        }
    })

    // Process applicant stats
    const applicantStats: Record<string, number> = {
        new: 0,
        evaluated: 0,
        interview: 0,
        hired: 0,
        rejected: 0
    }
    applicantsByStatus.forEach((item: any) => {
        if (item._id in applicantStats) {
            applicantStats[item._id] = item.count
        }
    })

    // Calculate percentages helper
    const calcPercentage = (value: number, total: number) =>
        total > 0 ? Math.round((value / total) * 100) : 0

    // Simple health check
    const systemHealth: "healthy" | "warning" | "critical" =
        activeUsers > 0 && totalJobs > 0 ? "healthy" : "warning"

    // Build analytics data from real database queries
    const userAnalytics = {
        roleStats: {
            total: totalUsers,
            superadmin: roleStats.superadmin,
            admin: roleStats.admin,
            reviewer: roleStats.reviewer
        },
        activityStats: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            recentlyActive: recentActiveUsers
        }
    }

    const platformServices = {
        reviews: {
            total: totalReviews,
            strongHire: reviewStats.strong_hire,
            recommended: reviewStats.recommended,
            neutral: reviewStats.neutral,
            notRecommended: reviewStats.not_recommended,
            strongNo: reviewStats.strong_no
        },
        interviews: {
            total: totalInterviews,
            scheduled: interviewStats.scheduled,
            confirmed: interviewStats.confirmed,
            completed: interviewStats.completed,
            cancelled: interviewStats.cancelled,
            noShow: interviewStats.no_show
        },
        responses: {
            total: totalResponses,
            text: responseStats.text,
            voice: responseStats.voice,
            multipleChoice: responseStats['multiple-choice'],
            file: responseStats.file
        },
        applicants: {
            total: totalApplicants,
            new: applicantStats.new,
            evaluated: applicantStats.evaluated,
            interview: applicantStats.interview,
            hired: applicantStats.hired,
            rejected: applicantStats.rejected
        }
    }

    return {
        totalUsers,
        totalJobs,
        systemHealth,
        users: usersFormatted,
        userAnalytics,
        platformServices,
    }
}

export default async function DashboardPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Fetch data based on role and render appropriate view
    if (session.role === "superadmin") {
        const stats = await getSuperAdminStats()
        return <SuperAdminView stats={stats} />
    }

    if (session.role === "reviewer") {
        const data = await getReviewerStats(session.userId, session.name)
        // Use JSON.parse(JSON.stringify(...)) to avoid serialization issues with Mongoose documents
        const serializedData = JSON.parse(JSON.stringify(data))
        return <ReviewerDashboardClient data={serializedData} />
    }

    // Default: Admin/Recruiter view
    const stats = await getAdminStats()
    return <AdminView stats={stats} userRole={session.role} userId={session.userId} />
}
