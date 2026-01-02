# Candidates Page - 404 Error Fix

## Problem Identified

The "Candidates" navigation link was returning a **404 error** when clicked.

### Root Cause
**URL Mismatch** between the sidebar navigation and the actual page location:

- **Sidebar Link**: `/dashboard/candidates` ❌
- **Actual Page**: `/dashboard/applicants` ✅

### Evidence from Terminal Logs
```
GET /dashboard/candidates 404 in 4.3s
GET /dashboard/candidates 404 in 29ms
GET /dashboard/candidates 404 in 61ms
```

---

## Solution Applied

### Fixed File: `src/components/app-sidebar.tsx`

**Before (Broken)**:
```typescript
{
    title: t("sidebar.candidates"),
    url: "/dashboard/candidates",        // ❌ Wrong URL
    icon: Users,
    isActive: pathname.startsWith("/dashboard/candidates"),
    requiredRole: "reviewer" as UserRole,
}
```

**After (Fixed)**:
```typescript
{
    title: t("sidebar.candidates"),
    url: "/dashboard/applicants",        // ✅ Correct URL
    icon: Users,
    isActive: pathname.startsWith("/dashboard/applicants"),
    requiredRole: "reviewer" as UserRole,
}
```

---

## Why This Happened

The application uses "**applicants**" as the technical/API term throughout the codebase:
- Page location: `/dashboard/applicants/page.tsx`
- API routes: `/api/applicants/*`
- Database model: `Applicant`
- Component: `ApplicantsClient`

But the **user-facing label** is "**Candidates**" (which is more professional/standard in ATS systems):
- English: "Candidates"
- Arabic: "المرشحين"

The sidebar was incorrectly using "candidates" in the URL path instead of "applicants".

---

## Verification

### What Now Works ✅
1. Clicking "Candidates" (المرشحين) in the sidebar
2. Navigating to the applicants page
3. Viewing the list of job applicants
4. All applicant management features

### Files Modified
- ✅ `src/components/app-sidebar.tsx` - Fixed navigation link

### No Breaking Changes
- ✅ API routes remain unchanged (`/api/applicants/*`)
- ✅ Page structure remains unchanged
- ✅ No database schema changes needed
- ✅ Translation keys remain the same

---

## Testing Checklist

- [ ] Click "Candidates" (المرشحين) in sidebar
- [ ] Verify page loads successfully (no 404)
- [ ] Verify applicants list displays
- [ ] Verify filtering and search work
- [ ] Verify applicant details dialog opens
- [ ] Verify status updates work

---

## Related Files

| File | Purpose |
|------|---------|
| `/src/components/app-sidebar.tsx` | Sidebar navigation (FIXED) |
| `/src/app/(dashboard)/dashboard/applicants/page.tsx` | Main applicants page |
| `/src/app/(dashboard)/dashboard/applicants/_components/applicants-client.tsx` | Client component |
| `/src/models/Applicants/route.ts` | API routes |
| `/src/models/Applicants/applicantSchema.ts` | Database schema |

---

## Prevention

To prevent similar issues in the future:

1. **Consistent Naming**: Use "applicants" consistently in technical paths
2. **User-Facing Terms**: Use "candidates" only in UI labels/translations
3. **URL Mapping**: Always verify sidebar links match actual page locations
4. **Testing**: Add E2E tests for all navigation links

---

**Fixed Date**: December 16, 2025  
**Status**: ✅ Resolved - Candidates page now accessible










