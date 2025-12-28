import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import dbConnect from "@/lib/mongodb"
import Applicant from "@/models/Applicants/applicantSchema"
import Job from "@/models/Jobs/jobSchema"
import User from "@/models/Users/userSchema"
// Note: Evaluation import removed as it's no longer used in admin stats
import Review from "@/models/Reviews/reviewSchema"
import Interview from "@/models/Interviews/interviewSchema"
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
        Applicant.aggregate([
            {
                $match: {
                    status: { $in: ["screening", "interviewing", "evaluated", "shortlisted"] },
                    isComplete: true
                }
            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "applicantId",
                    as: "reviews"
                }
            },
            {
                $match: {
                    "reviews.0": { $exists: true }
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
                    avgRating: { $avg: "$reviews.rating" },
                    reviewCount: { $size: "$reviews" },
                    submittedAt: 1
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 10 }
        ]),

        // Recent candidates with AI scores and team ratings
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
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "applicantId",
                    as: "reviews"
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
                    avgRating: { $avg: "$reviews.rating" },
                    reviewCount: { $size: "$reviews" },
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
    const [applicants, reviews, jobs] = await Promise.all([
        // Get all applicants that are not archived (sorted by newest first)
        Applicant.find({
            status: { $nin: ['archived', 'withdrawn'] },
            isComplete: true
        })
            .sort({ createdAt: -1 })
            .select('_id personalData jobId status createdAt sessionId aiScore')
            .lean(),

        // Get all reviews by this reviewer
        Review.find({ reviewerId: userId })
            .select('applicantId')
            .lean(),

        // Get all jobs for lookup
        Job.find({})
            .select('_id title')
            .lean(),
    ])

    // Create a Set of reviewed applicant IDs for O(1) lookup
    const reviewedApplicantIds = new Set(
        reviews.map((r: any) => r.applicantId.toString())
    )

    // Create a job lookup map
    const jobMap = new Map(
        jobs.map((j: any) => [j._id.toString(), j.title])
    )

    // Separate applicants into pending and completed
    const pendingApplicants: any[] = []
    const completedApplicants: any[] = []

    for (const app of applicants) {
        const applicantId = app._id.toString()
        const jobTitle = jobMap.get(app.jobId?.toString()) || 'Unknown Position'

        const formattedApplicant = {
            _id: applicantId,
            name: app.personalData?.name || 'Unknown',
            email: app.personalData?.email || '',
            jobId: app.jobId?.toString() || '',
            jobTitle,
            status: app.status,
            createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : new Date().toISOString(),
            sessionId: app.sessionId,
            aiScore: app.aiScore,
        }

        if (reviewedApplicantIds.has(applicantId)) {
            completedApplicants.push(formattedApplicant)
        } else {
            pendingApplicants.push(formattedApplicant)
        }
    }

    // Calculate stats
    const totalApplicants = applicants.length
    const pendingCount = pendingApplicants.length
    const completedCount = completedApplicants.length
    const progressPercent = totalApplicants > 0
        ? Math.round((completedCount / totalApplicants) * 100)
        : 0

    return {
        userName,
        stats: {
            total: totalApplicants,
            pending: pendingCount,
            completed: completedCount,
            progressPercent,
        },
        pendingApplicants,
        completedApplicants,
    }
}

// Helper function to get super admin stats
async function getSuperAdminStats() {
    await dbConnect()

    // Run all queries in parallel
    const [totalUsers, totalJobs, users] = await Promise.all([
        User.countDocuments(),
        Job.countDocuments(),
        User.find()
            .select("name email role isActive lastLogin")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
    ])

    const usersFormatted = users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
    }))

    // Simple health check (can be expanded)
    const systemHealth: "healthy" | "warning" | "critical" = "healthy"

    return {
        totalUsers,
        totalJobs,
        systemHealth,
        users: usersFormatted,
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
    return <AdminView stats={stats} />
}
