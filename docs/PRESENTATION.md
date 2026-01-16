# Jadara (جدارة) - AI-Powered Recruitment Platform
## Comprehensive Technical Presentation Guide (30 Minutes)

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Application Overview](#2-application-overview)
3. [Feature Deep Dive](#3-feature-deep-dive)
4. [AI Evaluation System](#4-ai-evaluation-system)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Models](#6-database-models)
7. [Security & Authorization](#7-security--authorization)
8. [Internationalization](#8-internationalization)
9. [Integration Points](#9-integration-points)
10. [Future Enhancements](#10-future-enhancements)
11. [Presentation Timeline](#11-presentation-timeline)

---

# 1. EXECUTIVE SUMMARY

## What is Jadara?

Jadara (جدارة) is a **bilingual (Arabic/English) AI-powered recruitment platform** that revolutionizes the hiring process through:

- 🤖 **AI-Powered Candidate Evaluation** - Automated scoring using Google Gemini 2.0
- 🎤 **Voice Assessment System** - Record and analyze voice responses
- 📋 **Smart Job Wizards** - AI-assisted job posting creation
- 👥 **Role-Based Access Control** - Granular permissions for teams
- 🌍 **Full RTL/LTR Support** - Native Arabic and English interfaces

## Key Statistics

| Metric | Value |
|--------|-------|
| Database Models | 18 collections |
| API Endpoints | 50+ routes |
| UI Components | 40+ shadcn/ui components |
| Translation Keys | 1000+ per language |
| Permission Types | 40+ granular permissions |
| Audit Actions | 50+ trackable actions |

## Tech Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│  Next.js 16 (App Router) + React + TypeScript + Tailwind   │
│  shadcn/ui Components + Lucide Icons + React Hook Form     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│         Hono Framework (Central Router Pattern)             │
│         JWT Authentication + RBAC Middleware                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   AI SERVICES LAYER                         │
│  Google Gemini 2.0 Flash | OpenAI (Fallback) | Whisper     │
│  Resume Parser | Voice Transcription | Scoring Engine       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│     MongoDB (Mongoose ODM) | DigitalOcean Spaces (S3)      │
│              Resend (Email) | JWT Sessions                  │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. APPLICATION OVERVIEW

## 2.1 User Personas

### Candidate (Public User)
- Applies for jobs via public application form
- Completes assessments (text, voice, file uploads)
- Answers screening questions
- No authentication required

### Reviewer (Level 1)
- Views assigned applicants
- Submits manual reviews (ratings & decisions)
- Cannot see sensitive data (salary, red flags)
- Limited to read-only for most features

### Admin (Level 2)
- Full job management (create, edit, delete)
- Applicant management with status changes
- Interview scheduling
- Team member management
- Company settings access

### SuperAdmin (Level 3)
- Complete system access
- User management (create, delete users)
- System configuration (AI, email, security)
- Audit log access
- Permission management

## 2.2 Core Modules

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC MODULE                            │
│  /apply/[jobId] - Candidate Application Flow               │
│  • Job Landing • Personal Info • Screening Questions       │
│  • Text Questions • Voice Recording • File Upload          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DASHBOARD MODULE                          │
│  /dashboard - Recruiter & Admin Interface                  │
│  • Jobs • Applicants • Calendar • Settings • Users         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     API MODULE                              │
│  /api/[[...route]] - Central Hono Router                   │
│  • REST Endpoints • AI Processing • File Handling          │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. FEATURE DEEP DIVE

## 3.1 Public Application Flow

**Location:** `src/app/(public)/apply/[jobId]/`

### Step-by-Step Candidate Journey

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Job Landing │ →  │ Personal     │ →  │ Screening    │
│    Page      │    │   Info       │    │  Questions   │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Text      │ →  │   Voice      │ →  │    File      │
│  Questions   │    │  Recording   │    │   Upload     │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                   ┌──────────────┐
                   │  Thank You   │
                   │    Page      │
                   └──────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │ AI Evaluation│
                   │  (Background)│
                   └──────────────┘
```

### Key Features

#### Job Landing Page
**File:** `_components/job-landing.tsx`

- Job title, description, requirements
- Employment type badges (Full-time, Part-time, Contract, Remote)
- Location and salary information
- Required skills display
- "Start Application" CTA button

#### Personal Information Step
**File:** `_components/personal-info-step.tsx`

- Full name (required)
- Email address (validated)
- Phone number with country code
- Age range selection
- Major/field of study
- Years of experience
- Salary expectations (optional, can be hidden)
- Social links (LinkedIn, Portfolio, Behance, GitHub)

#### Screening Questions
- Yes/No format questions
- Knockout questions (wrong answer = auto-rejection)
- Examples:
  - "Do you have the right to work in Saudi Arabia?"
  - "Are you available to start immediately?"
  - "Do you have at least 3 years of experience?"

#### Text Questions
**File:** `_components/text-question.tsx`

- Open-ended text responses
- Real-time word count
- Time tracking (startedAt, completedAt)
- Character/word limits support

#### Voice Recording Questions
**File:** `_components/voice-question.tsx`

**Advanced Features:**
- Configurable time limits (30s, 1min, 2min, 3min, 5min)
- "Blind mode" option - question hidden until recording starts
- Real-time recording with visual timer
- Pause/Resume capability
- Audio playback for review before submission
- Auto-submission on timeout
- Recording quality indicators

**Technical Implementation:**
```typescript
// Key states managed
const [isRecording, setIsRecording] = useState(false)
const [isPaused, setIsPaused] = useState(false)
const [timeRemaining, setTimeRemaining] = useState(timeLimit)
const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
const mediaRecorderRef = useRef<MediaRecorder | null>(null)
```

#### File Upload Step
**File:** `_components/file-upload-step.tsx`

- CV/Resume upload (PDF, DOC, DOCX)
- Portfolio documents
- Drag-and-drop interface
- File size validation (typically 2-20MB)
- Progress indicators

### Anti-Cheat System

| Feature | Implementation |
|---------|---------------|
| Session Tracking | Unique `sessionId` per applicant |
| Tab Detection | `visibilitychange` event listener |
| IP Logging | Server-side IP capture |
| User Agent | Browser fingerprinting |
| Suspicious Flags | `isSuspicious` field on applicant |
| Auto-Submit | Timer-based forced submission |

---

## 3.2 Dashboard Features

### Main Dashboard
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Key Metrics Display:**
- Total applicants count
- Active jobs count
- Hired candidates this month
- Upcoming interviews

**Visual Components:**
- Hiring funnel visualization (pipeline stages)
- 30-day application trends chart
- Recent activity feed with AI scores
- Action center (pending reviews, scheduled interviews)

### Job Management
**Location:** `src/app/(dashboard)/dashboard/jobs/`

#### Jobs List View
**File:** `_components/jobs-client.tsx`

- Grid/List view toggle
- Status filtering (Draft, Active, Closed, Archived)
- Search functionality
- Bulk operations (archive, delete)
- Quick actions (view, edit, duplicate)

#### Job Status Lifecycle
```
Draft → Active → Closed → Archived
  │        │
  │        └── Can reactivate to Draft
  └── Can publish to Active
```

### Applicant Management
**Location:** `src/app/(dashboard)/dashboard/applicants/`

#### Kanban Board View
**File:** `_components/applicant-board.tsx`

```
┌─────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐  ┌──────────┐
│   NEW   │  │ EVALUATED │  │ INTERVIEW │  │  HIRED  │  │ REJECTED │
├─────────┤  ├───────────┤  ├───────────┤  ├─────────┤  ├──────────┤
│ Card 1  │  │ Card 4    │  │ Card 7    │  │ Card 10 │  │ Card 13  │
│ Card 2  │  │ Card 5    │  │ Card 8    │  │ Card 11 │  │ Card 14  │
│ Card 3  │  │ Card 6    │  │ Card 9    │  │ Card 12 │  │          │
└─────────┘  └───────────┘  └───────────┘  └─────────┘  └──────────┘
```

**Drag-and-Drop:** Move candidates between stages

#### Candidate Cards
**File:** `_components/candidate-card.tsx`

Displays:
- Candidate photo/avatar
- Name and email
- AI score badge (color-coded)
- Status indicator
- Applied date
- Quick action buttons

#### Applicant Detail Dialog
**File:** `_components/view-applicant-dialog.tsx`

**9 Tabs:**

1. **Overview** - Personal data, CV preview, status
2. **AI Evaluation** - Scores, recommendations, analysis
3. **Voice Analysis** - Transcripts, sentiment, fluency
4. **Text Responses** - Question/answer review
5. **Screening** - Yes/No answers, knockout status
6. **External Profiles** - LinkedIn, GitHub, Portfolio data
7. **Team Notes** - Comments with @mentions
8. **Manual Review** - Ratings, decisions, feedback
9. **Interview** - Schedule and manage interviews

### Calendar & Interviews
**Location:** `src/app/(dashboard)/dashboard/calendar/`

- Month view calendar
- Interview event blocks (color-coded by status)
- Click to view/edit interview details
- Integration with applicant records

**Interview Statuses:**
- Scheduled
- Confirmed
- Completed
- Cancelled
- No Show
- Rescheduled

### User Management (SuperAdmin)
**Location:** `src/app/(dashboard)/dashboard/users/`

**Features:**
- Create new users with role assignment
- Edit user details and permissions
- Activate/deactivate users
- Bulk import from CSV
- Password reset functionality

### Settings

#### Company Settings (Admin+)
**Location:** `src/app/(dashboard)/dashboard/settings/company/`

- Company name and logo
- Industry selection
- Company bio/description
- Website URL

#### System Settings (SuperAdmin)
**Location:** `src/app/(dashboard)/dashboard/settings/system/`

**7 Configuration Tabs:**

| Tab | Configuration Options |
|-----|----------------------|
| AI Settings | Model selection, temperature, max tokens |
| Email Settings | Provider (Resend/SMTP), templates |
| Notification Settings | Email, in-app, webhooks |
| Security Settings | Session timeout, password rules, 2FA |
| Storage Settings | Provider (DO Spaces/S3), bucket config |
| Application Settings | Site name, maintenance mode, language |
| Feature Flags | Toggle features (voice, AI, interviews) |

---

## 3.3 Job Wizard System

**Location:** `src/app/(dashboard)/dashboard/jobs/_components/wizard/`

### 5-Step Wizard Flow

```
┌────────────────────────────────────────────────────────────┐
│                    JOB CREATION WIZARD                      │
├────────────────────────────────────────────────────────────┤
│  Step 1: Basics  →  Step 2: Criteria  →  Step 3: Data     │
│      ↓                   ↓                   ↓             │
│  Title/Desc          Skills/Langs       Required Fields    │
│  Location            Screening Q's      CV/LinkedIn        │
│  Salary/Type         Experience         Privacy Settings   │
│                                                            │
│  Step 4: Exam  →  Step 5: Review                          │
│      ↓                   ↓                                 │
│  Questions           Final Review                          │
│  Voice/Text          Publish/Draft                         │
│  Time Limits                                               │
└────────────────────────────────────────────────────────────┘
```

### Step 1: Job Basics
**File:** `wizard/step-1-basics.tsx`

| Field | Type | Required |
|-------|------|----------|
| Job Title | Text | Yes |
| Description | Rich Text | Yes |
| Department | Select | No |
| Location | Text | No |
| Employment Type | Select | Yes |
| Salary Min/Max | Number | No |
| Currency | Select (SAR, USD, AED, EGP, TRY) | If salary set |

**AI Feature:** Job description generator with company context

### Step 2: Evaluation Criteria
**File:** `wizard/step-2-criteria.tsx`

#### Skills Management
```typescript
interface Skill {
  name: string
  importance: 'required' | 'preferred'
  type: 'technical' | 'soft'
  reason: 'explicit' | 'inferred'
}
```

**AI Feature:** Auto-extract skills from job description

#### Screening Questions
```typescript
interface ScreeningQuestion {
  question: string
  idealAnswer: 'yes' | 'no'
  isKnockout: boolean
}
```

#### Language Requirements
```typescript
interface LanguageRequirement {
  language: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'native'
}
```

### Step 3: Candidate Data
**File:** `wizard/step-3-candidate-data.tsx`

| Setting | Description |
|---------|-------------|
| Require CV | Mandatory resume upload |
| Require LinkedIn | LinkedIn URL required |
| Require Portfolio | Portfolio link required |
| Hide Salary from Reviewers | Privacy control |
| Hide Personal Info from Reviewers | Privacy control |

### Step 4: Exam Builder
**File:** `wizard/step-4-exam-builder.tsx`

#### Question Types

**Text Questions:**
```typescript
{
  type: 'text',
  question: string,
  weight: 1-10,
  isRequired: boolean
}
```

**Voice Questions:**
```typescript
{
  type: 'voice',
  question: string,
  weight: 1-10,
  timeLimit: 30 | 60 | 120 | 180 | 300, // seconds
  showQuestionBeforeRecording: boolean,
  isRequired: boolean
}
```

#### Retake Policy
- Allow retakes: Yes/No
- Maximum attempts: 1-5

### Step 5: Review
**File:** `wizard/step-5-review.tsx`

- Full summary of all entered data
- Validation check before publishing
- Save as Draft or Publish immediately

---

# 4. AI EVALUATION SYSTEM

## 4.1 Architecture Overview

**Location:** `src/services/evaluation/`

```
┌─────────────────────────────────────────────────────────────┐
│                 AI EVALUATION PIPELINE                       │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Resume Parser  │  │    Voice        │  │   URL Content   │
│                 │  │  Transcription  │  │   Extractor     │
│  resumeParser.ts│  │ voiceTranscription.ts │ urlContentExtractor.ts │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   SCORING ENGINE    │
                   │  scoringEngine.ts   │
                   │                     │
                   │  • Criteria Match   │
                   │  • Score Generation │
                   │  • Recommendations  │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │     EVALUATION      │
                   │      STORAGE        │
                   │  MongoDB Collection │
                   └─────────────────────┘
```

## 4.2 Resume Parser

**File:** `src/services/evaluation/resumeParser.ts`

**Purpose:** Extract structured data from PDF resumes

**Process:**
1. Download PDF from storage URL
2. Convert to base64 for Gemini vision API
3. Extract structured information
4. Return parsed data

**Extracted Fields:**
```typescript
interface ParsedResume {
  fullName: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  workExperience: WorkExperience[]
  education: Education[]
  languages: Language[]
  certifications: string[]
  linkedInUrl?: string
  githubUrl?: string
  portfolioUrl?: string
}
```

**AI Model:** Google Gemini 2.0 Flash (vision capability)

**Fallback:** OpenAI GPT-4 Vision when Gemini quota exceeded

## 4.3 Voice Transcription

**File:** `src/services/evaluation/voiceTranscription.ts`

**Purpose:** Convert voice recordings to text with analysis

**Process:**
1. Download audio from storage URL
2. Send to Gemini audio API
3. Generate raw transcript
4. Clean transcript (remove fillers, fix grammar)
5. Return both versions

**Output:**
```typescript
interface TranscriptionResult {
  rawTranscript: string      // Exact transcription
  cleanTranscript: string    // Cleaned, grammatically correct
  confidence: number         // 0-1 confidence score
  duration: number           // Audio duration in seconds
  language: string           // Detected language
}
```

**Supported Formats:** WebM, MP3, WAV, M4A, OGG

**Fallback:** OpenAI Whisper API

## 4.4 URL Content Extractor

**File:** `src/services/evaluation/urlContentExtractor.ts`

**Purpose:** Extract candidate information from social profiles

**Supported Platforms:**

| Platform | Extracted Data |
|----------|---------------|
| LinkedIn | Skills, experience, education, headline, summary |
| GitHub | Repositories, stars, contributions, top projects |
| Portfolio | Projects, technologies, case studies |
| Behance | Design projects, views, appreciations |

**Output per platform:**
```typescript
interface ExternalProfileData {
  platform: string
  url: string
  skills: string[]
  highlights: string[]
  projects: Project[]
  summary: string
}
```

## 4.5 Scoring Engine

**File:** `src/services/evaluation/scoringEngine.ts`

**Purpose:** Evaluate candidate against job criteria and generate scores

### Input Data
```typescript
interface ScoringInput {
  applicant: {
    personalData: PersonalData
    cvParsedData: ParsedResume
    responses: Response[]
  }
  job: {
    title: string
    description: string
    skills: Skill[]
    screeningQuestions: ScreeningQuestion[]
    languages: LanguageRequirement[]
    minExperience: number
  }
  voiceTranscripts: TranscriptData[]
  externalProfiles: ExternalProfileData[]
}
```

### Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Skills Match | 25% | Required vs preferred skills matching |
| Experience | 20% | Years of experience vs requirements |
| Language Proficiency | 15% | Language requirements matching |
| Screening Answers | 20% | Knockout questions impact |
| Response Quality | 15% | Text and voice response analysis |
| Cultural Fit | 5% | Soft factors and communication |

### Output
```typescript
interface ScoringResult {
  overallScore: number  // 0-100

  criteriaMatches: {
    criterion: string
    score: number
    weight: number
    reasons: BilingualText
  }[]

  strengths: BilingualTextArray  // {en: [], ar: []}
  weaknesses: BilingualTextArray
  redFlags: BilingualTextArray   // Hidden from reviewers

  summary: BilingualText
  recommendation: 'hire' | 'hold' | 'reject' | 'pending'
  recommendationReason: BilingualText
}
```

### Recommendation Logic

```
Score >= 80  →  HIRE      "Strong candidate, recommend proceeding"
Score 60-79  →  HOLD      "Potential candidate, needs further review"
Score 40-59  →  PENDING   "Mixed signals, requires manual evaluation"
Score < 40   →  REJECT    "Does not meet minimum requirements"

Override: Any knockout question failed  →  REJECT
```

## 4.6 Evaluation Processing Route

**File:** `src/models/Evaluations/evaluationProcessingRoute.ts`

**Endpoint:** `POST /api/ai/evaluate`

### Full Evaluation Flow

```
1. Receive applicant ID
          │
2. Fetch applicant data (personal info, responses)
          │
3. Fetch job details (requirements, criteria)
          │
4. Parse resume (if CV provided)
          │
5. Transcribe voice recordings (if any)
          │
6. Extract social profile data (LinkedIn, GitHub, etc.)
          │
7. Call scoring engine with all data
          │
8. Store evaluation in database
          │
9. Update applicant (aiScore, aiSummary, status)
          │
10. Trigger notifications (new evaluation ready)
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai/evaluate` | Full evaluation for single applicant |
| `POST /api/ai/evaluate/batch` | Batch evaluate multiple applicants |
| `POST /api/ai/evaluate/quick-score` | Quick scoring without full analysis |

## 4.7 AI Analysis Breakdown

Stored in `Evaluation.aiAnalysisBreakdown`:

### Screening Questions Analysis
```typescript
{
  totalQuestions: number
  knockoutCount: number
  failedKnockouts: {question: string, answer: string}[]
  passedQuestions: string[]
  aiReasoning: BilingualText
}
```

### Voice Responses Analysis
```typescript
{
  responses: {
    questionId: string
    rawTranscript: string
    cleanTranscript: string
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    fluencyMetrics: {
      wordsPerMinute: number
      fillerWordCount: number
      pauseCount: number
    }
    keyPhrases: string[]
    feedback: BilingualText
  }[]
  overallCommunicationScore: number
  overallAssessment: BilingualText
}
```

### Text Responses Analysis
```typescript
{
  responses: {
    questionId: string
    wordCount: number
    qualityScore: number
    relevanceScore: number
    keyPoints: string[]
    areasForImprovement: string[]
    redFlags: string[]
  }[]
  overallWritingScore: number
}
```

---

# 5. TECHNICAL ARCHITECTURE

## 5.1 Project Structure

```
src/
├── app/                          # Next.js 16 App Router
│   ├── (auth)/                   # Auth group (login)
│   ├── (dashboard)/              # Dashboard group
│   │   └── dashboard/
│   │       ├── applicants/       # Applicant management
│   │       ├── jobs/             # Job management
│   │       ├── calendar/         # Interview calendar
│   │       ├── settings/         # Settings (company, system)
│   │       ├── users/            # User management
│   │       ├── audit-logs/       # Audit trail
│   │       ├── permissions/      # RBAC management
│   │       └── notifications/    # Notifications
│   ├── (public)/                 # Public routes
│   │   └── apply/[jobId]/        # Application flow
│   └── api/[[...route]]/         # Hono API catch-all
│
├── components/
│   ├── ui/                       # shadcn/ui (don't modify)
│   └── dashboard/                # Dashboard widgets
│
├── lib/                          # Utilities
│   ├── mongodb.ts                # DB connection
│   ├── s3.ts                     # File storage
│   ├── session.ts                # JWT sessions
│   ├── auth.ts                   # Auth utilities
│   ├── authMiddleware.ts         # Hono middleware
│   ├── email.ts                  # Email service
│   ├── auditLogger.ts            # Audit logging
│   └── notifications.ts          # Notifications
│
├── models/                       # MongoDB models + routes
│   ├── [ModelName]/
│   │   ├── [modelName]Schema.ts  # Mongoose schema
│   │   └── route.ts              # Hono routes
│   └── ...
│
├── services/                     # Business logic
│   └── evaluation/               # AI evaluation
│
├── hooks/                        # React hooks
│   ├── useTranslate.ts
│   └── usePermission.ts
│
└── i18n/                         # Internationalization
    ├── context.tsx
    └── locales/
        ├── en.json
        └── ar.json
```

## 5.2 API Architecture (Hono)

**Central Router:** `src/app/api/[[...route]]/route.ts`

```typescript
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')

// Register all routes
const routes = app
    .route('/users', users)
    .route('/jobs', jobs)
    .route('/questions', questions)
    .route('/applicants', applicants)
    .route('/responses', responses)
    .route('/evaluations', evaluations)
    .route('/ai/evaluate', evaluationProcessing)
    .route('/company', companyProfile)
    .route('/notifications', notifications)
    .route('/audit-logs', auditLogs)
    .route('/system-config', systemConfig)
    .route('/sessions', sessions)
    .route('/permissions', permissions)
    .route('/system-health', systemHealth)
    .route('/interviews', interviews)
    .route('/reviews', reviews)
    .route('/comments', comments)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
```

### Route Template Pattern

Every model route follows this pattern:

```typescript
// src/models/[Model]/route.ts
import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import { authenticate, requireRole } from '@/lib/authMiddleware'

const app = new Hono()

// GET all
app.get('/', authenticate, async (c) => {
    await dbConnect()
    try {
        const items = await Model.find()
        return c.json({ success: true, data: items })
    } catch (error) {
        return c.json({ success: false, error: 'Failed to fetch' }, 500)
    }
})

// GET by ID
app.get('/:id', authenticate, async (c) => {
    await dbConnect()
    const id = c.req.param('id')
    // ... implementation
})

// POST create
app.post('/', authenticate, requireRole('admin'), async (c) => {
    await dbConnect()
    const body = await c.req.json()
    // ... validation and creation
})

// PATCH update
app.patch('/:id', authenticate, requireRole('admin'), async (c) => {
    // ... implementation
})

// DELETE
app.delete('/:id', authenticate, requireRole('admin'), async (c) => {
    // ... implementation
})

export default app
```

## 5.3 Database Connection

**File:** `src/lib/mongodb.ts`

```typescript
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

// Global cache for connection
let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        })
    }

    cached.conn = await cached.promise
    return cached.conn
}

export default dbConnect
```

**Key Features:**
- Singleton pattern with global caching
- Connection pooling
- Automatic reconnection
- Called at start of every API route

## 5.4 File Storage (S3)

**File:** `src/lib/s3.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
    },
})

// Upload file
export async function uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    isPublic = false
): Promise<string> {
    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
    }))
    return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`
}

// Generate signed URL
export async function getPresignedUrl(
    key: string,
    expiresIn = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
    })
    return await getSignedUrl(s3Client, command, { expiresIn })
}
```

