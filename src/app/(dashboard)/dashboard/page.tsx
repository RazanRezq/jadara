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

    // Get action required count (new applicants)
    const actionRequired = await Applicant.countDocuments({ status: "new" })

    // Get interviews scheduled count
    const interviewsScheduled = await Applicant.countDocuments({
        status: "interviewing",
    })

    // Get total hired count
    const totalHired = await Applicant.countDocuments({ status: "hired" })

    // Get active jobs count
    const activeJobs = await Job.countDocuments({ status: "active" })

    // Get applications trend for last 30 days
    const applicants = await Applicant.find({
        submittedAt: { $gte: thirtyDaysAgo },
        isComplete: true,
    }).select("submittedAt")

    // Group by date
    const dateMap = new Map<string, number>()
    applicants.forEach((app) => {
        const date = app.submittedAt?.toISOString().split("T")[0]
        if (date) {
            dateMap.set(date, (dateMap.get(date) || 0) + 1)
        }
    })

    const applicationsLast30Days = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

    // Get funnel data
    const funnelStages = ["new", "screening", "interviewing", "evaluated", "shortlisted", "hired"]
    const funnelData = await Promise.all(
        funnelStages.map(async (stage) => ({
            stage,
            count: await Applicant.countDocuments({ status: stage }),
        }))
    )

    // Get recent applicants with AI scores
    const recentApplicants = await Applicant.find({
        isComplete: true,
        submittedAt: { $exists: true },
    })
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate("jobId", "title")
        .lean()

    const recentApplicantsWithScores = await Promise.all(
        recentApplicants.map(async (applicant) => {
            const evaluation = await Evaluation.findOne({
                applicantId: applicant._id,
            }).lean()

            return {
                _id: applicant._id.toString(),
                name: applicant.personalData.name,
                jobTitle: (applicant.jobId as any)?.title || "Unknown",
                aiScore: evaluation?.overallScore || 0,
                submittedAt: applicant.submittedAt || new Date(),
            }
        })
    )

    return {
        actionRequired,
        interviewsScheduled,
        totalHired,
        activeJobs,
        applicationsLast30Days,
        funnelData,
        recentApplicants: recentApplicantsWithScores,
    }
}

// Helper function to get reviewer stats
async function getReviewerStats(userId: string) {
    await dbConnect()

    // Get evaluations assigned to this reviewer
    const assignedEvaluations = await Evaluation.find({
        reviewedBy: userId,
    })
        .populate("applicantId", "personalData sessionId")
        .populate("jobId", "title")
        .lean()

    const pendingReviews = assignedEvaluations.filter(
        (evaluation) => !evaluation.manualRecommendation
    ).length

    const completedReviews = assignedEvaluations.filter(
        (evaluation) => evaluation.manualRecommendation
    ).length

    // Build evaluation queue
    const evaluationQueue = assignedEvaluations
        .filter((evaluation) => !evaluation.manualRecommendation)
        .map((evaluation) => ({
            _id: (evaluation.applicantId as any)?._id.toString(),
            candidateRef: (evaluation.applicantId as any)?.sessionId?.substring(0, 8).toUpperCase() || "N/A",
            jobTitle: (evaluation.jobId as any)?.title || "Unknown",
            dateAssigned: evaluation.createdAt,
        }))

    return {
        pendingReviews,
        completedReviews,
        evaluationQueue,
    }
}

// Helper function to get super admin stats
async function getSuperAdminStats() {
    await dbConnect()

    const totalUsers = await User.countDocuments()
    const totalJobs = await Job.countDocuments()

    // Get all users for the table
    const users = await User.find()
        .select("name email role isActive lastLogin")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

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
