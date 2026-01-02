# UI Preview: Screening Questions & Languages Sections

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Personal Information Form                         │
├─────────────────────────────────────────────────────────────────────┤
│  Name: [________________]    Email: [________________]              │
│                                                                      │
│  Phone: [___________]  Age: [___]  Major: [________________]       │
│                                                                      │
│  Years of Experience: [___]  Salary Expectation: [__________] SAR  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  🛡️ أسئلة الفرز / Screening Questions                              │
│  يرجى الإجابة على هذه الأسئلة بصدق                                 │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Do you have a valid work permit?    [⚠️ Critical Question]│     │
│  │                                                            │     │
│  │  ⦿ Yes    ○ No                                            │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Can you work full-time on-site?                           │     │
│  │                                                            │     │
│  │  ○ Yes    ○ No                                            │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  🌐 اللغات / Languages                                             │
│  يرجى تحديد مستوى كفاءتك في اللغات المطلوبة                       │
│                                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────┐         │
│  │ English [Required: Adv] │  │ Arabic [Required: Nat]  │         │
│  │ Proficiency (advanced)   │  │ Proficiency (native)    │         │
│  │                         │  │                         │         │
│  │ [Select Level ▼]        │  │ [Select Level ▼]        │         │
│  │  • Beginner             │  │  • Beginner             │         │
│  │  • Intermediate         │  │  • Intermediate         │         │
│  │  • Advanced             │  │  • Advanced             │         │
│  │  • Native               │  │  • Native               │         │
│  └─────────────────────────┘  └─────────────────────────┘         │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  LinkedIn: [https://...]    Portfolio: [https://...]               │
│                                                                      │
│  [        Continue to Assessment        ]                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Screening Questions Section

**Header:**
- Icon: 🛡️ `ShieldAlert`
- Title: "أسئلة الفرز" / "Screening Questions"
- Description: "يرجى الإجابة على هذه الأسئلة بصدق" / "Please answer these questions honestly"

**Question Card:**
```tsx
┌────────────────────────────────────────────────────────┐
│ Question text here                  [⚠️ Critical]      │ ← Badge shown if disqualify: true
│                                                         │
│ ⦿ Yes    ○ No                                          │ ← Radio buttons (RTL aware)
└────────────────────────────────────────────────────────┘
```

**Styling:**
- Border: `border rounded-lg`
- Background: `bg-muted/30`
- Padding: `p-4`
- Badge (disqualify): `variant="destructive"` with text "Critical Question"

### 2. Languages Section

**Header:**
- Icon: 🌐 `Languages`
- Title: "اللغات" / "Languages"
- Description: "يرجى تحديد مستوى كفاءتك في اللغات المطلوبة" / "Please indicate your proficiency in the required languages"

**Language Card:**
```tsx
┌────────────────────────────────┐
│ English [Required: Advanced]    │ ← Language name + badge
│ Proficiency (advanced)          │ ← Helper text
│                                 │
│ [Select Level ▼]                │ ← Dropdown selector
│   • Beginner                    │
│   • Intermediate                │
│   • Advanced                    │
│   • Native                      │
└────────────────────────────────┘
```

**Styling:**
- Border: `border rounded-lg`
- Background: `bg-muted/30`
- Padding: `p-4`
- Grid: `md:grid-cols-2` (2 columns on desktop)
- Badge: `variant="secondary"` showing required level

## Knockout Behavior

### Scenario 1: User Answers "No" to Critical Question
```
User Action: Clicks "No" on "Do you have a valid work permit?"
             [Disqualify: true]

Result:
┌────────────────────────────────────────────────────────┐
│  ❌ لا يمكن المتابعة في التقديم                         │
│                                                         │
│  للأسف، أنت لا تستوفي الحد الأدنى من المتطلبات لهذه   │
│  الوظيفة. شكراً لاهتمامك.                              │
└────────────────────────────────────────────────────────┘

Form submission is BLOCKED.
```

### Scenario 2: User Answers "Yes" to All Questions
```
User Action: Selects "Yes" for all screening questions
             + Selects proficiency levels for all languages

Result:
✅ Form validation passes
✅ User can proceed to assessment
✅ Data is stored in database
```

## Color Scheme

### Light Mode
- Section background: `bg-muted/30` (light gray with transparency)
- Question card: `border` with `bg-muted/30`
- Critical badge: `bg-destructive` (red)
- Required badge: `bg-secondary` (gray)
- Text: `text-foreground` / `text-muted-foreground`

### Dark Mode
- Section background: `bg-muted/30` (dark gray with transparency)
- Question card: `border` with `bg-muted/30`
- Critical badge: `bg-destructive` (darker red)
- Required badge: `bg-secondary` (lighter gray)
- Text: Adjusted for dark theme

## RTL Support (Arabic)

### Layout Changes
```
English (LTR):                      Arabic (RTL):
┌─────────────────────┐            ┌─────────────────────┐
│ [Icon] Title        │            │        Title [Icon] │
│ ⦿ Yes    ○ No       │            │       لا ○    نعم ⦿ │
│ Badge [Secondary]   │            │   [Secondary] Badge │
└─────────────────────┘            └─────────────────────┘
```

**Implementation:**
- `dir={isRTL ? "rtl" : "ltr"}` on all form controls
- `rtl:space-x-reverse` for spacing
- `ml-2 rtl:ml-0 rtl:mr-2` for margins
- Icons positioned correctly for both directions

## Responsive Design

### Mobile (< 768px)
- Single column layout
- Full width cards
- Stacked form fields

### Desktop (≥ 768px)
- Two column grid for language selection
- Side-by-side form fields
- Optimized spacing

## Accessibility Features

1. **Proper Labels:** All form controls have associated labels
2. **ARIA Labels:** Radio groups and select dropdowns have proper ARIA attributes
3. **Error Messages:** Clear validation messages in user's language
4. **Keyboard Navigation:** Tab order is logical and intuitive
5. **Focus Indicators:** Visible focus states on all interactive elements
6. **Screen Reader Support:** Semantic HTML with proper roles

## Example Data Structure

### Submitted Data
```json
{
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "phone": "+966501234567",
  "age": 28,
  "major": "Computer Science",
  "yearsOfExperience": 5,
  "salaryExpectation": 15000,
  "screeningAnswers": {
    "Do you have a valid work permit?": true,
    "Can you work full-time on-site?": true
  },
  "languageProficiency": {
    "English": "advanced",
    "Arabic": "native"
  },
  "linkedinUrl": "https://linkedin.com/in/ahmed",
  "portfolioUrl": "https://portfolio.ahmed.com"
}
```

## Animation & Transitions

- Section appearance: `animate-in fade-in slide-in-from-bottom-4`
- Hover states: `hover:bg-accent` on clickable elements
- Focus states: `focus:ring-2 focus:ring-primary`
- Smooth transitions: `transition-all duration-300`

## Edge Cases Handled

1. **No Screening Questions:** Section doesn't render
2. **No Languages:** Section doesn't render
3. **All Questions Optional:** Form can be submitted without answers
4. **Mixed Question Types:** Both critical and non-critical questions supported
5. **Empty Form:** Proper validation messages in user's language









