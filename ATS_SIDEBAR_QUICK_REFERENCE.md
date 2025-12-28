# ATS Sidebar - Quick Reference Card

## 🗂️ Navigation Structure

### Operations (العمليات)
| Icon | Item | Path | Arabic |
|------|------|------|--------|
| 📊 | Dashboard | `/dashboard` | لوحة التحكم|
| 💼 | Jobs | `/dashboard/jobs` | الوظائف |
| 👥 | Candidates | `/dashboard/candidates` | المرشحين |
| 📅 | Calendar | `/dashboard/calendar` | التقويم |

### Assessment Tools (أدوات التقييم)
| Icon | Item | Path | Arabic |
|------|------|------|--------|
| 📚 | Question Bank | `/dashboard/questions` | بنك الأسئلة |
| 📋 | Scorecards | `/dashboard/scorecards` | نماذج التقييم |
| 🎥 | Interview Insights | `/dashboard/interviews` | تحليل المقابلات |

### System Management (إدارة النظام)
| Icon | Item | Path | Arabic |
|------|------|------|--------|
| 🛡️ | Hiring Team | `/dashboard/team` | فريق التوظيف |
| ⚙️ | Settings | `/dashboard/settings` | الإعدادات |

---

## 🎯 Quick Comparison

| Aspect | Count |
|--------|-------|
| **Total Sections** | 3 |
| **Total Items** | 10 |
| **Operations Items** | 4 |
| **Assessment Items** | 3 |
| **System Items** | 2 |

---

## 🔐 Permissions

### Reviewer Role
```
✅ Operations (all)
✅ Assessment Tools (all)
❌ System Management
```

### Admin Role
```
✅ Operations (all)
✅ Assessment Tools (all)
✅ System Management (all)
```

---

## 📝 Translation Keys

### Section Headers
```typescript
t("sidebar.categories.operations")
t("sidebar.categories.assessmentTools")
t("sidebar.categories.systemManagement")
```

### Navigation Items
```typescript
t("sidebar.dashboard")
t("sidebar.jobs")
t("sidebar.candidates")
t("sidebar.calendar")
t("sidebar.questionBank")
t("sidebar.scorecards")
t("sidebar.interviews")
t("sidebar.team")
t("sidebar.settings")
```

---

## 🎨 Icons (Lucide React)

```typescript
import {
    LayoutDashboard,  // Dashboard
    Briefcase,        // Jobs
    Users,            // Candidates
    Calendar,         // Calendar
    Library,          // Question Bank
    ClipboardCheck,   // Scorecards
    Video,            // Interview Insights
    Shield,           // Hiring Team
    Settings,         // Settings
} from "lucide-react"
```

---

## ⚡ Quick Edits

### Add New Item to Operations
```typescript
{
    title: t("sidebar.categories.operations"),
    items: [
        // ... existing items
        {
            title: t("sidebar.newItem"),
            url: "/dashboard/new-item",
            icon: NewIcon,
            isActive: pathname.startsWith("/dashboard/new-item"),
            requiredRole: "reviewer" as UserRole,
        },
    ],
}
```

### Add New Section
```typescript
{
    title: t("sidebar.categories.newSection"),
    items: [
        // Section items here
    ],
}
```

### Change Permission
```typescript
requiredRole: "admin" as UserRole  // reviewer | admin | superadmin
```

---

## 🚀 What Changed

### ✅ Kept (3)
- Dashboard
- Jobs  
- Settings

### 🔄 Renamed (2)
- Applicants → Candidates
- Users → Hiring Team

### ✨ New (4)
- Calendar
- Question Bank
- Scorecards
- Interview Insights

### ❌ Removed (11)
- Content (Reading, Writing, Listening, Speaking)
- Reviews
- Analytics
- Roles
- Support
- Feedback

---

## 📦 Files Modified

| File | Changes |
|------|---------|
| `app-sidebar.tsx` | Complete refactor |
| `en.json` | -14 keys, +5 keys |
| `ar.json` | -14 keys, +5 keys |

---

## 🐛 Troubleshooting

### Section Not Showing?
1. Check user role permissions
2. Verify translation keys exist
3. Ensure items array has visible items

### Icon Not Displaying?
1. Check import from lucide-react
2. Verify icon name is correct
3. Clear build cache

### Translation Missing?
1. Check both en.json and ar.json
2. Verify full key path
3. Clear browser cache

---

## 📚 Related Documentation

- [Full Refactor Summary](./ATS_SIDEBAR_REFACTOR.md)
- [Before/After Comparison](./SIDEBAR_BEFORE_AFTER_COMPARISON.md)
- [Project Rules](./.cursorrules)

---

## ✅ Status

- **Phase:** 1 of 4 (Sidebar Update)
- **Status:** ✅ Complete
- **Linting:** ✅ No errors
- **i18n:** ✅ Full coverage
- **Permissions:** ✅ Working
- **Production:** ✅ Ready

---

**Last Updated:** December 15, 2025

