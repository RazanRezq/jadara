# Ultimate Job Wizard - Developer Quick Reference

## 🔧 Technical Implementation Guide

### File Structure
```
src/
├── app/(dashboard)/dashboard/jobs/_components/wizard/
│   ├── step-1-basics.tsx          ✅ MODIFIED (Pro Tip added)
│   ├── step-2-criteria.tsx        ✅ REFACTORED (4 sections)
│   ├── ai-actions.ts              ✅ ENHANCED (Skill extraction)
│   ├── types.ts                   ✅ UPDATED (New schemas)
│   └── ...
├── models/Jobs/
│   └── jobSchema.ts               ✅ UPDATED (New fields)
└── i18n/locales/
    ├── ar.json                    ✅ UPDATED (30+ keys)
    └── en.json                    ✅ UPDATED (30+ keys)
```

---

## 🎯 Key Components

### 1. AI Skills Extraction

**Function:** `extractSkillsFromDescription()`  
**Location:** `src/app/(dashboard)/dashboard/jobs/_components/wizard/ai-actions.ts`

```typescript
// Usage
const result = await extractSkillsFromDescription({
    jobTitle: "Frontend Developer",
    description: "We need someone with React and Node.js..."
})

// Returns
{
    success: true,
    skills: [
        {
            name: "React",
            type: "technical",
            importance: "must_have",
            reason: "explicit"
        },
        // ... more skills
    ]
}
```

**AI Prompt Strategy:**
- Extracts 5-10 explicit skills from description
- Infers 3-5 standard skills based on job title
- Categorizes as technical/soft
- Marks as must_have/nice_to_have
- Returns clean JSON (no markdown)

---

### 2. Form Schema

**Location:** `src/app/(dashboard)/dashboard/jobs/_components/wizard/types.ts`

```typescript
// Enhanced Skill Schema
export const skillSchema = z.object({
    name: z.string().min(1),
    importance: z.enum(['required', 'preferred']),
    type: z.enum(['technical', 'soft']).optional(),
    reason: z.enum(['explicit', 'inferred']).optional(),
})

// New: Screening Question Schema
export const screeningQuestionSchema = z.object({
    question: z.string().min(1),
    disqualify: z.boolean(),
})

// New: Language Schema
export const languageSchema = z.object({
    language: z.string().min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
})
```

---

### 3. MongoDB Schema

**Location:** `src/models/Jobs/jobSchema.ts`

```typescript
// IJob interface additions
export interface IJob extends Document {
    // ... existing fields
    
    // Enhanced Skills
    skills: ISkill[]  // Now with type and reason
    
    // NEW: Screening Questions
    screeningQuestions: IScreeningQuestion[]
    
    // NEW: Languages
    languages: ILanguage[]
    
    minExperience: number
    autoRejectThreshold: number
}

// Mongoose Schemas
const skillSchema = new Schema<ISkill>({
    name: { type: String, required: true, trim: true },
    importance: { type: String, enum: ['required', 'preferred'] },
    type: { type: String, enum: ['technical', 'soft'] },
    reason: { type: String, enum: ['explicit', 'inferred'] },
}, { _id: false })

const screeningQuestionSchema = new Schema<IScreeningQuestion>({
    question: { type: String, required: true, trim: true },
    disqualify: { type: Boolean, default: false },
}, { _id: false })

const languageSchema = new Schema<ILanguage>({
    language: { type: String, required: true, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'native'] },
}, { _id: false })
```

---

## 🎨 UI Component Patterns

### Pattern 1: Section Container
```tsx
<div className="space-y-4 p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
    <div className="flex items-start justify-between">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    </div>
    {/* Content */}
</div>
```

### Pattern 2: Interactive Chip/Badge
```tsx
<Badge
    variant="outline"
    className="cursor-pointer px-3 py-2 text-sm bg-white dark:bg-background border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:scale-105 shadow-sm"
    onClick={() => handleAddSkill(skill.name)}
>
    {skill.name}
    <span className="ms-2 text-xs opacity-70">
        ({skill.type})
    </span>
</Badge>
```

### Pattern 3: List Item with Controls
```tsx
<div className="flex items-center gap-3 p-4 border rounded-lg bg-background hover:shadow-md transition-all">
    <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => removeItem(index)}
    >
        <Trash2 className="h-4 w-4" />
    </Button>
    
    <Input
        value={item.value}
        onChange={(e) => updateItem(index, e.target.value)}
        className="flex-1"
    />
    
    <Select
        value={item.level}
        onValueChange={(value) => updateItem(index, value)}
    >
        {/* Options */}
    </Select>
</div>
```

---

## 🔌 Integration Points

