import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
    console.error('⚠️ RESEND_API_KEY is not configured in environment variables')
}

const resend = new Resend(process.env.RESEND_API_KEY || '')

export interface SendEmailParams {
    to: string
    subject: string
    html: string
    from?: string
}

export interface SendEmailResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
        console.log('📧 Attempting to send email to:', params.to)
        console.log('📧 Using Resend API Key:', process.env.RESEND_API_KEY ? 'Set ✓' : 'Missing ✗')

        const { data, error } = await resend.emails.send({
            from: params.from || 'Jadara Recruitment <onboarding@resend.dev>',
            to: params.to,
            subject: params.subject,
            html: params.html,
        })

        if (error) {
            console.error('❌ Email send error:', error)
            return { success: false, error: error.message }
        }

        console.log('✅ Email sent successfully! Message ID:', data?.id)
        return { success: true, messageId: data?.id }
    } catch (error) {
        console.error('❌ Email service error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// ===========================
// EMAIL TEMPLATES
// ===========================

export interface InterviewInviteData {
    candidateName: string
    jobTitle: string
    interviewDate: string
    interviewTime: string
    meetingLink: string
    notes?: string
    companyName?: string
}

export function generateInterviewInviteEmail(data: InterviewInviteData): string {
    const companyName = data.companyName || 'Jadara'
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Interview Invitation</h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Dear <strong>${data.candidateName}</strong>,
                </p>

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    We are pleased to invite you for an interview for the position of <strong>${data.jobTitle}</strong> at ${companyName}.
                </p>

                <!-- Interview Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <tr>
                        <td>
                            <h3 style="color: #1e40af; margin: 0 0 16px; font-size: 18px;">Interview Details</h3>

                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">Date:</span><br>
                                        <strong style="color: #1f2937; font-size: 16px;">${data.interviewDate}</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">Time:</span><br>
                                        <strong style="color: #1f2937; font-size: 16px;">${data.interviewTime}</strong>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Meeting Link Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Join Meeting
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px;">
                    Meeting Link: <a href="${data.meetingLink}" style="color: #3b82f6;">${data.meetingLink}</a>
                </p>

                ${data.notes ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                    <strong style="color: #92400e;">Additional Notes:</strong>
                    <p style="color: #78350f; margin: 8px 0 0; line-height: 1.6;">${data.notes}</p>
                </div>
                ` : ''}

                <p style="font-size: 16px; color: #374151; margin: 24px 0 0; line-height: 1.6;">
                    Please confirm your attendance by replying to this email. We look forward to meeting you!
                </p>

                <p style="font-size: 16px; color: #374151; margin: 24px 0 0;">
                    Best regards,<br>
                    <strong>The ${companyName} Team</strong>
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    This email was sent by ${companyName} Recruitment System.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

export interface RejectionEmailData {
    candidateName: string
    jobTitle: string
    companyName?: string
    feedback?: string
}

export function generateRejectionEmail(data: RejectionEmailData): string {
    const companyName = data.companyName || 'Jadara'
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Application Update</h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Dear <strong>${data.candidateName}</strong>,
                </p>

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    Thank you for your interest in the <strong>${data.jobTitle}</strong> position at ${companyName} and for taking the time to apply.
                </p>

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.
                </p>

                ${data.feedback ? `
                <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                    <strong style="color: #374151;">Feedback:</strong>
                    <p style="color: #4b5563; margin: 8px 0 0; line-height: 1.6;">${data.feedback}</p>
                </div>
                ` : ''}

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    We encourage you to apply for future openings that match your skills and experience. We wish you the best in your career journey.
                </p>

                <p style="font-size: 16px; color: #374151; margin: 24px 0 0;">
                    Best regards,<br>
                    <strong>The ${companyName} Team</strong>
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    This email was sent by ${companyName} Recruitment System.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

export interface OfferEmailData {
    candidateName: string
    jobTitle: string
    salary?: string
    startDate?: string
    companyName?: string
    additionalDetails?: string
}

export function generateOfferEmail(data: OfferEmailData): string {
    const companyName = data.companyName || 'Jadara'
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Congratulations!</h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 32px;">
                <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
                    Dear <strong>${data.candidateName}</strong>,
                </p>

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    We are thrilled to offer you the position of <strong>${data.jobTitle}</strong> at ${companyName}!
                </p>

                <!-- Offer Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <tr>
                        <td>
                            <h3 style="color: #065f46; margin: 0 0 16px; font-size: 18px;">Offer Details</h3>

                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">Position:</span><br>
                                        <strong style="color: #1f2937; font-size: 16px;">${data.jobTitle}</strong>
                                    </td>
                                </tr>
                                ${data.salary ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">Salary:</span><br>
                                        <strong style="color: #1f2937; font-size: 16px;">${data.salary}</strong>
                                    </td>
                                </tr>
                                ` : ''}
                                ${data.startDate ? `
                                <tr>
                                    <td style="padding: 8px 0;">
                                        <span style="color: #6b7280; font-size: 14px;">Start Date:</span><br>
                                        <strong style="color: #1f2937; font-size: 16px;">${data.startDate}</strong>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </td>
                    </tr>
                </table>

                ${data.additionalDetails ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                    <strong style="color: #92400e;">Additional Information:</strong>
                    <p style="color: #78350f; margin: 8px 0 0; line-height: 1.6;">${data.additionalDetails}</p>
                </div>
                ` : ''}

                <p style="font-size: 16px; color: #374151; margin: 0 0 24px; line-height: 1.6;">
                    Please review the offer details and confirm your acceptance by replying to this email. We are excited to welcome you to our team!
                </p>

                <p style="font-size: 16px; color: #374151; margin: 24px 0 0;">
                    Welcome aboard!<br>
                    <strong>The ${companyName} Team</strong>
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    This email was sent by ${companyName} Recruitment System.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

// ===========================
// SEND SPECIFIC EMAILS
// ===========================

export async function sendInterviewInvite(
    to: string,
    data: InterviewInviteData
): Promise<SendEmailResult> {
    const subject = `Interview Invitation: ${data.jobTitle} at ${data.companyName || 'Jadara'}`
    const html = generateInterviewInviteEmail(data)
    return sendEmail({ to, subject, html })
}

export async function sendRejectionEmail(
    to: string,
    data: RejectionEmailData
): Promise<SendEmailResult> {
    const subject = `Application Update: ${data.jobTitle} at ${data.companyName || 'Jadara'}`
    const html = generateRejectionEmail(data)
    return sendEmail({ to, subject, html })
}

export async function sendOfferEmail(
    to: string,
    data: OfferEmailData
): Promise<SendEmailResult> {
    const subject = `Job Offer: ${data.jobTitle} at ${data.companyName || 'Jadara'}`
    const html = generateOfferEmail(data)
    return sendEmail({ to, subject, html })
}
