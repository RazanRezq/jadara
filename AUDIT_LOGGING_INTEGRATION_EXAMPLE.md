# Audit Logging Integration Guide

This document shows how to integrate audit logging into your existing API routes.

## Setup Complete ✅

The audit logging system has been fully implemented with the following components:

1. **Database Schema**: `/src/models/AuditLogs/auditLogSchema.ts`
2. **Helper Functions**: `/src/lib/auditLogger.ts`
3. **API Routes**: `/src/models/AuditLogs/route.ts`
4. **UI Dashboard**: `/src/app/(dashboard)/dashboard/audit-logs/`
5. **Sidebar Integration**: Added to superadmin menu

## How to Log Actions

### 1. Import the audit logger

```typescript
import { logUserAction, trackChanges, sanitizeForAudit } from '@/lib/auditLogger'
import { getAuthUser } from '@/lib/authMiddleware'
```

### 2. Example: User Creation

```typescript
// In /src/models/Users/route.ts - Register endpoint
app.post('/register', authenticate, requireRole('superadmin'), async (c) => {
    try {
        const currentUser = getAuthUser(c)
        const body = await c.req.json()

        // Create user...
        const newUser = await User.create(userData)

        // Log the action
        await logUserAction(
            {
                userId: currentUser.userId,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role,
            },
            'user.created',
            'User',
            newUser._id.toString(),
            `Created new user: ${newUser.email}`,
            {
                resourceName: newUser.email,
                metadata: {
                    newUserRole: newUser.role,
                    newUserName: newUser.name,
                },
                severity: 'info',
            }
        )

        return c.json({ success: true, data: newUser })
    } catch (error) {
        // ...
    }
})
```

### 3. Example: User Update with Change Tracking

```typescript
// In /src/models/Users/route.ts - Update endpoint
app.post('/update/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        const currentUser = getAuthUser(c)
        const userId = c.req.param('id')
        const updates = await c.req.json()

        // Get existing user
        const existingUser = await User.findById(userId).lean()

        // Update user
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true })

        // Track what changed
        const changes = trackChanges(existingUser, updatedUser.toObject())

        // Log the action
        await logUserAction(
            {
                userId: currentUser.userId,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role,
            },
            'user.updated',
            'User',
            userId,
            `Updated user: ${updatedUser.email}`,
            {
                resourceName: updatedUser.email,
                changes,
                metadata: {
                    fieldsChanged: Object.keys(changes.after),
                },
                severity: 'info',
            }
        )

        return c.json({ success: true, data: updatedUser })
    } catch (error) {
        // ...
    }
})
```

### 4. Example: User Deletion

```typescript
app.delete('/delete/:id', authenticate, requireRole('superadmin'), async (c) => {
    try {
        const currentUser = getAuthUser(c)
        const userId = c.req.param('id')

        const user = await User.findById(userId)

        await User.findByIdAndDelete(userId)

        // Log deletion
        await logUserAction(
            {
                userId: currentUser.userId,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role,
            },
            'user.deleted',
            'User',
            userId,
            `Deleted user: ${user.email}`,
            {
                resourceName: user.email,
                metadata: {
                    deletedUserRole: user.role,
                    deletedUserName: user.name,
                },
                severity: 'warning',
            }
        )

        return c.json({ success: true })
    } catch (error) {
        // ...
    }
})
```

### 5. Example: Login Action

```typescript
app.post('/login', async (c) => {
    try {
        // ... authentication logic

        // On successful login
        await logUserAction(
            {
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
            'user.login',
            'User',
            user._id.toString(),
            `User logged in: ${user.email}`,
            {
                resourceName: user.email,
                metadata: {
                    loginTime: new Date().toISOString(),
                },
                severity: 'info',
                ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
                userAgent: c.req.header('user-agent'),
            }
        )

        return c.json({ success: true, user })
    } catch (error) {
        // On failed login
        await createAuditLog({
            userId: 'system',
            userEmail: body.email || 'unknown',
            userName: 'Unknown User',
            userRole: 'reviewer',
            action: 'user.login',
            resource: 'User',
            description: `Failed login attempt for ${body.email}`,
            severity: 'warning',
            ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
            userAgent: c.req.header('user-agent'),
        })
    }
})
```

### 6. Example: Job Actions

