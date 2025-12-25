import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import dbConnect from "@/lib/mongodb"
import Applicant from "@/models/Applicants/applicantSchema"
import Job from "@/models/Jobs/jobSchema"
import User from "@/models/Users/userSchema"
import Evaluation from "@/models/Evaluations/evaluationSchema"
import { AdminView } from "./_components/admin-view"
import { ReviewerView } from "./_components/reviewer-view"
import { SuperAdminView } from "./_components/super-admin-view"

// Helper function to get admin/recruiter stats
async function getAdminStats() {
    await dbConnect()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use Promise.all to run queries in parallel
    const [
        actionRequired,
        interviewsScheduled,
        totalHired,
        activeJobs,
        applicantsTrend,
        funnelData,
        recentApplicantsData,
    ] = await Promise.all([
        // Get action required count (new applicants)
        Applicant.countDocuments({ status: "new" }),

        // Get interviews scheduled count
        Applicant.countDocuments({ status: "interviewing" }),

        // Get total hired count
        Applicant.countDocuments({ status: "hired" }),

        // Get active jobs count
        Job.countDocuments({ status: "active" }),

        // Get applications trend for last 30 days using aggregation
        Applicant.aggregate([
            {
                $match: {
                    submittedAt: { $gte: thirtyDaysAgo },
                    isComplete: true,
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: 1,
                },
            },
        ]),

        // Get funnel data using aggregation (single query instead of 6)
        Applicant.aggregate([
            {
                $match: {
                    status: { $in: ["new", "screening", "interviewing", "evaluated", "shortlisted", "hired"] },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]),

        // Get recent applicants with evaluations using aggregation (single query with lookup)
        Applicant.aggregate([
            {
                $match: {
                    isComplete: true,
                    submittedAt: { $exists: true },
                },
            },
            { $sort: { submittedAt: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "job",
                },
            },
            {
                $lookup: {
                    from: "evaluations",
                    localField: "_id",
                    foreignField: "applicantId",
                    as: "evaluation",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: "$personalData.name",
                    jobTitle: { $arrayElemAt: ["$job.title", 0] },
                    aiScore: { $arrayElemAt: ["$evaluation.overallScore", 0] },
                    submittedAt: 1,
                },
            },
        ]),
    ])

    // Format funnel data to match expected structure
    const funnelStages = ["new", "screening", "interviewing", "evaluated", "shortlisted", "hired"]
    const funnelMap = new Map(funnelData.map((item: any) => [item._id, item.count]))
    const formattedFunnelData = funnelStages.map((stage) => ({
        stage,
        count: funnelMap.get(stage) || 0,
    }))

    // Format recent applicants
    const recentApplicants = recentApplicantsData.map((app: any) => ({
        _id: app._id.toString(),
        name: app.name || "Unknown",
        jobTitle: app.jobTitle || "Unknown",
        aiScore: app.aiScore || 0,
        submittedAt: app.submittedAt || new Date(),
    }))

    return {
        actionRequired,
        interviewsScheduled,
        totalHired,
        activeJobs,
        applicationsLast30Days: applicantsTrend,
        funnelData: formattedFunnelData,
        recentApplicants,
    }
}

// Helper function to get reviewer stats
async function getReviewerStats(userId: string) {
    await dbConnect()

    // Use aggregation to get counts and queue in single query
    const [stats, evaluationQueue] = await Promise.all([
        // Get counts using aggregation
        Evaluation.aggregate([
            { $match: { reviewedBy: userId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $ne: ["$manualRecommendation", null] }, 1, 0],
                        },
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ["$manualRecommendation", null] }, 1, 0],
                        },
                    },
                },
            },
        ]),

        // Get pending evaluations with lookups
        Evaluation.aggregate([
            { $match: { reviewedBy: userId, manualRecommendation: null } },
            {
                $lookup: {
                    from: "applicants",
                    localField: "applicantId",
                    foreignField: "_id",
                    as: "applicant",
                },
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    as: "job",
                },
            },
            {
                $project: {
                    _id: { $arrayElemAt: ["$applicant._id", 0] },
                    candidateRef: {
                        $toUpper: {
                            $substr: [{ $arrayElemAt: ["$applicant.sessionId", 0] }, 0, 8],
                        },
                    },
                    jobTitle: { $arrayElemAt: ["$job.title", 0] },
                    dateAssigned: "$createdAt",
                },
            },
        ]),
    ])

    const { pending = 0, completed = 0 } = stats[0] || {}

    return {
        pendingReviews: pending,
        completedReviews: completed,
        evaluationQueue: evaluationQueue.map((item: any) => ({
            _id: item._id?.toString() || "",
            candidateRef: item.candidateRef || "N/A",
            jobTitle: item.jobTitle || "Unknown",
            dateAssigned: item.dateAssigned,
        })),
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
        const stats = await getReviewerStats(session.userId)
        return <ReviewerView stats={stats} />
    }

    // Default: Admin/Recruiter view
    const stats = await getAdminStats()
    return <AdminView stats={stats} />
}