## 5.5 Session Management

**File:** `src/lib/session.ts`

JWT-based session management:

```typescript
interface Session {
    userId: string
    email: string
    name: string
    role: 'reviewer' | 'admin' | 'superadmin'
}

// Create session (on login)
export async function createSession(user: User): Promise<string> {
    const token = jwt.sign({
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
    }, JWT_SECRET, { expiresIn: '7d' })

    // Set HTTP-only cookie
    return token
}

// Verify session
export async function verifySession(token: string): Promise<Session | null> {
    try {
        return jwt.verify(token, JWT_SECRET) as Session
    } catch {
        return null
    }
}
```

---

# 6. DATABASE MODELS

## 6.1 Complete Model List

| # | Model | Collection | Purpose |
|---|-------|-----------|---------|
| 1 | Users | users | User accounts & authentication |
| 2 | Jobs | jobs | Job postings with wizard config |
| 3 | Applicants | applicants | Candidate applications |
| 4 | Responses | responses | Candidate answers |
| 5 | Evaluations | evaluations | AI-generated evaluations |
| 6 | Questions | questions | Question bank (legacy) |
| 7 | Reviews | reviews | Manual team reviews |
| 8 | Interviews | interviews | Interview scheduling |
| 9 | Comments | comments | Team notes on applicants |
| 10 | Notifications | notifications | User notifications |
| 11 | AuditLogs | auditlogs | System audit trail |
| 12 | CompanyProfile | companyprofiles | Company settings |
| 13 | Permissions | permissions | Role permissions |
| 14 | SystemConfig | systemconfigs | System configuration |
| 15 | Sessions | sessions | Active user sessions |

