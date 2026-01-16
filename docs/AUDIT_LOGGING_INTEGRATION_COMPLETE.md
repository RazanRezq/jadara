# Audit Logging Integration Complete

## Overview

Complete integration of audit logging system across all critical endpoints in the Jadara application. This document summarizes all implemented audit logging features and provides guidance for future development.

**Status**: ✅ Complete
**Date**: 2025-12-25
**Phase**: Production Ready

---

## Architecture Overview

### Core Components

1. **Audit Logger** ([src/lib/auditLogger.ts](src/lib/auditLogger.ts))
   - `createAuditLog()` - Low-level audit log creation
   - `logUserAction()` - High-level helper for logging user actions
   - `sanitizeForAudit()` - Removes sensitive data (passwords, tokens, etc.)
   - `trackChanges()` - Tracks before/after changes in objects

2. **Audit Log Schema** ([src/models/AuditLogs/auditLogSchema.ts](src/models/AuditLogs/auditLogSchema.ts))
   - Stores comprehensive audit trail
   - Includes user context, action type, resource info, changes, metadata
   - Supports severity levels: info, warning, critical
   - Indexed for efficient querying

3. **Audit Logs API** ([src/models/AuditLogs/route.ts](src/models/AuditLogs/route.ts))
   - List audit logs with filtering (user, action, resource, date range, severity)
   - Get single audit log details
   - Export to CSV
   - Statistics endpoint

4. **Audit Logs UI** ([src/app/(dashboard)/dashboard/audit-logs/page.tsx](src/app/(dashboard)/dashboard/audit-logs/page.tsx))
   - Real-time audit log viewer
   - Advanced filtering and search
   - Export functionality
   - Role-based access (superadmin only)

---

## Integrated Endpoints

### 1. Job Endpoints ([src/models/Jobs/route.ts](src/models/Jobs/route.ts))

#### ✅ POST /jobs/add
- **Action**: `job.created`
- **Severity**: info
- **Logged Data**: Job title, department, location, employment type, status

#### ✅ PATCH /jobs/:id
- **Action**: `job.updated`
- **Severity**: info
- **Logged Data**: Changed fields, before/after values

#### ✅ POST /jobs/update/:id (backward compatibility)
- **Action**: `job.updated`
- **Severity**: info
- **Logged Data**: Changed fields, before/after values

#### ✅ POST /jobs/toggle-status/:id
- **Action**: `job.published` or `job.closed`
- **Severity**: info
- **Logged Data**: Old status → new status, department, location

#### ✅ DELETE /jobs/delete/:id
- **Action**: `job.deleted`
- **Severity**: warning
- **Logged Data**: Job title, department, location

---

### 2. User Endpoints ([src/models/Users/route.ts](src/models/Users/route.ts))

#### ✅ POST /users/register
- **Action**: `user.created`
- **Severity**: info
- **Logged Data**: Email, name, role
- **Note**: Self-logging (new user logs their own creation)

#### ✅ POST /users/update/:id
- **Action**: `user.role_changed` (if role changed) or `user.updated`
- **Severity**: warning (for role/active changes), info (for other changes)
- **Logged Data**: Changed fields, before/after values
- **Special Tracking**: Role changes get special attention

#### ✅ POST /users/reset-password/:id
- **Action**: `user.password_reset`
- **Severity**: warning
- **Logged Data**: User email, role (password itself is NOT logged)

#### ✅ DELETE /users/delete/:id
- **Action**: `user.deleted`
- **Severity**: critical
- **Logged Data**: User email, name, role

#### ✅ POST /users/bulk-import
- **Action**: `user.created` (for each user)
- **Severity**: info
- **Logged Data**: Email, role, batch flag
- **Note**: Each imported user gets individual audit log entry

---

### 3. Applicant Endpoints ([src/models/Applicants/route.ts](src/models/Applicants/route.ts))

#### ✅ POST /applicants/update/:id
- **Action**: `applicant.status_changed`
- **Severity**: info
- **Logged Data**: Applicant name, email, job title, old status → new status
- **Conditional**: Only logs if status was actually changed

#### ✅ POST /applicants/bulk-update
- **Action**: `applicant.bulk_status_changed`
- **Severity**: info
- **Logged Data**: Count of applicants, new status, applicant IDs

#### ✅ DELETE /applicants/delete/:id
- **Action**: `applicant.deleted`
- **Severity**: warning
- **Logged Data**: Applicant name, email, job title
- **Authorization**: Admin+ only (reviewers cannot delete)

---

## Audit Action Types

All actions follow the pattern `resource.action`:

### Job Actions
- `job.created`
- `job.updated`
- `job.published`
- `job.closed`
- `job.deleted`

### User Actions
- `user.created`
- `user.updated`
- `user.role_changed`
- `user.password_reset`
- `user.deleted`

### Applicant Actions
- `applicant.status_changed`
- `applicant.bulk_status_changed`
- `applicant.deleted`

### System Actions (for future use)
- `config.updated`
- `system.backup_created`
- `system.maintenance_started`

---

## Severity Levels