```typescript
// Job created
await logUserAction(
    currentUser,
    'job.created',
    'Job',
    job._id.toString(),
    `Created job: ${job.title}`,
    {
        resourceName: job.title,
        metadata: {
            department: job.department,
            employmentType: job.employmentType,
        },
        severity: 'info',
    }
)

// Job published
await logUserAction(
    currentUser,
    'job.published',
    'Job',
    jobId,
    `Published job: ${job.title}`,
    {
        resourceName: job.title,
        severity: 'info',
    }
)

// Job deleted
await logUserAction(
    currentUser,
    'job.deleted',
    'Job',
    jobId,
    `Deleted job: ${job.title}`,
    {
        resourceName: job.title,
        severity: 'warning',
    }
)
```

### 7. Example: Applicant Actions

```typescript
// Applicant status changed
await logUserAction(
    currentUser,
    'applicant.status_changed',
    'Applicant',
    applicantId,
    `Changed applicant status from ${oldStatus} to ${newStatus}`,
    {
        resourceName: applicant.personalData.name,
        changes: {
            before: { status: oldStatus },
            after: { status: newStatus },
        },
        metadata: {
            jobTitle: job.title,
        },
        severity: 'info',
    }
)

// Applicant evaluated
await logUserAction(
    currentUser,
    'applicant.evaluated',
    'Applicant',
    applicantId,
    `AI evaluated applicant: ${applicant.personalData.name}`,
    {
        resourceName: applicant.personalData.name,
        metadata: {
            aiScore: evaluation.overallScore,
            recommendation: evaluation.recommendation,
        },
        severity: 'info',
    }
)
```

### 8. Example: System Actions

```typescript
// Settings updated
await logUserAction(
    currentUser,
    'system.settings_updated',
    'System',
    'company-profile',
    `Updated company profile`,
    {
        changes: trackChanges(oldSettings, newSettings),
        severity: 'info',
    }
)
```

## Severity Levels

- **info**: Normal operations (create, update, view)
- **warning**: Potentially important actions (delete, status change)
- **error**: Failed operations (validation errors, permission denied)
- **critical**: Security-related events (unauthorized access attempts, data breaches)

## Sensitive Data Sanitization

The audit logger automatically sanitizes sensitive fields:
- password
- passwordHash
- token
- apiKey
- secret
- JWT_SECRET

These fields are replaced with `[REDACTED]` in the logs.

## Querying Audit Logs

### Via API

```typescript
// Get all logs
GET /api/audit-logs?page=1&limit=50

// Filter by user
GET /api/audit-logs?userId=123

// Filter by action
GET /api/audit-logs?action=user.created

// Filter by resource
GET /api/audit-logs?resource=User

// Filter by severity
GET /api/audit-logs?severity=warning

// Filter by date range
GET /api/audit-logs?startDate=2024-01-01&endDate=2024-12-31

// Search
GET /api/audit-logs?search=john@example.com

// Get statistics
GET /api/audit-logs/stats/overview

// Cleanup old logs
DELETE /api/audit-logs/cleanup?days=90
```

### Via UI

Superadmin can access the audit logs dashboard at:
- `/dashboard/audit-logs`

Features:
- Search logs
- Filter by severity, resource, role, action
- View detailed log information
- Export logs (CSV/Excel/PDF)
- View statistics and charts

## Auto-Cleanup

Audit logs are automatically deleted after 90 days (configurable in the schema's TTL index).

To change the retention period, modify the TTL index in `auditLogSchema.ts`:

```typescript
// Change 90 days to desired retention period
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })
```

## Integration Checklist

To add audit logging to a new feature:

1. [ ] Import `logUserAction` or `createAuditLog`
2. [ ] Get current user with `getAuthUser(c)`
3. [ ] Call logging function after successful operation
4. [ ] Include descriptive message
5. [ ] Add relevant metadata
6. [ ] Use appropriate severity level
7. [ ] Track changes for update operations
8. [ ] Sanitize sensitive data

## Next Steps

Update these files to add audit logging:

1. `/src/models/Users/route.ts` - User CRUD operations
2. `/src/models/Jobs/route.ts` - Job management
3. `/src/models/Applicants/route.ts` - Applicant management
4. `/src/models/Evaluations/route.ts` - Evaluation actions
5. `/src/models/CompanyProfile/route.ts` - Settings updates
6. `/src/app/(auth)/login/actions.ts` - Login/logout actions

## Testing

Test the audit logging system:

1. Create a user → Check audit log
2. Update a user → Verify changes tracked
3. Delete a user → Confirm warning severity
4. Filter logs by user/action/resource
5. View detailed log information
6. Export logs to CSV

All audit logs should appear in the dashboard at `/dashboard/audit-logs`.