## 6.2 Key Schema Definitions

### User Schema
```typescript
{
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  // bcrypt hashed
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['reviewer', 'admin', 'superadmin'],
    default: 'reviewer'
  },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Job Schema
```typescript
{
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: String,
  location: String,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote']
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, enum: ['SAR', 'USD', 'AED', 'EGP', 'TRY'] }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'draft'
  },
  skills: [{
    name: String,
    importance: { type: String, enum: ['required', 'preferred'] },
    type: { type: String, enum: ['technical', 'soft'] }
  }],
  screeningQuestions: [{
    question: String,
    idealAnswer: { type: String, enum: ['yes', 'no'] },
    isKnockout: Boolean
  }],
  languages: [{
    language: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'native'] }
  }],
  minExperience: Number,
  autoRejectThreshold: Number,  // 0-100
  candidateDataConfig: {
    requireCV: Boolean,
    requireLinkedIn: Boolean,
    requirePortfolio: Boolean,
    hideSalaryFromReviewers: Boolean
  },
  questions: [{
    type: { type: String, enum: ['text', 'voice'] },
    question: String,
    weight: Number,
    timeLimit: Number,  // for voice
    showQuestionBeforeRecording: Boolean
  }],
  retakePolicy: {
    allowRetake: Boolean,
    maxAttempts: Number
  },
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}
```

### Applicant Schema
```typescript
{
  jobId: { type: ObjectId, ref: 'Job', required: true },
  personalData: {
    fullName: String,
    email: String,
    phone: String,
    age: String,
    major: String,
    yearsOfExperience: Number,
    salaryExpectation: Number,
    linkedInUrl: String,
    portfolioUrl: String,
    behanceUrl: String,
    githubUrl: String
  },
  cvUrl: String,
  cvParsedData: {
    skills: [String],
    experience: [Object],
    education: [Object],
    languages: [Object]
  },
  status: {
    type: String,
    enum: ['new', 'evaluated', 'interview', 'hired', 'rejected'],
    default: 'new'
  },
  aiScore: Number,           // 0-100
  aiSummary: String,
  aiRedFlags: [String],      // Hidden from reviewers
  evaluationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed']
  },
  evaluationError: String,
  sessionId: String,         // Anti-cheat tracking
  isComplete: Boolean,
  submittedAt: Date,
  isSuspicious: Boolean,     // Flag for suspicious activity
  createdAt: Date,
  updatedAt: Date
}
```

### Evaluation Schema
```typescript
{
  applicantId: { type: ObjectId, ref: 'Applicant', required: true },
  jobId: { type: ObjectId, ref: 'Job', required: true },
  overallScore: Number,
  criteriaMatches: [{
    criterion: String,
    score: Number,
    weight: Number,
    reasons: {
      en: String,
      ar: String
    }
  }],
  strengths: {
    en: [String],
    ar: [String]
  },
  weaknesses: {
    en: [String],
    ar: [String]
  },
  redFlags: {
    en: [String],
    ar: [String]
  },
  summary: {
    en: String,
    ar: String
  },
  recommendation: {
    type: String,
    enum: ['hire', 'hold', 'reject', 'pending']
  },
  aiAnalysisBreakdown: {
    screeningQuestionsAnalysis: Object,
    voiceResponsesAnalysis: Object,
    textResponsesAnalysis: Object,
    externalProfilesAnalysis: Object,
    languageAnalysis: Object,
    experienceAnalysis: Object,
    scoringBreakdown: Object
  },
  isProcessed: Boolean,
  processedAt: Date,
  manualRecommendation: String,
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: Date
}
```

### AuditLog Schema
```typescript
{
  userId: { type: ObjectId, ref: 'User' },
  userEmail: String,
  userName: String,
  userRole: String,
  action: {
    type: String,
    enum: [/* 50+ action types */]
  },
  resource: {
    type: String,
    enum: ['User', 'Job', 'Applicant', 'Evaluation', 'Review',
           'Interview', 'Comment', 'System', 'Company', 'Permission']
  },
  resourceId: ObjectId,
  resourceName: String,
  description: String,
  metadata: Object,
  changes: {
    before: Object,
    after: Object
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
}

// TTL Index for 90-day retention
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 })
```

---

# 7. SECURITY & AUTHORIZATION

## 7.1 Role Hierarchy

```
                    ┌─────────────────┐
                    │   SUPERADMIN    │
                    │    (Level 3)    │
                    │   Full Access   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     ADMIN       │
                    │    (Level 2)    │
                    │  Jobs, Teams    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    REVIEWER     │
                    │    (Level 1)    │
                    │   View Only     │
                    └─────────────────┘
