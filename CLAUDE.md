# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IELTS exam preparation web application (goielts) - a bilingual (Arabic/English) recruitment platform built with Next.js 16, featuring AI-powered candidate evaluation, custom assessment wizards, and smart scoring.

## Tech Stack

- **Framework**: Next.js 16 (App Router with React Server Components)
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun (use `bun` and `bunx`, NOT npm)
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui (new-york style)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **API Framework**: Hono
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini (gemini-2.5-flash-lite)
- **Storage**: DigitalOcean Spaces (S3-compatible)

## Development Commands

```bash
bun dev          # Start development server (http://localhost:3000)
bun run build    # Build for production
bun run lint     # Run ESLint
bun run seed     # Seed database with test users (scripts/seed-users.ts)
```

## Project Architecture

### Path Aliases
Use `@/*` for imports from `src/`:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import dbConnect from "@/lib/mongodb"
```

### App Router Structure (Next.js 16)

```
src/app/
├── (auth)/                    # Auth pages (login, etc.)
├── (dashboard)/               # Protected dashboard routes
│   └── dashboard/
│       ├── applicants/        # Candidate management
│       ├── jobs/              # Job postings & wizard
│       ├── settings/          # Company & user settings (admin+)
│       ├── calendar/          # Interview scheduling
│       ├── interviews/        # Interview management
│       ├── questions/         # Question bank
│       ├── scorecards/        # Evaluation scorecards
│       └── users/             # User management (superadmin only)
├── (public)/                  # Public routes
│   └── apply/[jobId]/         # Public job application flow
└── api/
    └── [[...route]]/route.ts  # Central Hono API router
```

### Data Models Architecture

All MongoDB models follow this structure:
```
src/models/[ModelName]/
├── [modelName]Schema.ts       # Mongoose schema + TypeScript interface
└── route.ts                   # Hono API routes for this model
```

**Existing Models:**
- `Users/` - User accounts & authentication
- `Jobs/` - Job postings with wizard data
- `Questions/` - Question bank
- `Applicants/` - Candidate applications
- `Responses/` - Candidate answers (text, voice, files)
- `Evaluations/` - AI-generated candidate evaluations
- `CompanyProfile/` - Company settings & branding

### API Architecture (Hono)

**Central Router**: `src/app/api/[[...route]]/route.ts`

All API routes are registered here:
```typescript
const routes = app
    .route('/users', users)
    .route('/jobs', jobs)
    .route('/applicants', applicants)
    .route('/ai/evaluate', evaluationProcessing)
    // ... etc
```

**When adding a new model:**
1. Create schema in `src/models/[ModelName]/[modelName]Schema.ts`
2. Create routes in `src/models/[ModelName]/route.ts` following the template pattern
3. Register route in central router: `src/app/api/[[...route]]/route.ts`

**Route Template Pattern:**
- All routes use Hono context (`c`)
- Always call `await dbConnect()` at start of each route
- Use consistent error handling structure
- Return `{ success: boolean, data?, error?, details? }`
- See `.cursor/rules/my-rules.mdc` lines 77-210 for full template

### AI Evaluation System

**Core Files:**
- `src/services/evaluation/scoringEngine.ts` - Smart AI scoring using Gemini
- `src/services/evaluation/resumeParser.ts` - Resume/CV parsing
- `src/models/Evaluations/evaluationProcessingRoute.ts` - Main evaluation API endpoint
- `src/models/Evaluations/evaluationSchema.ts` - Evaluation data structure

**Flow:**
1. Candidate submits application via public form
2. System parses resume, voice transcripts, text responses
3. AI evaluates against job criteria (skills, experience, languages)
4. Generates score + detailed analysis with recommendations
5. Stores in Evaluations collection

**AI Model**: Uses Google Gemini (gemini-2.5-flash-lite) configured in `.env.local`

### Job Wizard System

**Location**: `src/app/(dashboard)/dashboard/jobs/_components/wizard/`

**Core Files:**
- `job-wizard-dialog.tsx` - Main wizard container
- `step-1-basics.tsx` - Job title, description, salary
- `step-2-criteria.tsx` - Skills, screening questions, languages
- `step-3-candidate-data.tsx` - Required candidate info (CV, LinkedIn, etc.)
- `step-4-exam-builder.tsx` - Custom questions (text/voice)
- `step-5-review.tsx` - Final review & publish
- `ai-actions.ts` - AI-powered skill extraction & question generation
- `types.ts` - Zod schemas & TypeScript types
- `validation.ts` - Form validation logic

**Wizard Features:**
- AI skill extraction from job description
- AI-generated screening questions
- Multi-language support (AR/EN)
- Voice question builder with time limits
- Retake policy configuration

### Internationalization (i18n)

**Files:**
- `src/i18n/locales/ar.json` - Arabic translations
- `src/i18n/locales/en.json` - English translations
- `src/i18n/context.tsx` - Language context provider
- `src/hooks/useTranslate.ts` - Translation hook

**Usage:**
```typescript
import { useTranslate } from '@/hooks/useTranslate'

