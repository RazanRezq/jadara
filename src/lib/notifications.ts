import mongoose from 'mongoose'
import Notification, { NotificationType, NotificationPriority } from '@/models/Notifications/notificationSchema'

interface CreateNotificationParams {
    userId: string | mongoose.Types.ObjectId
    type: NotificationType
    priority?: NotificationPriority
    params: Record<string, string | number>
    actionUrl?: string
    relatedId?: string | mongoose.Types.ObjectId
}

/**
 * Creates a localized notification
 * @example
 * await createNotification({
 *   userId: '123',
 *   type: 'new_applicant',
 *   params: { candidateName: 'Ahmad', jobTitle: 'Software Engineer' },
 *   actionUrl: '/dashboard/applicants/123',
 *   priority: 'high'
 * })
 */
export async function createNotification({
    userId,
    type,
    priority = 'medium',
    params,
    actionUrl,
    relatedId,
}: CreateNotificationParams) {
    const titleKey = `notifications.types.${type}.title`
    const messageKey = `notifications.types.${type}.message`

    // Fallback English text for backward compatibility
    const fallbackTitles: Record<NotificationType, string> = {
        new_applicant: 'New Applicant',
        review_assigned: 'Review Assigned',
        review_completed: 'Review Completed',
        comment_added: 'New Comment',
        applicant_hired: 'Applicant Hired',
        job_expired: 'Job Expired',
        system_alert: 'System Alert',
    }

    const fallbackMessages: Record<NotificationType, string> = {
        new_applicant: 'A new applicant has applied',
        review_assigned: 'You have been assigned a review',
        review_completed: 'A review has been completed',
        comment_added: 'A new comment has been added',
        applicant_hired: 'An applicant has been hired',
        job_expired: 'A job posting has expired',
        system_alert: 'System alert',
    }

    const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(userId as string),
        type,
        priority,
        titleKey,
        messageKey,
        params,
        title: fallbackTitles[type],
        message: fallbackMessages[type],
        actionUrl,
        relatedId: relatedId ? new mongoose.Types.ObjectId(relatedId as string) : undefined,
    })

    return notification
}

/**
 * Template functions for common notification types
 * These provide type-safe, pre-configured notification creation
 */
export const NotificationTemplates = {
    /**
     * Notify when a new applicant applies for a job
     */
    newApplicant: (userId: string, candidateName: string, jobTitle: string, applicantId: string) =>
        createNotification({
            userId,
            type: 'new_applicant',
            priority: 'medium',
            params: { candidateName, jobTitle },
            actionUrl: `/dashboard/applicants/${applicantId}`,
            relatedId: applicantId,
        }),

    /**
     * Notify when a review is assigned to a user
     */
    reviewAssigned: (userId: string, candidateName: string, applicantId: string) =>
        createNotification({
            userId,
            type: 'review_assigned',
            priority: 'high',
            params: { candidateName },
            actionUrl: `/dashboard/applicants/${applicantId}`,
            relatedId: applicantId,
        }),

    /**
     * Notify when a review is completed
     */
    reviewCompleted: (
        userId: string,
        reviewerName: string,
        candidateName: string,
        jobTitle: string,
        rating: number,
        applicantId: string
    ) =>
        createNotification({
            userId,
            type: 'review_completed',
            priority: 'medium',
            params: { reviewerName, candidateName, jobTitle, rating },
            actionUrl: `/dashboard/applicants/${applicantId}`,
            relatedId: applicantId,
        }),

    /**
     * Notify when a comment is added to an applicant
     */
    commentAdded: (userId: string, userName: string, candidateName: string, applicantId: string) =>
        createNotification({
            userId,
            type: 'comment_added',
            priority: 'low',
            params: { userName, candidateName },
            actionUrl: `/dashboard/applicants/${applicantId}`,
            relatedId: applicantId,
        }),

    /**
     * Notify when an applicant is hired
     */
    applicantHired: (userId: string, candidateName: string, jobTitle: string, applicantId: string) =>
        createNotification({
            userId,
            type: 'applicant_hired',
            priority: 'low',
            params: { candidateName, jobTitle },
            actionUrl: `/dashboard/applicants/${applicantId}`,
            relatedId: applicantId,
        }),

    /**
     * Notify when a job expires
     */
    jobExpired: (userId: string, jobTitle: string, jobId: string) =>
        createNotification({
            userId,
            type: 'job_expired',
            priority: 'medium',
            params: { jobTitle },
            actionUrl: `/dashboard/jobs/${jobId}`,
            relatedId: jobId,
        }),

    /**
     * Create a system alert notification
     */
    systemAlert: (userId: string, message: string) =>
        createNotification({
            userId,
            type: 'system_alert',
            priority: 'urgent',
            params: { message },
        }),
}