```

## 7.2 Permission Matrix

| Permission | Reviewer | Admin | SuperAdmin |
|------------|:--------:|:-----:|:----------:|
| View Jobs | ✅ | ✅ | ✅ |
| Create Jobs | ❌ | ✅ | ✅ |
| Edit Jobs | ❌ | ✅ | ✅ |
| Delete Jobs | ❌ | ✅ | ✅ |
| View Applicants | ✅ | ✅ | ✅ |
| Edit Applicant Status | ❌ | ✅ | ✅ |
| Delete Applicants | ❌ | ✅ | ✅ |
| View Evaluations | ✅ | ✅ | ✅ |
| View Red Flags | ❌ | ✅ | ✅ |
| View Salary Info | ❌ | ✅ | ✅ |
| Submit Reviews | ✅ | ✅ | ✅ |
| Schedule Interviews | ❌ | ✅ | ✅ |
| View Users | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| Company Settings | ❌ | ✅ | ✅ |

## 7.3 Authorization Implementation

### Middleware (API Routes)
**File:** `src/lib/authMiddleware.ts`

```typescript
import { Context, Next } from 'hono'

// Authenticate - verify session exists
export async function authenticate(c: Context, next: Next) {
    const session = await getSession(c)
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401)
    }
    c.set('user', session)
    await next()
}

