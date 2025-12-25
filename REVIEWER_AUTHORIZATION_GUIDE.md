# Reviewer Authorization System - Complete Guide

## Overview

This document outlines the comprehensive authorization system implemented for the reviewer role in the goielts recruitment platform. The system ensures proper access control, data filtering, and security across all API endpoints.

## Role Hierarchy

The application uses a three-tier role hierarchy:

| Role | Level | Permissions |
|------|-------|-------------|
| `reviewer` | 1 | View and evaluate candidates, submit reviews |
| `admin` | 2 | All reviewer permissions + job management, team management |
| `superadmin` | 3 | All admin permissions + user role management |

## Authorization Middleware

### Location
- `src/lib/authMiddleware.ts`

### Key Functions

#### `authenticate(c, next)`
Verifies the user's session and attaches user information to the request context.

```typescript
// Usage in routes
app.get('/endpoint', authenticate, async (c) => {
  const user = getAuthUser(c)
  // user contains: userId, email, name, role
})
```

#### `requireRole(requiredRole)`
Checks if the authenticated user has the minimum required role.

```typescript
// Usage in routes - require admin role
app.post('/add', authenticate, requireRole('admin'), async (c) => {
  // Only admin and superadmin can access
})
```

#### `getAuthUser(c)`
Retrieves the authenticated user from the request context.

```typescript
const user = getAuthUser(c)
// Returns: { userId, email, name, role }
```

## Reviewer Permissions Matrix

### ✅ What Reviewers CAN Do

| Action | Endpoint | Notes |
|--------|----------|-------|
| View dashboard | `GET /dashboard` | Reviewer-specific stats |
| List all jobs | `GET /api/jobs/list` | Read-only access |
| View job details | `GET /api/jobs/:id` | Read-only access |
| List applicants | `GET /api/applicants/list` | With data filtering |
| View applicant details | `GET /api/applicants/:id` | Sensitive data hidden |
| View evaluations | `GET /api/evaluations/*` | Red flags hidden |
| Submit manual review | `POST /api/evaluations/update/:id` | Add notes and recommendation |
| Update applicant status | `POST /api/applicants/update/:id` | Change status, add notes |
| View statistics | `GET /api/*/stats/*` | Read-only stats |

### ❌ What Reviewers CANNOT Do

| Action | Endpoint | Required Role |
|--------|----------|---------------|
| Create jobs | `POST /api/jobs/add` | `admin` |
| Update jobs | `PATCH /api/jobs/:id` | `admin` |
| Delete jobs | `DELETE /api/jobs/delete/:id` | `admin` |
| Toggle job status | `POST /api/jobs/toggle-status/:id` | `admin` |
| Delete applicants | `DELETE /api/applicants/delete/:id` | `admin` |
| Manage team | `/dashboard/team` | `admin` |
| Access settings | `/dashboard/settings` | `admin` |
| Manage users | `/dashboard/users` | `admin` |
| Change user roles | `POST /api/users/update-role` | `superadmin` |

## Data Filtering for Reviewers

### Applicant Data

**Hidden Fields:**
- `salaryExpectation` - Salary information is not visible
- `aiRedFlags` - AI-detected concerns are hidden from reviewers

**Visible Fields:**
- Personal data (name, email, phone, age)
- CV and parsed data
- Status and tags
- AI score and summary
- Manual notes

### Evaluation Data

**Hidden Fields:**
- `redFlags` - AI-generated red flags array

**Visible Fields:**
- Overall score
- Criteria matches
- Strengths and weaknesses
- Summary and recommendation
- Manual recommendation and notes
- Voice analysis details
- Social profile insights
- Text response analysis

## Implementation Details

### Routes Updated

#### 1. Evaluations (`src/models/Evaluations/route.ts`)

```typescript
// Before (INSECURE)
app.get('/by-applicant/:applicantId', async (c) => {
  const userRole = c.req.query('role') || 'admin' // ❌ Role from query param
  const isReviewer = userRole === 'reviewer'
})

// After (SECURE)
app.get('/by-applicant/:applicantId', authenticate, async (c) => {
  const user = getAuthUser(c) // ✅ Role from session
  const isReviewer = user.role === 'reviewer'
})
```

**Updated Routes:**
- `GET /by-applicant/:applicantId` - Added authentication
- `POST /batch-by-applicants` - Added authentication
- `GET /by-job/:jobId` - Added authentication
- `POST /update/:id` - Added authentication, uses session userId
- `GET /top-candidates/:jobId` - Added authentication

#### 2. Applicants (`src/models/Applicants/route.ts`)

**Updated Routes:**
- `GET /list` - Added authentication
- `GET /:id` - Added authentication
- `POST /update/:id` - Added authentication
- `POST /bulk-update` - Added authentication
- `DELETE /delete/:id` - Added authentication + reviewer restriction
- `GET /stats/:jobId` - Added authentication

**Reviewer Restriction Example:**
```typescript
app.delete('/delete/:id', authenticate, async (c) => {
  const user = getAuthUser(c)

  if (user.role === 'reviewer') {
    return c.json({
      success: false,
      error: 'Reviewers cannot delete applicants'
    }, 403)
  }
})
```

#### 3. Jobs (`src/models/Jobs/route.ts`)

**Updated Routes:**
- `POST /add` - Added `authenticate` + `requireRole('admin')`
- `GET /list` - Added `authenticate` (all roles)
- `GET /:id` - Added `authenticate` (all roles)
- `PATCH /:id` - Added `authenticate` + `requireRole('admin')`
- `POST /update/:id` - Added `authenticate` + `requireRole('admin')`
- `POST /toggle-status/:id` - Added `authenticate` + `requireRole('admin')`
- `DELETE /delete/:id` - Added `authenticate` + `requireRole('admin')`
- `GET /stats/overview` - Added `authenticate` (all roles)
- `GET /stats/actionable` - Added `authenticate` (all roles)