const { t, locale, dir, isRTL } = useTranslate()
// t('key.nested.path') returns translated string
// locale: 'ar' | 'en'
// dir: 'rtl' | 'ltr'
// isRTL: boolean
```

**Default Language**: Arabic (RTL)

### Database Connection

**File**: `src/lib/mongodb.ts`

- Uses singleton pattern with global caching
- Automatic reconnection handling
- Connection pooling enabled
- Always import: `import dbConnect from '@/lib/mongodb'`
- Call at start of every API route: `await dbConnect()`

### File Storage (DigitalOcean Spaces)

**File**: `src/lib/s3.ts`

**Functions:**
- `uploadFile(file, key, contentType, isPublic)` - Upload file to Spaces
- `getSignedUrl(key, expiresIn)` - Generate temporary download URL
- `deleteFile(key)` - Delete file from Spaces
- `fileExists(key)` - Check if file exists

**Usage:** Stores candidate resumes, voice recordings, portfolio files

### UI Components (shadcn/ui)

**Location**: `src/components/ui/`

**Important:**
- DO NOT modify files in `src/components/ui/` directly
- Add new components: `bunx shadcn@latest add <component>`
- For customization, create wrapper components outside `ui/`
- All components use Tailwind CSS v4 with CSS variables from `globals.css`

### Server vs Client Components

**Default:** All components are Server Components (no directive needed)

**Use `"use client"` only when:**
- Using React hooks (useState, useEffect, etc.)
- Using Browser APIs (window, localStorage, etc.)
- Using event handlers (onClick, onChange, etc.)
- Using client-side libraries
- Using the translation hook `useTranslate()`

### Styling Conventions

- Use Tailwind CSS utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Follow mobile-first responsive design
- Leverage CSS variables from `globals.css` for theming
- Support RTL/LTR layouts (check `dir` from translation hook)

### Form Patterns

**Standard Pattern:**
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
    field: z.string().min(1, "Required")
})

const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { field: "" }
})
```

- Always use React Hook Form + Zod
- Use shadcn Form components
- Define schemas near the form component

### Environment Variables

**Required in `.env.local`:**
- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_API_KEY` - Google Gemini API key
- `DO_SPACES_REGION` - DigitalOcean Spaces region (e.g., "sfo3")
- `DO_SPACES_BUCKET` - Bucket name
- `DO_SPACES_ACCESS_KEY_ID` - Spaces access key
- `DO_SPACES_SECRET_ACCESS_KEY` - Spaces secret key
- `JWT_SECRET` - JWT signing secret (for sessions)

## Critical Development Patterns

### Authentication & Sessions
- Session management: `src/lib/session.ts` (JWT-based)
- Auth utilities: `src/lib/auth.ts`
- Authorization middleware: `src/lib/authMiddleware.ts`
- Protected routes use Server Components with session checks

### Authorization & Role-Based Access Control (RBAC)

**Role Hierarchy:**
- `reviewer` (level 1) - View and evaluate candidates, submit reviews
- `admin` (level 2) - All reviewer permissions + job management, settings
- `superadmin` (level 3) - All admin permissions + user management

**Authorization Middleware:**
```typescript
import { authenticate, requireRole, getAuthUser } from '@/lib/authMiddleware'

// All authenticated users
app.get('/route', authenticate, async (c) => {
  const user = getAuthUser(c)
})

// Admin only
app.post('/route', authenticate, requireRole('admin'), async (c) => {
  // Only admin and superadmin can access
})
```

**Page-Level Guards:**
```typescript
// Superadmin only
if (session.role !== "superadmin") {
    redirect("/dashboard")
}

// Admin and above
if (!hasPermission(session.role, "admin")) {
    redirect("/dashboard")
}
```

**Access Control:**
- Settings page: Admin+ only
- User management: Superadmin only
- Job create/edit/delete: Admin+ only
- Applicant delete: Admin+ only (reviewers can view/update status only)
- All evaluation routes: All authenticated users (data filtered by role)

**Security Features:**
- Session-based authentication (no role/userId in query params)
- Server-side authorization checks on all protected routes
- Data filtering for reviewers (hides salary, red flags)
- Automatic role-based menu filtering in UI

See `REVIEWER_AUTHORIZATION_GUIDE.md` for complete documentation.

### Component Conventions
- Use function declarations (not arrow functions) for components
- Export as named exports
- Use `React.ComponentProps<"element">` for extending HTML props
- Keep components small and focused

### Code Organization
- Colocate related files (component + types + utils)
- Use semantic HTML elements
- Ensure accessibility (ARIA labels, keyboard navigation)
- Handle loading and error states

### Pre-Commit Checklist
1. MongoDB schemas follow correct path structure
2. API routes follow template structure
3. Routes registered in central router
4. Translations added to both `ar.json` and `en.json`
5. Forms use Zod validation
6. Server/Client components marked correctly

## Common Pitfalls

1. **Package Manager**: Always use `bun`, never `npm` or `yarn`
2. **Translations**: Add keys to BOTH language files (ar.json and en.json)
3. **API Routes**: Must call `await dbConnect()` at start
4. **shadcn/ui**: Don't modify files in `src/components/ui/` directly
5. **Path Aliases**: Always use `@/*` for imports, not relative paths
6. **RTL Support**: Test UI in both Arabic (RTL) and English (LTR)
7. **Client Components**: Only add `"use client"` when absolutely necessary

## Testing Utilities

- Test upload endpoint: `/test-upload` (see `src/app/test-upload/page.tsx`)
- User seeding: `bun run seed` (creates test users)
- Check `scripts/seed-users.ts` for seed data structure