// Require specific role level
export function requireRole(minRole: 'reviewer' | 'admin' | 'superadmin') {
    return async (c: Context, next: Next) => {
        const user = c.get('user')
        if (!hasPermission(user.role, minRole)) {
            return c.json({ error: 'Forbidden' }, 403)
        }
        await next()
    }
}

// Role hierarchy check
export function hasPermission(
    userRole: string,
    requiredRole: string
): boolean {
    const hierarchy = { reviewer: 1, admin: 2, superadmin: 3 }
    return hierarchy[userRole] >= hierarchy[requiredRole]
}
```

### Page-Level Guards
```typescript
// In Server Components
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    if (session.role !== 'superadmin') {
        redirect('/dashboard')
    }

    return <AdminContent />
}
```

## 7.4 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs (12 rounds) |
| Session Tokens | JWT with 7-day expiry |
| Cookie Security | HTTP-only, Secure, SameSite |
| Data Filtering | Reviewers see filtered data |
| Audit Logging | All actions logged |
| Session Management | Active sessions tracked |
| IP Tracking | Logged in audit trail |
| Anti-Cheat | Tab visibility, session IDs |

---

# 8. INTERNATIONALIZATION

## 8.1 Architecture

**Files:**
- `src/i18n/context.tsx` - React Context provider
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/ar.json` - Arabic translations
- `src/hooks/useTranslate.ts` - Translation hook

