# Quick Start Guide - Dashboard Enhancements

## 🚀 Installation (5 Minutes)

### Step 1: Install Dependencies
```bash
bun add jspdf jspdf-autotable
```

### Step 2: Register Notification API Routes

Open `src/app/api/[[...route]]/route.ts` and add:

```typescript
import notifications from '@/models/Notifications/route'

// Find the routes section and add:
const routes = app
    .route('/users', users)
    .route('/jobs', jobs)
    .route('/applicants', applicants)
    .route('/notifications', notifications) // ← ADD THIS LINE
    .route('/ai/evaluate', evaluationProcessing)
    // ... rest of your routes
```

### Step 3: Add Notifications to Header/Navbar

Find your dashboard header component and add:

```typescript
import { NotificationsDropdown } from "@/components/notifications-dropdown"

// In your header JSX, add alongside other icons:
<NotificationsDropdown userId={session.userId} />
```

### Step 4: Test the Dashboard

1. **Login as different roles:**
   - Super Admin: Should see user management
   - Admin: Should see full dashboard with charts
   - Reviewer: Should see evaluation queue only

2. **Test Export:**
   - Navigate to applicants page
   - Click Export button
   - Test CSV, Excel, and PDF downloads

3. **Test Notifications:**
   - Create a test notification via API or trigger one by submitting an application
   - Check the bell icon for badge count
   - Click to view notifications

---

## 📋 Features Overview

### For Super Admins
- ✅ Platform-wide user management
- ✅ System health monitoring
- ✅ Create/Edit/Deactivate users

### For Admins (Recruiters)
- ✅ Action Required dashboard
- ✅ Hiring funnel visualization
- ✅ Application trends (30-day chart)
- ✅ Export reports (CSV/Excel/PDF)
- ✅ Date range filtering

### For Reviewers
- ✅ Clean evaluation queue
- ✅ Pending reviews counter
- ✅ **Blind hiring** (no salary data)
- ✅ Notification alerts for assigned reviews

---

## 🧪 Testing Checklist

- [ ] Login as Super Admin → See user management
- [ ] Login as Admin → See full dashboard with charts
- [ ] Login as Reviewer → See only evaluation queue
- [ ] Test CSV export
- [ ] Test Excel export
- [ ] Test PDF export
- [ ] Create a test notification
- [ ] Mark notification as read
- [ ] Delete a notification
- [ ] Create a new user via Super Admin
- [ ] Edit user role
- [ ] Deactivate a user

---

## 🐛 Common Issues

### Issue: "Cannot find module 'jspdf'"
**Fix:** Run `bun add jspdf jspdf-autotable`

### Issue: Notifications not loading
**Check:**
1. Did you register `/api/notifications` route?
2. Is MongoDB running?
3. Check browser console for errors

### Issue: Export button not showing
**Check:** Did you import and add `<ExportButton>` component?

---

## 📚 Documentation

For detailed implementation guide, see:
- [DASHBOARD_ENHANCEMENTS_IMPLEMENTATION.md](./DASHBOARD_ENHANCEMENTS_IMPLEMENTATION.md)

---

**That's it! You're ready to go! 🎉**