| Level | Use Case | Examples |
|-------|----------|----------|
| **info** | Normal operations | Creating jobs, updating applicants, general updates |
| **warning** | Important changes | Deleting jobs/applicants, password resets, role changes |
| **critical** | Security-sensitive | User deletion, system config changes |

---

## Security Features

### 1. Sensitive Data Protection
- Passwords automatically redacted (`[REDACTED]`)
- API keys and tokens sanitized
- JWT secrets never logged
- Uses `sanitizeForAudit()` helper

### 2. Change Tracking
- Before/after snapshots for updates
- Only logs fields that actually changed
- Tracks nested object changes

### 3. Role-Based Access
- Audit logs viewable by superadmin only
- User context captured for all actions
- IP and user agent tracking (prepared for future)

### 4. Data Integrity
- Audit logs cannot be modified via UI
- Deletion requires direct database access
- Indexed for efficient querying

---

## Query & Filter Capabilities

The audit log system supports:

1. **User Filtering**: Filter by specific user
2. **Action Filtering**: Filter by action type (e.g., all deletions)
3. **Resource Filtering**: Filter by resource type (Job, User, Applicant)
4. **Date Range**: Filter by specific time periods
5. **Severity**: Filter by severity level
6. **Search**: Full-text search across descriptions
7. **Export**: CSV export with all filters applied

---

## Integration Checklist

### ✅ Completed
- [x] Audit logger utility functions
- [x] Audit log database schema
- [x] Audit log API endpoints
- [x] Audit log UI with filtering
- [x] Job creation logging
- [x] Job update logging
- [x] Job status change logging
- [x] Job deletion logging
- [x] User creation logging
- [x] User update logging (with role change tracking)
- [x] User password reset logging
- [x] User deletion logging
- [x] User bulk import logging
- [x] Applicant status change logging
- [x] Applicant bulk update logging
- [x] Applicant deletion logging
- [x] CSV export functionality
- [x] Role-based access control

### 🔄 Future Enhancements (Optional)
- [ ] IP address and user agent capture (middleware enhancement)
- [ ] Request URL and method logging
- [ ] Retention policies (auto-delete old logs)
- [ ] Advanced analytics dashboard
- [ ] Real-time log streaming (WebSocket)
- [ ] Email alerts for critical actions
- [ ] Compliance reports (GDPR, HIPAA, SOC2)

---

## Usage Examples

### Example 1: Track Who Deleted a Job

```typescript
// Automatic logging in DELETE /jobs/delete/:id
await logUserAction(
    user,
    'job.deleted',
    'Job',
    jobId,
    `Deleted job: ${jobTitle}`,
    {
        resourceName: jobTitle,
        metadata: {
            department: jobDepartment,
            location: jobLocation,
        },
        severity: 'warning',
    }
)
```

**Result in Audit Log**:
```
User: admin@company.com (Admin)
Action: job.deleted
Resource: Senior React Developer
Description: Deleted job: Senior React Developer
Severity: warning
Timestamp: 2025-12-25 10:30:00
Metadata: { department: "Engineering", location: "Remote" }
```

### Example 2: Track Role Changes

```typescript
// Automatic in POST /users/update/:id
const action = changedFields.includes('role') ? 'user.role_changed' : 'user.updated'

await logUserAction(
    currentUser,
    action,
    'User',
    user._id.toString(),
    `Updated user: ${user.email}${changedFields.includes('role') ? ` (role changed to ${user.role})` : ''}`,
    {
        resourceName: user.name,
        changes: {
            before: { role: 'reviewer' },
            after: { role: 'admin' }
        },
        severity: 'warning',
    }
)
```

### Example 3: Query Audit Logs

```bash
# Get all deletions in the last 7 days
GET /api/audit-logs/list?action=deleted&dateFrom=2025-12-18

# Get all actions by specific user
GET /api/audit-logs/list?userId=507f1f77bcf86cd799439011

# Get critical security events
GET /api/audit-logs/list?severity=critical

# Export to CSV
GET /api/audit-logs/export?action=deleted&dateFrom=2025-12-01
```

---

## Best Practices

### 1. When to Log
✅ **DO LOG:**
- Create, update, delete operations on critical resources
- Status changes (job status, applicant status)
- Security-sensitive actions (password resets, role changes)
- Bulk operations
- System configuration changes

❌ **DON'T LOG:**
- Read-only operations (GET requests)
- Health checks
- Static file requests
- Duplicate information already in application logs

### 2. What to Include
✅ **DO INCLUDE:**
- Who performed the action (user context)
- What was changed (before/after values)
- When it happened (automatic timestamp)
- Why it might matter (severity level)
- Context (resource names, related entities)

❌ **DON'T INCLUDE:**
- Passwords or password hashes
- API keys or tokens
- Sensitive personal data (unless required for audit)
- Large binary data