## 8.2 Usage Pattern

```typescript
"use client"

import { useTranslate } from '@/hooks/useTranslate'

export function MyComponent() {
    const { t, locale, dir, isRTL } = useTranslate()

    return (
        <div dir={dir} className={isRTL ? 'text-right' : 'text-left'}>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.welcome', { name: 'Ahmed' })}</p>
        </div>
    )
}
```

## 8.3 Translation Structure

```json
// en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {{name}}",
    "metrics": {
      "applicants": "Total Applicants",
      "activeJobs": "Active Jobs"
    }
  },
  "jobs": {
    "title": "Jobs",
    "createJob": "Create Job",
    "status": {
      "draft": "Draft",
      "active": "Active",
      "closed": "Closed"
    }
  }
}
```

```json
// ar.json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل"
  },
  "dashboard": {
    "title": "لوحة التحكم",
    "welcome": "مرحباً، {{name}}",
    "metrics": {
      "applicants": "إجمالي المتقدمين",
      "activeJobs": "الوظائف النشطة"
    }
  }
}
```

## 8.4 RTL Support

**CSS Considerations:**
- Use `dir="rtl"` on root element for Arabic
- Tailwind logical properties (`ms-4` instead of `ml-4`)
- Flip layouts for RTL (flex-row-reverse)