## UI Integration

### Sidebar Navigation (`src/components/app-sidebar.tsx`)

The sidebar dynamically filters menu items based on user role:

```typescript
{items
  .filter(item => {
    if (item.requiredRole) {
      return hasPermission(session.role, item.requiredRole)
    }
    return true
  })
  .map(item => (
    <SidebarMenuItem key={item.title}>
      {/* Render menu item */}
    </SidebarMenuItem>
  ))
}
```

**Reviewer Visible:**
- Dashboard
- Jobs (read-only)
- Candidates
- Calendar
- Question Bank
- Scorecards
- Interviews

**Admin Only:**
- Team
- Settings

### Page-Level Guards

**Protected Pages:**
```typescript
// src/app/(dashboard)/dashboard/team/page.tsx
export default async function TeamPage() {
  const session = await verifySession()

  if (!session || !hasPermission(session.role, 'admin')) {
    redirect('/dashboard')
  }

  return <TeamPageContent />
}
```

## Security Improvements

### Before (Vulnerabilities)

1. **Query Parameter Injection:** Role passed as query parameter could be manipulated
2. **No Server-Side Validation:** Client could bypass UI restrictions
3. **Inconsistent Authorization:** Some routes had no role checks
4. **userId as Query Param:** User ID passed in URL instead of from session

### After (Secure)

1. **Session-Based Authentication:** All user info from secure JWT session
2. **Middleware Enforcement:** Every protected route uses middleware
3. **Consistent Authorization:** Role checks applied uniformly
4. **Automatic User Context:** userId and role from authenticated session

## Testing the Authorization System

### 1. Test Reviewer Access

```bash
# Login as reviewer
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "reviewer@example.com", "password": "password"}'

# Try to create a job (should fail)
curl -X POST http://localhost:3000/api/jobs/add \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session-token>" \
  -d '{"title": "Test Job"}' \
  # Expected: 403 Forbidden

# View applicants (should succeed with filtered data)
curl http://localhost:3000/api/applicants/list \
  -H "Cookie: session=<your-session-token>"
  # Expected: 200 OK (no salary or redFlags)
```

### 2. Test Data Filtering

```bash
# Get applicant as reviewer
curl http://localhost:3000/api/applicants/<id> \
  -H "Cookie: session=<reviewer-session>"
  # Verify: salaryExpectation is undefined
  # Verify: aiRedFlags is undefined

# Get evaluation as reviewer
curl http://localhost:3000/api/evaluations/by-applicant/<id> \
  -H "Cookie: session=<reviewer-session>"
  # Verify: redFlags is empty array
```

### 3. Test Admin Access

```bash
# Login as admin
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Create a job (should succeed)
curl -X POST http://localhost:3000/api/jobs/add \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<admin-session>" \
  -d '{"title": "New Job", ...}'
  # Expected: 201 Created

# View applicants (should see all data)
curl http://localhost:3000/api/applicants/<id> \
  -H "Cookie: session=<admin-session>"
  # Verify: salaryExpectation is present
  # Verify: aiRedFlags is present
```

## Migration Guide

### For Existing Code

If you have existing code that passes `role` or `userId` as query parameters, update it:

```typescript
// OLD (Don't use)
const response = await fetch(`/api/applicants/list?role=reviewer&userId=123`)

// NEW (Correct)
const response = await fetch('/api/applicants/list') // Role and userId from session
```

### For New Routes

Always add authentication middleware to protected routes:

```typescript
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'

// Public route (no authentication needed)
app.get('/public', async (c) => {
  // Anyone can access
})

// Protected route (all authenticated users)
app.get('/protected', authenticate, async (c) => {
  const user = getAuthUser(c)
  // All authenticated users can access
})

// Admin-only route
app.post('/admin', authenticate, requireRole('admin'), async (c) => {
  const user = getAuthUser(c)
  // Only admin and superadmin can access
})
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "details": "This action requires admin role or higher"
}
```

### 403 Reviewer Restriction
```json
{
  "success": false,
  "error": "Reviewers cannot delete applicants"
}
```

## Best Practices

1. **Always use middleware:** Never implement custom auth logic in routes
2. **Check permissions server-side:** UI restrictions are not security
3. **Filter sensitive data:** Apply data filtering based on role
4. **Use session data:** Never trust client-provided role/userId
5. **Test thoroughly:** Verify both authorized and unauthorized access
6. **Document changes:** Update this guide when adding new permissions

## Future Enhancements

### Planned Improvements

1. **Assignment-Based Access:** Reviewers only see assigned candidates
2. **Audit Logging:** Track all reviewer actions
3. **Time-Based Access:** Restrict access to specific review periods
4. **Review Quotas:** Limit number of reviews per reviewer
5. **Blind Review Mode:** Hide candidate personal info during review
6. **Review Conflicts:** Flag when reviewer has conflict of interest

### Potential Features

- Review reassignment by admin
- Reviewer performance metrics
- Collaborative reviews (multiple reviewers per candidate)
- Review approval workflow
- Reviewer training mode (view-only practice)

## Support

For issues or questions about the authorization system:
1. Check this documentation first
2. Review the middleware implementation at `src/lib/authMiddleware.ts`
3. Examine route implementations for examples
4. Refer to the central API router at `src/app/api/[[...route]]/route.ts`

---

**Last Updated:** December 25, 2024
**Version:** 1.0.0
**Author:** Claude Sonnet 4.5
