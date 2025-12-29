# Direct Link Hiring - UI Flow Diagram

## Jobs Table Row - Enhanced Dropdown Menu

```
┌─────────────────────────────────────────────────────────────────┐
│  Job Row: "Senior Marketing Manager"                           │
│  [Briefcase Icon] Senior Marketing Manager    Active  [...] ←  │
└─────────────────────────────────────────────────────────────────┘
                                                           │
                                                           ▼
                          ┌────────────────────────────────────────┐
                          │  Dropdown Actions Menu                 │
                          ├────────────────────────────────────────┤
                          │  🔗 Copy Application Link  ← PRIORITY  │
                          ├────────────────────────────────────────┤
                          │  🚫 Close Hiring  ← QUICK TOGGLE       │
                          │    (or ✅ Activate Hiring if closed)  │
                          ├────────────────────────────────────────┤
                          │  🔗 Preview Page                       │
                          │  👁️  View                             │
                          │  ❓ Questions                          │
                          │  👥 Applicants                         │
                          ├────────────────────────────────────────┤
                          │  ✏️  Edit                              │
                          ├────────────────────────────────────────┤
                          │  🗑️  Delete                            │
                          └────────────────────────────────────────┘
```

### Action Behaviors:

1. **Copy Application Link**
   - ✅ Copies: `https://yourdomain.com/apply/[jobId]`
   - ✅ Shows toast: "Link copied to clipboard!"
   - ✅ No page navigation

2. **Close Hiring / Activate Hiring**
   - ✅ Instant status toggle (Active ↔ Closed)
   - ✅ No dialog/form needed
   - ✅ Auto-refreshes job list
   - ✅ Shows success toast
   - ✅ Only visible for Active/Closed jobs

3. **Preview Page**
   - ✅ Opens: `https://yourdomain.com/apply/[jobId]`
   - ✅ Opens in NEW TAB
   - ✅ Shows public-facing job page

---

## View Job Modal - Share Section

```
┌───────────────────────────────────────────────────────────────────┐
│  [X] View Job Details                                             │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ [💼] Senior Marketing Manager                               │ │
│  │ [Active Badge] Full Time                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  🔗 Share This Job                                        ║  │
│  ║                                                           ║  │
│  ║  Job Application URL                                      ║  │
│  ║  ┌─────────────────────────────────┐  ┌──────────────┐  ║  │
│  ║  │ https://domain.com/apply/[id]   │  │ 📋 Copy Link │  ║  │
│  ║  └─────────────────────────────────┘  └──────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                   │
│  📊 Quick Info                                                    │
│  • Department: Marketing                                          │
│  • Location: Dubai, UAE                                           │
│  • Salary: $5,000 - $8,000                                        │
│  • Created: December 15, 2025                                     │
│                                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                   │
│  📝 Description                                                   │
│  [Job description content...]                                     │
│                                                                   │
│  [Rest of job details...]                                         │
└───────────────────────────────────────────────────────────────────┘
```

### Share Section Features:

- **Position:** Very top of modal content (after header)
- **Visual Priority:** Gradient background with border
- **URL Field:** Read-only, monospace, LTR direction
- **Copy Button:** Large, prominent, gradient styled
- **Behavior:** One-click copy with toast notification

---

## User Journey Flow

```
┌─────────────────┐
│  Jobs List Page │
└────────┬────────┘
         │
         ├─────────────────────────────────────────────────┐
         │                                                 │
         ▼                                                 ▼
┌────────────────────┐                        ┌───────────────────┐
│  Click [...] Menu  │                        │   Click Job Row   │
└────────┬───────────┘                        └─────────┬─────────┘
         │                                              │
         ├──────────┬──────────┬──────────┐           │
         │          │          │          │           ▼
         ▼          ▼          ▼          ▼   ┌────────────────┐
    ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │  View Job Modal │
    │ Copy │  │Toggle│  │Preview│  │ View │  └────────┬───────┘
    │ Link │  │Status│  │ Page │  │ Job  │           │
    └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘           │
       │         │         │         │               │
       ▼         ▼         ▼         └───────────────┘
   ┌──────┐  ┌──────┐  ┌──────┐            │
   │Toast │  │Toast │  │ New  │            ▼
   │ Show │  │+     │  │ Tab  │    ┌────────────────┐
   └──────┘  │Refresh│ │Opens │    │ Click Copy Link│
             └──────┘  └──────┘    └────────┬───────┘
                                            │
                                            ▼
                                    ┌────────────────┐
                                    │  Toast Shows   │
                                    └────────────────┘
```