**Default Language:** Arabic (RTL)

---

# 9. INTEGRATION POINTS

## 9.1 External Services

| Service | Purpose | Environment Variable |
|---------|---------|---------------------|
| Google Gemini 2.0 | AI evaluation, parsing | `GOOGLE_API_KEY` |
| OpenAI (Fallback) | Backup AI provider | `OPENAI_API_KEY` |
| MongoDB Atlas | Database | `MONGODB_URI` |
| DigitalOcean Spaces | File storage | `DO_SPACES_*` |
| Resend | Email delivery | `RESEND_API_KEY` |

## 9.2 API Integration Points

### Gemini API Usage

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Text generation
const result = await model.generateContent(prompt)

// Vision (PDF parsing)
const result = await model.generateContent([
    { inlineData: { mimeType: 'application/pdf', data: base64Data } },
    prompt
])

// Audio transcription
const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
    'Transcribe this audio'
])
```

### Storage Integration

```typescript
// Upload candidate CV
const cvUrl = await uploadFile(
    cvBuffer,
    `cvs/${applicantId}/${filename}`,
    'application/pdf',
    false  // private
)

// Generate temporary access URL
const signedUrl = await getPresignedUrl(
    `recordings/${applicantId}/${recordingId}.webm`,
    3600  // 1 hour expiry
)
```

---

# 10. FUTURE ENHANCEMENTS

## 10.1 AI & Evaluation

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Multi-model Evaluation | Use multiple AI models and average scores | High |
| Custom Scoring Weights | Admin-configurable criterion weights | High |
| Interview AI Assistant | AI-suggested interview questions | Medium |
| Sentiment Analysis | Deeper voice sentiment analysis | Medium |
| Bias Detection | Flag potential biases in evaluations | High |
| Resume Comparison | Compare candidates side-by-side | Medium |
| AI Explanation Mode | Detailed reasoning for scores | Low |

## 10.2 Application Flow

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Video Recording | Add video question support | High |
| Multi-stage Applications | Split into multiple sessions | Medium |
| Save & Continue | Allow candidates to save progress | High |
| Mobile App | Native mobile application | Medium |
| Accessibility | WCAG 2.1 AA compliance | High |
| Assessment Timer | Per-section time limits | Medium |
| Practice Mode | Let candidates practice before real test | Low |

## 10.3 Dashboard & Management

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Advanced Analytics | Hiring funnel analytics, time-to-hire | High |
| Bulk Operations | Bulk email, bulk status change | Medium |
| Calendar Integration | Google/Outlook calendar sync | High |
| Email Templates | Customizable email templates | Medium |
| Custom Workflows | Configurable approval workflows | Low |
| Candidate Portal | Self-service candidate dashboard | Medium |
| Team Collaboration | Real-time comments, @mentions | Medium |

## 10.4 Technical Improvements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Real-time Updates | WebSocket for live updates | High |
| Offline Support | PWA with offline capability | Low |
| Performance Monitoring | APM integration (DataDog, etc.) | Medium |
| Error Tracking | Sentry integration | High |
| CDN Integration | Static asset CDN | Medium |
| Database Sharding | Horizontal scaling | Low |
| API Rate Limiting | Protect against abuse | High |
| Automated Testing | E2E tests with Playwright | High |

## 10.5 Security Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Two-Factor Authentication | TOTP/SMS 2FA | High |
| SSO Integration | SAML/OAuth providers | Medium |
| Data Encryption at Rest | Encrypt sensitive fields | High |
| GDPR Compliance | Data export, deletion requests | High |
| Security Audit Logging | Enhanced security events | Medium |
| IP Whitelisting | Admin access restrictions | Low |

## 10.6 Integration Opportunities

| Integration | Description | Priority |
|-------------|-------------|----------|
| ATS Integration | Integrate with existing ATS platforms | High |
| HRIS Integration | Sync with HR systems | Medium |
| Background Check | Partner integrations | Medium |
| Skills Assessment | Third-party assessment tools | Low |
| Video Interview | Zoom/Teams integration | Medium |
| Slack/Teams Notifications | Real-time alerts | Medium |

---

# 11. PRESENTATION TIMELINE

## Suggested 30-Minute Structure

| Time | Section | Duration | Key Points |
|------|---------|----------|------------|
| 0:00 | Introduction | 2 min | What is Jadara, problem it solves |
| 2:00 | Live Demo: Candidate Flow | 5 min | Show application process |
| 7:00 | Live Demo: Dashboard | 5 min | Jobs, applicants, kanban |
| 12:00 | AI Evaluation System | 6 min | How scoring works, demo results |
| 18:00 | Job Wizard Deep Dive | 4 min | Creating a job with AI |
| 22:00 | Technical Architecture | 4 min | High-level architecture diagram |
| 26:00 | Security & RBAC | 2 min | Roles, permissions, audit |
| 28:00 | Future Roadmap | 1 min | Key planned features |
| 29:00 | Q&A | 1 min | Questions |

## Key Demo Scenarios

### Demo 1: Candidate Application (5 min)
1. Open job application page
2. Fill personal information
3. Answer screening questions
4. Record voice response
5. Upload CV
6. Submit and show thank you page

### Demo 2: Dashboard Tour (5 min)
1. Login as Admin
2. Show main dashboard metrics
3. Navigate to Jobs, create quick job
4. Navigate to Applicants
5. Show Kanban board
6. Open applicant detail dialog
7. Show AI evaluation tab

### Demo 3: AI in Action (4 min)
1. Show evaluation details
2. Explain scoring breakdown
3. Show voice transcript
4. Show strengths/weaknesses
5. Show recommendation

## Visual Aids to Prepare

1. **Architecture Diagram** - System overview flowchart
2. **AI Pipeline Diagram** - Evaluation flow visualization
3. **Role Hierarchy Chart** - Permission pyramid
4. **Feature Comparison Table** - Jadara vs competitors
5. **Database ER Diagram** - Model relationships

---

# APPENDIX

## A. Environment Variables Reference

```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jadara