### 3. Performance Considerations
- Audit logging is async (doesn't block main flow)
- Failed audit logs don't break the application
- Indexed fields for efficient querying
- Automatic cleanup can be added for old logs

---

## Maintenance & Monitoring

### Regular Tasks
1. **Weekly**: Review critical and warning severity logs
2. **Monthly**: Archive old logs (optional retention policy)
3. **Quarterly**: Audit log usage and optimize queries
4. **Annually**: Security audit of logging system

### Monitoring Metrics
- Total audit log entries per day
- Critical/warning action frequency
- Top users by action count
- Failed audit log writes (check application logs)

### Troubleshooting
- **Audit logs not appearing**: Check `auditLogger.ts` error logging in console
- **Slow queries**: Ensure indexes are created on userId, action, timestamp
- **Missing data**: Check if middleware is properly setting user context

---

## Database Schema

```typescript
interface IAuditLog {
    userId: string                 // Who performed the action
    userEmail: string              // User's email
    userName: string               // User's name
    userRole: 'reviewer' | 'admin' | 'superadmin'
    action: AuditAction            // What action was performed
    resource: string               // Resource type (Job, User, Applicant)
    resourceId?: string            // Specific resource ID
    resourceName?: string          // Human-readable resource name
    description: string            // Detailed description
    metadata?: Record<string, any> // Additional context
    changes?: {
        before?: Record<string, any>
        after?: Record<string, any>
    }
    severity: 'info' | 'warning' | 'critical'
    ipAddress?: string             // Future: user's IP
    userAgent?: string             // Future: browser info
    requestMethod?: string         // Future: HTTP method
    requestUrl?: string            // Future: request URL
    timestamp: Date                // When it happened
}
```

### Indexes
```javascript
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ resource: 1, timestamp: -1 })
auditLogSchema.index({ severity: 1, timestamp: -1 })
auditLogSchema.index({ timestamp: -1 })
```

---

## Migration Notes

### No Breaking Changes
- All audit logging is additive
- Existing endpoints continue to work
- User routes now require authentication (security improvement)

### Updated Authorization
The following routes now have proper authorization:
- `POST /users/update/:id` - Requires superadmin
- `POST /users/reset-password/:id` - Requires superadmin
- `DELETE /users/delete/:id` - Requires superadmin
- `DELETE /applicants/delete/:id` - Requires admin (was checking manually)

---

## Compliance & Regulations

This audit logging system helps meet requirements for:

- **GDPR**: Track who accessed/modified personal data
- **SOC 2**: Demonstrate security controls and monitoring
- **ISO 27001**: Information security management
- **HIPAA**: Healthcare data protection (if applicable)
- **PCI DSS**: Payment card industry standards (if applicable)

---

## Testing

### Manual Testing Checklist
- [x] Create job → verify audit log entry
- [x] Update job → verify changes tracked
- [x] Delete job → verify deletion logged
- [x] Change job status → verify status change logged
- [x] Create user → verify self-logging
- [x] Update user role → verify role change tracked
- [x] Reset password → verify without password exposure
- [x] Delete user → verify critical severity
- [x] Change applicant status → verify status change
- [x] Bulk update applicants → verify bulk logging
- [x] Delete applicant → verify deletion logged
- [x] Export audit logs → verify CSV format
- [x] Filter by user → verify results
- [x] Filter by action → verify results
- [x] Filter by date range → verify results

### Automated Testing (Future)
```typescript
// Example test case
it('should log job deletion with correct severity', async () => {
    const job = await Job.create({ title: 'Test Job', ... })
    await deleteJob(job._id, adminUser)

    const auditLog = await AuditLog.findOne({
        action: 'job.deleted',
        resourceId: job._id
    })

    expect(auditLog).toBeDefined()
    expect(auditLog.severity).toBe('warning')
    expect(auditLog.userId).toBe(adminUser._id)
})
```

---

## Documentation References

- [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md) - Implementation guide
- [AUDIT_LOGGING_INTEGRATION_EXAMPLE.md](AUDIT_LOGGING_INTEGRATION_EXAMPLE.md) - Integration examples
- [CLAUDE.md](CLAUDE.md) - Project overview
- [src/lib/auditLogger.ts](src/lib/auditLogger.ts) - Core library
- [src/models/AuditLogs/](src/models/AuditLogs/) - Schema and routes

---

## Support & Contributions

### Questions?
- Review the implementation files in `src/models/AuditLogs/`
- Check examples in `AUDIT_LOGGING_INTEGRATION_EXAMPLE.md`
- Examine existing endpoint integrations in Job/User/Applicant routes

### Future Contributions
When adding audit logging to new endpoints:
1. Import `logUserAction` from `@/lib/auditLogger`
2. Call it after successful operation
3. Choose appropriate action name (follow pattern: `resource.action`)
4. Set severity level (info/warning/critical)
5. Include relevant metadata
6. Test in UI audit log viewer

---

## Summary

✅ **Complete Integration**: All critical endpoints (Job, User, Applicant) now have comprehensive audit logging

✅ **Security First**: Sensitive data sanitized, role-based access, tamper-resistant logs

✅ **Production Ready**: Indexed for performance, error handling, UI viewer included

✅ **Compliance Ready**: Meets common regulatory requirements (GDPR, SOC 2, etc.)

✅ **Future Proof**: Extensible design, prepared for advanced features

**Total Endpoints Logged**: 13
**Total Actions Defined**: 12
**Status**: ✅ Production Ready