---

## Status Toggle Logic

```
Current Status: DRAFT
─────────────────────
• Quick Toggle: NOT SHOWN
• Reason: Draft jobs are not yet published
• Action: Use Edit form to change to Active

Current Status: ACTIVE
─────────────────────
• Quick Toggle: "🚫 Close Hiring"
• Behavior: Immediately changes to CLOSED
• Toast: "Hiring closed successfully"
• Effect: Applications disabled

Current Status: CLOSED
─────────────────────
• Quick Toggle: "✅ Activate Hiring"
• Behavior: Immediately changes to ACTIVE
• Toast: "Hiring activated successfully"
• Effect: Applications enabled

Current Status: ARCHIVED
─────────────────────
• Quick Toggle: NOT SHOWN
• Reason: Archived jobs require full edit
• Action: Use Edit form to change status
```

---

## Link Accessibility Matrix

### Draft Jobs
| Action | Behavior |
|--------|----------|
| Copy Link | ✅ Copies link (but not accessible publicly) |
| Preview Page | ⚠️ Opens but shows "Job not found" or "Coming soon" |
| Status Toggle | ❌ Not shown |

### Active Jobs
| Action | Behavior |
|--------|----------|
| Copy Link | ✅ Copies accessible link |
| Preview Page | ✅ Opens working public page |
| Status Toggle | ✅ "Close Hiring" option shown |

### Closed Jobs
| Action | Behavior |
|--------|----------|
| Copy Link | ✅ Copies link (may show "closed" message) |
| Preview Page | ⚠️ Opens but shows "No longer accepting applications" |
| Status Toggle | ✅ "Activate Hiring" option shown |

### Archived Jobs
| Action | Behavior |
|--------|----------|
| Copy Link | ✅ Copies link (historical reference) |
| Preview Page | ⚠️ Opens but shows "Archived" message |
| Status Toggle | ❌ Not shown |

---

## Mobile Responsive Considerations

### Jobs Table (Mobile)
```
┌─────────────────────────┐
│  [💼] Senior Marketing  │
│  Manager                │
│  Active • Full Time     │
│              [...] ←    │
└─────────────────────────┘
         │
         ▼
    [Full Dropdown Menu]
    (Same options, stacked)
```

### Share Section (Mobile)
```
┌─────────────────────────┐
│  🔗 Share This Job      │
├─────────────────────────┤
│  [URL Input Field]      │
│  (Full width)           │
├─────────────────────────┤
│  [Copy Link Button]     │
│  (Full width)           │
└─────────────────────────┘
```

---

## Accessibility Features

### Keyboard Navigation
- ✅ Tab through dropdown items
- ✅ Enter/Space to activate actions
- ✅ Escape to close dropdown/modal
- ✅ Focus indicators visible

### Screen Readers
- ✅ Descriptive button labels
- ✅ Status announcements via toast
- ✅ Clear action outcomes
- ✅ Proper ARIA labels (via shadcn/ui)

### Visual Indicators
- ✅ Icons accompany all actions
- ✅ Color coding for status
- ✅ Gradient backgrounds for emphasis
- ✅ Clear hover states

---

## Design Principles Applied

1. **Priority-Based Ordering**
   - Most common action (Copy Link) at top
   - Destructive actions (Delete) at bottom

2. **Progressive Disclosure**
   - Quick actions in dropdown
   - Detailed view in modal
   - Share section prominent but not intrusive

3. **Consistent Feedback**
   - Toast notifications for all actions
   - Visual state changes
   - Clear error messages

4. **Minimal Friction**
   - One-click operations
   - No unnecessary confirmations
   - Direct access to common tasks

5. **Bilingual Excellence**
   - RTL-aware layouts
   - Proper Arabic typography
   - Consistent terminology