# Authentication
JWT_SECRET=your-secret-key-here

# AI Services
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key  # Optional fallback

# File Storage (DigitalOcean Spaces)
DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
DO_SPACES_REGION=fra1
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_ACCESS_KEY_ID=your-access-key
DO_SPACES_SECRET_ACCESS_KEY=your-secret-key

# Email
RESEND_API_KEY=re_your_api_key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## B. Quick Commands

```bash
# Development
bun dev              # Start dev server
bun run build        # Production build
bun run lint         # Run linter
bun run seed         # Seed test data

# Add UI Component
bunx shadcn@latest add button

# Database
# Connect via MongoDB Compass or CLI
```

## C. Key File Quick Reference

| Purpose | File Path |
|---------|-----------|
| Central API Router | `src/app/api/[[...route]]/route.ts` |
| DB Connection | `src/lib/mongodb.ts` |
| Session Management | `src/lib/session.ts` |
| Auth Middleware | `src/lib/authMiddleware.ts` |
| Scoring Engine | `src/services/evaluation/scoringEngine.ts` |
| Resume Parser | `src/services/evaluation/resumeParser.ts` |
| Voice Transcription | `src/services/evaluation/voiceTranscription.ts` |
| Job Wizard | `src/app/(dashboard)/dashboard/jobs/_components/wizard/` |
| Applicant Dialog | `src/app/(dashboard)/dashboard/applicants/_components/view-applicant-dialog.tsx` |
| Public Application | `src/app/(public)/apply/[jobId]/` |
| Translations (EN) | `src/i18n/locales/en.json` |
| Translations (AR) | `src/i18n/locales/ar.json` |

---

*Document Generated: January 2026*
*Platform Version: 1.0*
*Next.js: 16 | React: 19 | TypeScript: 5.x*