### 1. API Integration
```typescript
// When submitting form
const formData = {
    // Step 1 fields...
    title: "Frontend Developer",
    description: "...",
    
    // Step 2 enhanced fields
    skills: [
        { name: "React", importance: "required", type: "technical", reason: "explicit" }
    ],
    screeningQuestions: [
        { question: "Do you have work permit?", disqualify: true }
    ],
    languages: [
        { language: "English", level: "advanced" }
    ],
    minExperience: 3,
    autoRejectThreshold: 35,
    
    // Other steps...
}

// POST to /api/jobs/add
const response = await fetch('/api/jobs/add', {
    method: 'POST',
    body: JSON.stringify(formData)
})
```

### 2. Reading Job Data
```typescript
// When editing existing job
const job = await fetch(`/api/jobs/job/${id}`).then(r => r.json())

// Populate form
form.reset({
    ...job,
    skills: job.skills || [],
    screeningQuestions: job.screeningQuestions || [],
    languages: job.languages || [],
})
```

---

## 🎯 State Management

### Form State Structure
```typescript
const form = useForm<JobWizardFormValues>({
    resolver: zodResolver(jobWizardSchema),
    defaultValues: {
        // Step 1
        title: '',
        description: '',
        // ...
        
        // Step 2
        skills: [],                    // Array of Skill objects
        screeningQuestions: [],        // Array of ScreeningQuestion objects
        languages: [],                 // Array of Language objects
        minExperience: 0,              // Number (0-15)
        autoRejectThreshold: 35,       // Number (0-100)
    }
})
```

### Local State for AI Results
```typescript
const [extractedSkills, setExtractedSkills] = useState<{
    essential: Array<{ name: string; type: string; reason: string }>
    bonus: Array<{ name: string; type: string; reason: string }>
} | null>(null)

const [isExtractingSkills, setIsExtractingSkills] = useState(false)
```

---

## 🌐 Translation Keys

### Step 1 (Pro Tip)
```typescript
t("jobWizard.step1.proTipTitle")     // "💡 Pro Tip"
t("jobWizard.step1.proTipContent")   // Full tip text
```

### Step 2 (AI Skills)
```typescript
t("jobWizard.step2.aiSkillsIntelligence")  // Section title
t("jobWizard.step2.extractSkills")         // Button text
t("jobWizard.step2.extracting")            // Loading state
t("jobWizard.step2.essentialSkills")       // "🔥 Essential Skills"
t("jobWizard.step2.bonusSkills")           // "🌟 Bonus Skills"
t("jobWizard.step2.technical")             // "Technical"
t("jobWizard.step2.soft")                  // "Soft Skill"
```

### Step 2 (Screening)
```typescript
t("jobWizard.step2.screeningQuestions")     // Section title
t("jobWizard.step2.addScreeningQuestion")   // Button text
t("jobWizard.step2.disqualifyIfNo")         // Toggle label
t("jobWizard.step2.disqualifying")          // Badge text
```

### Step 2 (Languages)
```typescript
t("jobWizard.step2.languages")           // Section title
t("jobWizard.step2.addLanguage")         // Button text
t("jobWizard.step2.languageName")        // Input label
t("jobWizard.step2.proficiencyLevel")    // Select label
t("jobWizard.step2.beginner")            // Level option
t("jobWizard.step2.intermediate")        // Level option
t("jobWizard.step2.advanced")            // Level option
t("jobWizard.step2.native")              // Level option
```

---

## 🚀 Performance Optimizations

### 1. AI Response Caching
```typescript
// Consider caching AI results per job description hash
const descriptionHash = hashString(description)
const cachedResult = cache.get(descriptionHash)
if (cachedResult) return cachedResult
```

### 2. Debounced Updates
```typescript
// For real-time skill name updates
const debouncedUpdate = useMemo(
    () => debounce((index, value) => {
        updateSkill(index, 'name', value)
    }, 300),
    []
)
```

### 3. Memoized Components
```typescript
// For skill list items
const SkillItem = memo(({ skill, onUpdate, onRemove }) => {
    // Component logic
})
```

---

## 🐛 Error Handling

### AI Extraction Errors
```typescript
try {
    const result = await extractSkillsFromDescription(...)
    if (!result.success) {
        toast.error(result.error || 'Failed to extract skills')
        return
    }
    // Handle success
} catch (error) {
    console.error('Extraction error:', error)
    toast.error('Unexpected error occurred')
}
```

### Form Validation
```typescript
// Zod handles validation
form.handleSubmit(
    (data) => {
        // Valid data
    },
    (errors) => {
        // Show first error
        const firstError = Object.values(errors)[0]
        toast.error(firstError?.message)
    }
)
```

---

## 🧪 Testing Considerations

### Unit Tests
```typescript
// Test AI extraction parsing
test('parses AI response correctly', () => {
    const mockResponse = '[{"name":"React","type":"technical",...}]'
    const parsed = parseAISkills(mockResponse)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('React')
})

// Test form validation
test('validates screening questions', () => {
    const result = screeningQuestionSchema.safeParse({
        question: '',
        disqualify: false
    })
    expect(result.success).toBe(false)
})
```

### Integration Tests
```typescript
// Test full AI workflow
test('AI extraction to form addition', async () => {
    const { getByText, getAllByRole } = render(<Step2Criteria />)
    
    // Click extract button
    fireEvent.click(getByText('Extract Skills'))
    
    // Wait for results
    await waitFor(() => {
        expect(getByText('React')).toBeInTheDocument()
    })
    
    // Click skill chip
    fireEvent.click(getByText('React'))
    
    // Verify added to form
    expect(getAllByRole('textbox')).toContainValue('React')
})
```

---

## 📦 Dependencies

### Core
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@google/generative-ai` - AI extraction

### UI
- `@radix-ui/*` - Base components (via shadcn)
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `tailwindcss` - Styling

### Utils
- `cn` from `@/lib/utils` - Class name merging

---

## 🔐 Security Considerations

### 1. API Key Protection
```typescript
// NEVER expose GOOGLE_API_KEY to client
// Always use server actions or API routes
"use server"  // ← Important!

export async function extractSkillsFromDescription() {
    const apiKey = process.env.GOOGLE_API_KEY  // Server-side only
    // ...
}
```

### 2. Input Sanitization
```typescript
// Sanitize user input before AI calls
const sanitizedDescription = description
    .replace(/<script>/gi, '')
    .trim()
    .slice(0, 5000)  // Limit length
```

### 3. Rate Limiting
```typescript
// Consider rate limiting AI calls
const MAX_CALLS_PER_USER = 10
const WINDOW_MS = 60000  // 1 minute
```

---

## 📊 Monitoring & Analytics

### Track AI Usage
```typescript
// Log AI extractions for analysis
console.log('[AI] Skills extracted:', {
    jobTitle,
    skillCount: skills.length,
    explicitCount: skills.filter(s => s.reason === 'explicit').length,
    inferredCount: skills.filter(s => s.reason === 'inferred').length,
    duration: Date.now() - startTime
})
```

### User Interactions
```typescript
// Track which features are used
analytics.track('ai_skills_extracted', {
    skillsCount: extractedSkills.length,
    addedCount: addedSkillsCount
})

analytics.track('screening_questions_added', {
    count: screeningQuestions.length,
    disqualifyingCount: screeningQuestions.filter(q => q.disqualify).length
})
```

---

## 🎓 Best Practices

### 1. Type Safety
✅ Always use TypeScript interfaces  
✅ Validate with Zod schemas  
✅ No `any` types  

### 2. Error Handling
✅ Try-catch around AI calls  
✅ User-friendly error messages  
✅ Fallback to manual entry  

### 3. UX
✅ Loading states for async operations  
✅ Toast notifications for feedback  
✅ Smooth animations  
✅ Keyboard accessibility  

### 4. Performance
✅ Debounce user inputs  
✅ Memoize expensive renders  
✅ Lazy load heavy components  

---

## 🔄 Migration Guide

### From Old to New Schema
```typescript
// Old format
const oldJob = {
    skills: [
        { name: "React", importance: "required" }
    ]
}

// New format (backwards compatible)
const newJob = {
    skills: [
        { 
            name: "React", 
            importance: "required",
            type: "technical",      // Optional
            reason: "explicit"      // Optional
        }
    ],
    screeningQuestions: [],  // New, defaults to []
    languages: []            // New, defaults to []
}

// Migration function
function migrateJobSchema(oldJob) {
    return {
        ...oldJob,
        screeningQuestions: oldJob.screeningQuestions || [],
        languages: oldJob.languages || [],
        skills: oldJob.skills.map(skill => ({
            ...skill,
            type: skill.type || undefined,
            reason: skill.reason || undefined
        }))
    }
}
```

---

## 📚 Additional Resources

- **Shadcn/ui Docs**: https://ui.shadcn.com
- **React Hook Form**: https://react-hook-form.com
- **Zod Validation**: https://zod.dev
- **Google Gemini API**: https://ai.google.dev/docs

---

## ✅ Checklist for Adding New Features

- [ ] Update TypeScript interfaces
- [ ] Add Zod schema validation
- [ ] Update MongoDB schema
- [ ] Add translation keys (ar.json + en.json)
- [ ] Create UI component
- [ ] Add error handling
- [ ] Test with real data
- [ ] Check dark mode
- [ ] Test mobile responsiveness
- [ ] Run linter
- [ ] Update documentation

---

**Maintained by:** Development Team  
**Last Updated:** December 2025  
**Version:** 1.0


