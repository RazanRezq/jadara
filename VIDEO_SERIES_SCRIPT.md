# GoIELTS Video Series
## 4-Part Comprehensive Project Presentation (60 Minutes Total)

---

# SERIES OVERVIEW

| Clip | Title | Duration | Audience Focus |
|------|-------|----------|----------------|
| **1** | Project Overview & Business Context | 15 min | Manager + Tech |
| **2** | Features & User Experience Deep Dive | 15 min | Manager + Tech |
| **3** | AI System & Technical Architecture | 15 min | Tech-focused |
| **4** | Security, Infrastructure & Roadmap | 15 min | Manager + Tech |

---

# PRE-RECORDING SETUP (For All Clips)

## Browser Tabs to Prepare
```
Tab 1: Dashboard (logged in as Admin)
Tab 2: Public job application page
Tab 3: VS Code with project open
Tab 4: MongoDB Atlas (optional, for database demo)
Tab 5: DigitalOcean Spaces console (optional)
```

## Test Data Required
- 3+ active jobs with different configurations
- 15+ applicants in various statuses
- At least 3 applicants with completed AI evaluations
- At least 1 applicant with voice recordings
- Users with different roles (reviewer, admin, superadmin)

## Recording Settings
- Resolution: 1920x1080 (1080p)
- Frame rate: 30fps
- Audio: Good quality microphone
- Screen: Clean desktop, notifications off

---

# CLIP 1: PROJECT OVERVIEW & BUSINESS CONTEXT
## Duration: 15 Minutes

### INTRODUCTION (0:00 - 1:30)

**[SCREEN: Title slide or desktop with logo]**

**SAY:**

> "Assalamu Alaikum everyone. Welcome to this comprehensive technical presentation of GoIELTS - our AI-powered recruitment platform.
>
> I'm [Your Name], and I'll be walking you through the entire system over the course of four videos. This first video covers the project overview and business context - why we built this and what problems it solves.
>
> By the end of these four videos, you'll have a complete understanding of:
> - The business problems we're solving
> - Every feature in the platform
> - How our AI evaluation system works
> - The technical architecture and decisions we made
> - Our security framework
> - And our roadmap for the future
>
> Let's begin with WHY this platform exists."

---

### THE PROBLEM WE'RE SOLVING (1:30 - 4:00)

**[SCREEN: Can show dashboard or stay on slides]**

**SAY:**

> "The recruitment industry faces four major challenges that traditional systems fail to address:
>
> **Challenge Number One: Volume Overload**
>
> A typical job posting today receives anywhere from 200 to over 1,000 applications. Studies show that recruiters spend an average of just 6 to 8 seconds scanning each resume. This leads to qualified candidates being overlooked, inconsistent evaluation standards, and recruiter burnout.
>
> **Challenge Number Two: Unconscious Bias**
>
> Research consistently shows that identical resumes with different names receive significantly different callback rates. Traditional screening perpetuates gender bias, name-based discrimination, and preferences for certain educational institutions.
>
> **Challenge Number Three: The Communication Gap**
>
> A resume cannot tell you how well someone communicates. It can't demonstrate verbal fluency, presentation skills, or the ability to think on their feet. Yet these skills are critical for many roles.
>
> **Challenge Number Four: Regional Requirements**
>
> Organizations in Saudi Arabia, UAE, and the broader MENA region need platforms that truly understand Arabic. They need right-to-left interfaces, proper Arabic typography, and cultural context awareness. Most global ATS platforms treat Arabic as an afterthought.
>
> GoIELTS was built from the ground up to solve all four of these challenges."

---

### THE SOLUTION: GOIELTS (4:00 - 7:00)

**[SCREEN: Dashboard overview or architecture diagram]**

**SAY:**

> "GoIELTS is an AI-powered recruitment platform with five core pillars:
>
> **Pillar One: AI-Powered Evaluation**
>
> Every candidate is automatically scored by our AI within minutes of submitting their application. No more waiting days for human review of initial screening. The AI evaluates against the specific criteria you define for each job.
>
> **Pillar Two: Voice Assessment**
>
> Candidates record voice responses to questions you define. Our AI transcribes these recordings, analyzes fluency, sentiment, and content quality. You can literally hear how candidates communicate before investing time in interviews.
>
> **Pillar Three: Bilingual by Design**
>
> This isn't a platform with Arabic bolted on. Arabic is a first-class citizen. The entire interface works in right-to-left mode. All AI-generated content - summaries, strengths, weaknesses - is produced in both Arabic and English simultaneously.
>
> **Pillar Four: Smart Job Wizards**
>
> Creating a job posting is guided and AI-assisted. The wizard helps extract skills from job descriptions, suggests screening questions, and configures the assessment - all in a few minutes.
>
> **Pillar Five: Role-Based Access**
>
> We have granular permissions. Reviewers see what they need to see. Admins manage jobs and candidates. SuperAdmins control the system. Sensitive data like red flags and salary expectations can be hidden from certain roles.
>
> Let me show you the platform at a high level."

**[ACTION: Navigate to dashboard, give a quick visual tour]**

---

### PLATFORM WALKTHROUGH - HIGH LEVEL (7:00 - 10:00)

**[SCREEN: Dashboard main page]**

**SAY:**

> "This is the main dashboard. At a glance, we see:
>
> - Total applicants in the system
> - Number of active jobs
> - Hiring metrics for the current period
> - Upcoming interviews
>
> The hiring funnel shows candidates at each stage of the pipeline.
>
> The trends chart shows application volume over the last 30 days.
>
> Recent activity shows the latest applicants with their AI scores."

**[ACTION: Click through sidebar items briefly]**

**SAY:**

> "In the sidebar, we have:
>
> - **Dashboard** - the overview we just saw
> - **Jobs** - where we create and manage job postings
> - **Applicants** - the Kanban board and list view of all candidates
> - **Calendar** - interview scheduling
> - **Settings** - company and system configuration
> - **Users** - team member management (for SuperAdmins)
> - **Audit Logs** - complete activity trail
>
> On the public side, candidates access job applications through a clean, mobile-friendly interface. We'll demo that in detail in the next video."

---

### USER PERSONAS & ROLES (10:00 - 12:30)

**[SCREEN: Can show users page or stay on dashboard]**

**SAY:**

> "Let me explain who uses this platform and what they can do.
>
> **Persona One: The Candidate**
>
> Candidates are public users - they don't log in. They receive a job link, fill out the application, complete assessments, and submit. The experience is optimized for mobile. They can record voice answers directly in the browser.
>
> **Persona Two: The Reviewer**
>
> Reviewers are team members with limited access. They can:
> - View applicants assigned to them
> - See AI evaluations (but NOT red flags)
> - Submit manual reviews and ratings
> - Add team notes
>
> They CANNOT create jobs, delete applicants, or access sensitive data like salary expectations.
>
> **Persona Three: The Admin**
>
> Admins have full operational control:
> - Create, edit, publish, and close jobs
> - Manage all applicants and their statuses
> - Schedule interviews
> - Access company settings
> - See full evaluation details including red flags
>
> **Persona Four: The SuperAdmin**
>
> SuperAdmins are system administrators:
> - Everything Admins can do, PLUS
> - User management - create and delete users
> - System configuration - AI settings, email, security
> - Audit log access - see everything that happens
> - Permission management - customize role permissions
>
> This hierarchy ensures people see what they need, nothing more."

---

### TECHNOLOGY STACK OVERVIEW (12:30 - 14:30)

**[SCREEN: VS Code or architecture diagram]**

**SAY:**

> "Before we dive deep in later videos, let me give you a quick overview of our technology choices.
>
> **Frontend:**
> - Next.js 16 with the App Router - the latest from Vercel
> - React 19 for the UI
> - TypeScript for type safety throughout
> - Tailwind CSS version 4 for styling
> - shadcn/ui component library - modern, accessible, customizable
>
> **Backend:**
> - Hono framework - a fast, lightweight alternative to Express
> - Running on Node.js
> - All API routes in a single catch-all pattern for simplicity
>
> **Database:**
> - MongoDB Atlas - flexible schema perfect for recruitment data
> - Mongoose as our ODM for type-safe database operations
>
> **AI Services:**
> - Google Gemini 2.0 Flash as our primary AI model
> - OpenAI as a fallback if Gemini is unavailable
> - Handles: resume parsing, voice transcription, candidate scoring
>
> **Storage:**
> - DigitalOcean Spaces - S3-compatible object storage
> - Stores CVs, voice recordings, and other files
>
> **Email:**
> - Resend for transactional emails
>
> All of this is deployed on Vercel with automatic CI/CD from our Git repository.
>
> We'll go much deeper into the architecture in Video 3."

---

### CLIP 1 CLOSING (14:30 - 15:00)

**[SCREEN: Dashboard or summary slide]**

**SAY:**

> "To summarize this first video:
>
> - We're solving four key problems: volume overload, unconscious bias, communication assessment, and regional requirements
> - GoIELTS is an AI-powered platform built bilingual from day one
> - We have four user roles with carefully designed permissions
> - Our stack is modern, scalable, and maintainable
>
> In the next video, we'll do a deep dive into every feature - starting with the candidate application flow, then the job wizard, and finally the applicant management system.
>
> See you in Clip 2."

---

# CLIP 2: FEATURES & USER EXPERIENCE DEEP DIVE
## Duration: 15 Minutes

### INTRODUCTION (0:00 - 0:30)

**[SCREEN: Title or dashboard]**

**SAY:**

> "Welcome to Clip 2 of our GoIELTS presentation series.
>
> In this video, we're doing a complete walkthrough of every feature in the platform. I'll show you:
> - The candidate application experience from start to finish
> - The job creation wizard with all its AI features
> - The applicant management system including the Kanban board
> - The detailed applicant view with all nine tabs
>
> Let's start by becoming a candidate."

---

### CANDIDATE APPLICATION FLOW (0:30 - 6:00)

#### Job Landing Page (0:30 - 1:30)

**[ACTION: Open public job application URL in browser]**
**[SCREEN: Job landing page]**

**SAY:**

> "This is what candidates see when they click on a job link. It could be shared on LinkedIn, in an email, or on your careers page.
>
> At the top, the job title is prominently displayed. Below that:
> - Employment type badge - this one is [Full-time/Part-time/etc.]
> - Location information
> - Salary range - this is configurable, companies can hide it
>
> On the right, we show required skills as visual badges. Candidates immediately know if they might be a fit.
>
> The full job description is here with all requirements and responsibilities.
>
> When ready, they click 'Start Application'."

**[ACTION: Click Start Application]**

---

#### Personal Information Step (1:30 - 2:30)

**[SCREEN: Personal information form]**

**SAY:**

> "Step one collects personal information.
>
> Required fields:
> - Full name
> - Email - validated in real-time
> - Phone number with country code selector
>
> Configurable fields:
> - Age range
> - Major or field of study
> - Years of experience
> - Salary expectations - can be hidden from reviewers
>
> Social profile links:
> - LinkedIn URL
> - Portfolio URL
> - GitHub URL
> - Behance URL
>
> These are optional but valuable. Our AI can analyze LinkedIn and GitHub profiles to build a more complete picture.
>
> The form has real-time validation. Invalid emails are caught immediately."

**[ACTION: Fill out form with test data, proceed to next step]**

---

#### Screening Questions (2:30 - 3:15)

**[SCREEN: Screening questions page]**

**SAY:**

> "Screening questions are yes/no questions defined by the hiring manager.
>
> For example:
> - 'Do you have the legal right to work in Saudi Arabia?'
> - 'Are you available to start within 2 weeks?'
> - 'Do you have at least 3 years of experience in this field?'
>
> Some questions are marked as 'knockout' questions. If a candidate answers incorrectly, they're automatically flagged - potentially rejected depending on settings.
>
> This filters out unqualified candidates before we invest AI resources in evaluation."

**[ACTION: Answer questions, proceed]**

---

#### Text Questions (3:15 - 3:45)

**[SCREEN: Text question page]**

**SAY:**

> "Text questions are open-ended responses.
>
> The candidate sees the question here. As they type, word count updates in real-time.
>
> We track:
> - When they started
> - When they finished
> - Total time spent
>
> This metadata helps assess how thoughtfully someone approached the question."

**[ACTION: Type a brief answer, proceed]**

---

#### Voice Recording (3:45 - 5:15)

**[SCREEN: Voice question page]**

**SAY:**

> "This is our voice recording feature - one of the most powerful capabilities.
>
> The question is displayed here. The candidate has a time limit - in this case [X] minutes.
>
> Key features:
>
> **Time Limit Options:** 30 seconds, 1 minute, 2 minutes, 3 minutes, or 5 minutes. The hiring manager configures this per question.
>
> **Blind Mode:** If enabled, the question is HIDDEN until they click record. This tests their ability to think on their feet.
>
> **Recording Controls:** Start, pause, resume. They can pause to collect their thoughts.
>
> **Playback:** Before submitting, they can listen to their recording and decide if they want to use a retake (if retakes are enabled).
>
> **Auto-Submit:** When the timer runs out, the recording is automatically submitted. No gaming the system.
>
> **Visual Feedback:** The countdown timer, audio level indicator, and recording status are all clearly visible.
>
> Behind the scenes, after submission:
> 1. Audio is uploaded to our storage
> 2. AI transcribes the audio - both raw and cleaned versions
> 3. AI analyzes fluency, sentiment, and content
> 4. Results are stored with the evaluation
>
> Recruiters can literally hear candidates before scheduling interviews."

**[ACTION: If comfortable, demonstrate recording briefly, or skip]**

---

#### File Upload & Submission (5:15 - 6:00)

**[SCREEN: File upload page, then thank you page]**

**SAY:**

> "The final step is file upload - typically the CV or resume.
>
> Drag and drop or click to browse. We accept PDF, DOC, and DOCX files up to 20MB.
>
> Progress is shown during upload.
>
> When they click Submit:
> 1. Application is saved to the database
> 2. Files are stored securely
> 3. AI evaluation pipeline is triggered automatically
>
> They see a thank you page with confirmation.
>
> Within minutes, their application has been fully scored by AI - ready for recruiter review."

---

### JOB CREATION WIZARD (6:00 - 9:30)

**[ACTION: Navigate to Jobs page, click Create Job]**
**[SCREEN: Job wizard dialog]**

**SAY:**

> "Now let's see how hiring managers create jobs. I'll walk through all five steps of the wizard."

---

#### Step 1: Job Basics (6:00 - 7:00)

**[SCREEN: Wizard Step 1]**

**SAY:**

> "Step 1 is job basics.
>
> **Job Title** - the position name.
>
> **Description** - the full job description. Here's an AI feature: we can provide bullet points and have AI generate a professional description. Or write it manually.
>
> **Department** - organizational unit.
>
> **Location** - where the job is based.
>
> **Employment Type** - dropdown with:
> - Full-time
> - Part-time
> - Contract
> - Internship
> - Remote
>
> **Salary Range** - minimum and maximum, optional.
>
> **Currency** - we support SAR, USD, AED, EGP, and TRY.
>
> All fields support both Arabic and English input."

**[ACTION: Fill out briefly, proceed to Step 2]**

---

#### Step 2: Evaluation Criteria (7:00 - 8:00)

**[SCREEN: Wizard Step 2]**

**SAY:**

> "Step 2 defines how candidates will be evaluated. This is critical - it's what the AI scores against.
>
> **Skills Section:**
> - I can add skills manually
> - OR click 'Extract Skills' and AI will analyze the job description and suggest relevant skills
> - Each skill is marked as Required or Preferred
> - And as Technical or Soft skill
>
> **Screening Questions:**
> - Add yes/no questions
> - Set the ideal answer
> - Mark knockout questions - wrong answer means potential rejection
>
> **Language Requirements:**
> - Add languages needed
> - Set proficiency level: Beginner, Intermediate, Advanced, Native
>
> **Minimum Experience:**
> - Set required years
> - Optionally set auto-reject threshold
>
> All of these criteria feed into the AI scoring algorithm."

**[ACTION: Add a skill and screening question, proceed to Step 3]**

---

#### Step 3: Candidate Data Requirements (8:00 - 8:30)

**[SCREEN: Wizard Step 3]**

**SAY:**

> "Step 3 configures what data we collect from candidates.
>
> **Require CV** - must they upload a resume?
>
> **Require LinkedIn** - must they provide LinkedIn URL?
>
> **Require Portfolio** - for design or technical roles.
>
> **Privacy Settings:**
> - Hide salary expectations from reviewers
> - Hide personal info from reviewers - for blind hiring
>
> These settings give flexibility for different hiring approaches."

**[ACTION: Proceed to Step 4]**

---

#### Step 4: Exam Builder (8:30 - 9:15)

**[SCREEN: Wizard Step 4]**

**SAY:**

> "Step 4 is the assessment builder.
>
> We can add:
>
> **Text Questions** - open-ended written responses
> - Set the question text
> - Set weight (1-10) for importance in scoring
> - Mark as required or optional
>
> **Voice Questions** - recorded audio responses
> - Set the question text
> - Set weight
> - Set time limit (30 seconds to 5 minutes)
> - Enable or disable blind mode
>
> **Retake Policy:**
> - Allow retakes? Yes or No
> - Maximum attempts if yes
>
> **Candidate Instructions:**
> - Free-form text shown before assessment begins
> - Can include tips, expectations, or encouragement
>
> Each question's weight affects how much it contributes to the final AI score."

**[ACTION: Add one question, proceed to Step 5]**

---

#### Step 5: Review & Publish (9:15 - 9:30)

**[SCREEN: Wizard Step 5]**

**SAY:**

> "Step 5 shows everything we've configured for review.
>
> We can:
> - **Save as Draft** - continue editing later
> - **Publish** - make the job live immediately
>
> Once published, the job appears on your careers page and candidates can start applying.
>
> The entire process takes just a few minutes with AI assistance."

---

### APPLICANT MANAGEMENT (9:30 - 14:30)

**[ACTION: Navigate to Applicants page]**

#### Kanban Board Overview (9:30 - 10:30)

**[SCREEN: Kanban board view]**

**SAY:**

> "This is where recruiters spend most of their time - the applicant Kanban board.
>
> Five columns representing the candidate journey:
>
> 1. **New** - just submitted, AI has scored them
> 2. **Evaluated** - a team member has reviewed
> 3. **Interview** - scheduled for interview
> 4. **Hired** - got the job!
> 5. **Rejected** - didn't make it
>
> Each card shows:
> - Candidate name
> - Email
> - AI score badge - color coded: green is high, yellow is medium, red is low
> - Applied date
>
> **Drag and drop** - move candidates between stages simply by dragging their card.
>
> **Filtering** - filter by score range, date, job, or status.
>
> Let me open a candidate to show you the detail view."

**[ACTION: Click on a candidate card to open detail dialog]**

---

#### Applicant Detail - Overview Tab (10:30 - 11:00)

**[SCREEN: Applicant dialog - Overview tab]**

**SAY:**

> "The applicant detail dialog has nine tabs. Let's go through each one.
>
> **Tab 1: Overview**
>
> This shows:
> - Personal information - name, email, phone
> - Contact details
> - CV preview or download link
> - Current status badge
> - Tags assigned to this candidate
> - Quick action buttons"

---

#### Applicant Detail - AI Evaluation Tab (11:00 - 12:00)

**[ACTION: Click AI Evaluation tab]**
**[SCREEN: AI Evaluation tab]**

**SAY:**

> "**Tab 2: AI Evaluation** - the heart of our system.
>
> At the top, the **Overall Score** - [X] out of 100.
>
> The **Recommendation** badge - Hire, Hold, Reject, or Pending.
>
> **Criteria Matches** - breakdown of how they scored on each criterion:
> - Skills matching
> - Experience
> - Language proficiency
> - Screening questions
> - Response quality
>
> Each shows a score and the AI's reasoning.
>
> **Strengths** - what the AI identified as positives, in both English and Arabic.
>
> **Weaknesses** - areas of concern.
>
> **Red Flags** - serious issues (only visible to Admin and above, hidden from Reviewers).
>
> **Summary** - bilingual overall assessment.
>
> This gives recruiters immediate insight without reading every word of every response."

---

#### Applicant Detail - Voice & Text Tabs (12:00 - 12:45)

**[ACTION: Click Voice Analysis tab]**
**[SCREEN: Voice Analysis tab]**

**SAY:**

> "**Tab 3: Voice Analysis**
>
> If the candidate recorded voice responses, we see:
> - Audio player - listen directly in the browser
> - Raw transcript - exactly what they said
> - Cleaned transcript - corrected grammar, removed filler words
> - Fluency metrics:
>   - Words per minute
>   - Filler word count (ums, uhs)
>   - Pause analysis
> - Sentiment - positive, neutral, or negative
> - Key phrases extracted
>
> This is powerful - you can assess communication before ever meeting them."

**[ACTION: Click Text Responses tab]**

**SAY:**

> "**Tab 4: Text Responses**
>
> All written answers displayed:
> - Question text
> - Full response
> - Word count
> - Time spent
> - AI quality assessment"

---

#### Applicant Detail - Other Tabs (12:45 - 13:45)

**[ACTION: Click through remaining tabs briefly]**

**SAY:**

> "**Tab 5: Screening** - shows how they answered yes/no questions and whether any knockouts were triggered.
>
> **Tab 6: External Profiles** - if they provided LinkedIn or GitHub, our AI analyzed those:
> - LinkedIn summary and skills
> - GitHub repositories and activity
> - Portfolio projects
>
> **Tab 7: Team Notes** - internal comments from your team. You can @mention colleagues. All notes are time-stamped.
>
> **Tab 8: Manual Review** - where team members record their human evaluation:
> - Star rating (1-5)
> - Decision: Strong Hire, Recommended, Neutral, Not Recommended, Strong No
> - Pros and cons
> - Private notes (admin only)
> - Per-skill ratings
>
> This complements the AI - human judgment matters.
>
> **Tab 9: Interview** - schedule and manage interviews. Set date, time, meeting link, and notes."

---

#### Other Dashboard Features (13:45 - 14:30)

**[ACTION: Navigate to Calendar, then Settings briefly]**

**SAY:**

> "A few more features to highlight:
>
> **Calendar** - month view of all scheduled interviews. Color-coded by status. Click any event to view or edit details.
>
> **Settings** - Company Settings for branding, and System Settings for SuperAdmins to configure:
> - AI parameters
> - Email settings
> - Security options
> - Feature flags
>
> **Audit Logs** - complete trail of every action in the system. Who did what, when, and what changed."

---

### CLIP 2 CLOSING (14:30 - 15:00)

**[SCREEN: Dashboard or summary]**

**SAY:**

> "That completes our feature tour.
>
> To recap:
> - Candidate experience: smooth, mobile-friendly, voice-enabled
> - Job wizard: AI-assisted, comprehensive, fast
> - Applicant management: Kanban board, nine detailed tabs, full AI insights
>
> In the next video, we go deep into the technical architecture - how the AI system works, the database design, and our API structure.
>
> See you in Clip 3."

---

# CLIP 3: AI SYSTEM & TECHNICAL ARCHITECTURE
## Duration: 15 Minutes

### INTRODUCTION (0:00 - 0:30)

**[SCREEN: VS Code or title slide]**

**SAY:**

> "Welcome to Clip 3 - the technical deep dive.
>
> This video is especially relevant for the engineering team, but I'll explain concepts clearly for everyone.
>
> We'll cover:
> - How our AI evaluation pipeline works end-to-end
> - The scoring algorithm and how recommendations are generated
> - Our database design and why we made certain choices
> - The API architecture and patterns we follow
>
> Let's start with the AI system."

---

### AI EVALUATION PIPELINE (0:30 - 5:30)

#### Pipeline Overview (0:30 - 1:30)

**[SCREEN: Can show VS Code with services/evaluation folder, or draw diagram]**

**SAY:**

> "When a candidate submits their application, an AI evaluation pipeline is triggered. Let me walk you through each stage.
>
> The pipeline has five main components:
>
> 1. **Resume Parser** - extracts structured data from PDFs
> 2. **Voice Transcription** - converts audio to text
> 3. **URL Content Extractor** - analyzes LinkedIn, GitHub profiles
> 4. **Scoring Engine** - evaluates against job criteria
> 5. **Result Storage** - saves evaluation to database
>
> These run in sequence, with some operations parallelized for performance.
>
> Let me explain each component."

---

#### Resume Parser (1:30 - 2:30)

**[SCREEN: VS Code showing resumeParser.ts or diagram]**

**SAY:**

> "The Resume Parser lives in `src/services/evaluation/resumeParser.ts`.
>
> **Input:** A URL to a PDF file in our storage.
>
> **Process:**
> 1. Download the PDF
> 2. Convert to base64
> 3. Send to Google Gemini's vision API
> 4. Prompt the AI to extract structured data
>
> **Output:** A structured object containing:
> - Personal info: name, email, phone, location
> - Skills array
> - Work experience with companies, titles, dates, achievements
> - Education with degrees and institutions
> - Languages with proficiency levels
> - Certifications
> - Social links found in the document
>
> The AI is remarkably good at this. We achieve over 95% accuracy on most fields.
>
> If Gemini is unavailable, we fall back to OpenAI's GPT-4 Vision."

---

#### Voice Transcription (2:30 - 3:30)

**[SCREEN: VS Code showing voiceTranscription.ts]**

**SAY:**

> "Voice Transcription is in `src/services/evaluation/voiceTranscription.ts`.
>
> **Input:** Audio file URL (WebM, MP3, WAV, M4A, or OGG).
>
> **Process:**
> 1. Download audio from storage
> 2. Send to Gemini's audio API
> 3. Receive transcription
> 4. Generate cleaned version (grammar corrected, fillers removed)
>
> **Output:**
> - Raw transcript - exactly what was said
> - Clean transcript - polished version
> - Word count and duration
> - Fluency metrics: words per minute, filler count, pause count
> - Confidence score
> - Detected language
> - Sentiment analysis: positive, neutral, or negative
>
> The raw transcript preserves 'um', 'uh', pauses - useful for analyzing communication style.
>
> The clean transcript is easier to read and focuses on content.
>
> Fallback is OpenAI's Whisper API."

---

#### URL Content Extractor (3:30 - 4:00)

**[SCREEN: VS Code showing urlContentExtractor.ts]**

**SAY:**

> "The URL Content Extractor handles social profiles.
>
> We support:
> - LinkedIn - extract skills, experience, headline
> - GitHub - repositories, stars, contribution activity
> - Portfolio sites - projects, technologies used
> - Behance - design projects, views
>
> This enriches candidate profiles beyond just their resume.
>
> The data feeds into the scoring engine alongside other inputs."

---

#### Scoring Engine (4:00 - 5:30)

**[SCREEN: VS Code showing scoringEngine.ts]**

**SAY:**

> "The Scoring Engine is the brain of our AI system. It's in `src/services/evaluation/scoringEngine.ts`.
>
> **Inputs:**
> - Parsed resume data
> - Voice transcripts and analysis
> - Text response content
> - Screening question answers
> - Job requirements: skills, experience, languages
> - External profile data
>
> **Scoring Criteria and Weights:**
>
> | Criterion | Weight |
> |-----------|--------|
> | Skills Match | 25% |
> | Experience | 20% |
> | Language Proficiency | 15% |
> | Screening Answers | 20% |
> | Response Quality | 15% |
> | Cultural Fit | 5% |
>
> For skills, we check:
> - Exact matches
> - Synonym matches (JS = JavaScript)
> - Semantic matches (React implies JavaScript knowledge)
>
> Required skills are weighted higher than preferred skills.
>
> **Knockout Logic:**
> If any knockout screening question is failed, recommendation is automatically 'reject' regardless of score.
>
> **Final Recommendation:**
> - Score >= 80: 'hire'
> - Score 60-79: 'hold'
> - Score 40-59: 'pending'
> - Score < 40: 'reject'
>
> **Output:**
> - Overall score (0-100)
> - Per-criteria scores
> - Strengths array (bilingual)
> - Weaknesses array (bilingual)
> - Red flags array (bilingual)
> - Summary (bilingual)
> - Recommendation with reasoning
>
> All generated in both English and Arabic simultaneously."

---

### DATABASE DESIGN (5:30 - 9:00)

#### Schema Overview (5:30 - 6:30)

**[SCREEN: VS Code showing models folder structure or ER diagram]**

**SAY:**

> "Let me explain our database design. We use MongoDB with Mongoose as our ODM.
>
> We have 15 collections:
>
> **Core Collections:**
> 1. **Users** - system users and authentication
> 2. **Jobs** - job postings with all wizard configuration
> 3. **Applicants** - candidate applications
> 4. **Responses** - individual question responses
> 5. **Evaluations** - AI-generated evaluations
>
> **Collaboration Collections:**
> 6. **Reviews** - manual team reviews
> 7. **Interviews** - scheduled interviews
> 8. **Comments** - team notes on applicants
>
> **System Collections:**
> 9. **Notifications** - user notifications
> 10. **AuditLogs** - activity trail (90-day TTL)
> 11. **CompanyProfile** - company settings
> 12. **SystemConfig** - system configuration
> 13. **Permissions** - role permissions
> 14. **Sessions** - active sessions
> 15. **Questions** - question bank (legacy)
>
> Each model follows a consistent pattern."

---

#### Key Schema Examples (6:30 - 8:00)

**[SCREEN: VS Code showing schema files]**

**SAY:**

> "Let me show you some key schemas.
>
> **Applicant Schema** - `src/models/Applicants/applicantSchema.ts`:
>
> ```typescript
> {
>   jobId: ObjectId,          // Reference to Job
>   personalData: {
>     fullName: String,
>     email: String,
>     phone: String,
>     // ... other fields
>   },
>   cvUrl: String,            // S3 URL to CV
>   cvParsedData: Object,     // AI-extracted data
>   status: 'new' | 'evaluated' | 'interview' | 'hired' | 'rejected',
>   aiScore: Number,          // 0-100
>   aiSummary: String,
>   aiRedFlags: [String],
>   evaluationStatus: 'pending' | 'processing' | 'completed' | 'failed',
>   sessionId: String,        // For anti-cheat
>   isSuspicious: Boolean
> }
> ```
>
> **Evaluation Schema** - stores the full AI analysis:
>
> ```typescript
> {
>   applicantId: ObjectId,
>   overallScore: Number,
>   criteriaMatches: [{
>     criterion: String,
>     score: Number,
>     weight: Number,
>     reasons: { en: String, ar: String }
>   }],
>   strengths: { en: [String], ar: [String] },
>   weaknesses: { en: [String], ar: [String] },
>   redFlags: { en: [String], ar: [String] },
>   summary: { en: String, ar: String },
>   recommendation: 'hire' | 'hold' | 'reject' | 'pending',
>   aiAnalysisBreakdown: {
>     screeningQuestionsAnalysis: Object,
>     voiceResponsesAnalysis: Object,
>     textResponsesAnalysis: Object,
>     // ... detailed breakdown
>   }
> }
> ```
>
> Notice the bilingual pattern - `{ en: String, ar: String }` - used throughout for all AI-generated text."

---

#### Indexing Strategy (8:00 - 8:30)

**[SCREEN: Schema file showing indexes]**

**SAY:**

> "We've carefully indexed our collections for performance.
>
> Key indexes:
>
> **Applicants:**
> - `{ jobId: 1, status: 1 }` - query applicants by job and status
> - `{ aiScore: -1 }` - sort by score descending
> - `{ 'personalData.email': 1 }` - lookup by email
> - `{ sessionId: 1 }` - anti-cheat tracking
>
> **Audit Logs:**
> - `{ timestamp: 1 }` with TTL index - auto-delete after 90 days
>
> **Jobs:**
> - Text index on title and description for search
>
> These indexes ensure fast queries even as data grows."

---

#### Data Relationships (8:30 - 9:00)

**SAY:**

> "Key relationships:
>
> - **Job → Applicants** - one-to-many
> - **Applicant → Responses** - one-to-many
> - **Applicant → Evaluation** - one-to-one
> - **Applicant → Reviews** - one-to-many
> - **User → Jobs (created)** - one-to-many
>
> When a job is deleted, we cascade delete its applicants. When an applicant is deleted, we cascade delete their responses, evaluation, and reviews.
>
> This maintains referential integrity."

---

### API ARCHITECTURE (9:00 - 12:30)

#### Central Router Pattern (9:00 - 10:00)

**[SCREEN: VS Code showing src/app/api/[[...route]]/route.ts]**

**SAY:**

> "Our API uses the Hono framework with a central router pattern.
>
> All routes are defined in `src/app/api/[[...route]]/route.ts`.
>
> ```typescript
> const app = new Hono().basePath('/api')
>
> const routes = app
>   .route('/users', users)
>   .route('/jobs', jobs)
>   .route('/applicants', applicants)
>   .route('/evaluations', evaluations)
>   .route('/ai/evaluate', evaluationProcessing)
>   // ... more routes
>
> export const GET = handle(app)
> export const POST = handle(app)
> export const PATCH = handle(app)
> export const DELETE = handle(app)
> ```
>
> This catch-all route handles every API request. Each model has its own route file that's imported here.
>
> Benefits:
> - Single entry point
> - Easy to see all routes at a glance
> - Consistent middleware application
> - Type-safe with Hono"

---

#### Route Template Pattern (10:00 - 11:00)

**[SCREEN: VS Code showing a model's route.ts file]**

**SAY:**

> "Every model follows the same route template pattern.
>
> Here's the pattern in `src/models/[Model]/route.ts`:
>
> ```typescript
> import { Hono } from 'hono'
> import dbConnect from '@/lib/mongodb'
> import { authenticate, requireRole } from '@/lib/authMiddleware'
>
> const app = new Hono()
>
> // GET all
> app.get('/', authenticate, async (c) => {
>   await dbConnect()
>   try {
>     const items = await Model.find()
>     return c.json({ success: true, data: items })
>   } catch (error) {
>     return c.json({ success: false, error: 'Failed to fetch' }, 500)
>   }
> })
>
> // POST create
> app.post('/', authenticate, requireRole('admin'), async (c) => {
>   await dbConnect()
>   const body = await c.req.json()
>   // ... validation and creation
> })
> ```
>
> Key patterns:
> 1. Always call `await dbConnect()` first
> 2. Use `authenticate` middleware for protected routes
> 3. Use `requireRole()` for role-based access
> 4. Return consistent response format: `{ success, data?, error? }`
> 5. Proper error handling"

---

#### Authentication Middleware (11:00 - 11:45)

**[SCREEN: VS Code showing authMiddleware.ts]**

**SAY:**

> "Authentication is handled by middleware in `src/lib/authMiddleware.ts`.
>
> **authenticate** middleware:
> - Reads JWT from HTTP-only cookie
> - Verifies token signature
> - Attaches user to request context
> - Returns 401 if invalid
>
> **requireRole** middleware:
> - Checks user's role against required minimum
> - Role hierarchy: reviewer < admin < superadmin
> - Returns 403 if insufficient permission
>
> ```typescript
> export function requireRole(minRole: Role) {
>   return async (c: Context, next: Next) => {
>     const user = c.get('user')
>     if (!hasPermission(user.role, minRole)) {
>       return c.json({ error: 'Forbidden' }, 403)
>     }
>     await next()
>   }
> }
> ```
>
> This ensures every route is properly protected."

---

#### Response Format (11:45 - 12:30)

**SAY:**

> "We use a consistent response format throughout the API:
>
> **Success response:**
> ```json
> {
>   \"success\": true,
>   \"data\": { ... },
>   \"meta\": {
>     \"page\": 1,
>     \"limit\": 20,
>     \"total\": 100
>   }
> }
> ```
>
> **Error response:**
> ```json
> {
>   \"success\": false,
>   \"error\": \"Error message\",
>   \"details\": { ... }
> }
> ```
>
> This makes it easy for the frontend to handle responses consistently.
>
> All endpoints also use proper HTTP status codes:
> - 200 for success
> - 201 for created
> - 400 for bad request
> - 401 for unauthorized
> - 403 for forbidden
> - 404 for not found
> - 500 for server error"

---

### PROJECT STRUCTURE (12:30 - 14:30)

**[SCREEN: VS Code showing folder structure]**

**SAY:**

> "Let me give you a tour of the codebase structure.
>
> ```
> src/
> ├── app/                    # Next.js App Router
> │   ├── (auth)/             # Auth pages (login)
> │   ├── (dashboard)/        # Protected dashboard routes
> │   ├── (public)/           # Public routes (job application)
> │   └── api/[[...route]]/   # Hono API catch-all
> │
> ├── components/
> │   ├── ui/                 # shadcn/ui components (don't modify)
> │   └── dashboard/          # Dashboard-specific components
> │
> ├── lib/                    # Utilities
> │   ├── mongodb.ts          # Database connection
> │   ├── s3.ts               # File storage
> │   ├── session.ts          # JWT sessions
> │   ├── authMiddleware.ts   # Auth middleware
> │   └── ...
> │
> ├── models/                 # Database models + API routes
> │   ├── Users/
> │   │   ├── userSchema.ts
> │   │   └── route.ts
> │   └── ...
> │
> ├── services/               # Business logic
> │   └── evaluation/         # AI evaluation pipeline
> │
> ├── hooks/                  # React hooks
> └── i18n/                   # Internationalization
>     └── locales/
>         ├── en.json
>         └── ar.json
> ```
>
> Key principles:
> - **Feature-based organization** - related files are colocated
> - **Separation of concerns** - models, services, components are separate
> - **Consistent patterns** - every model follows same structure"

---

### CLIP 3 CLOSING (14:30 - 15:00)

**[SCREEN: VS Code or summary]**

**SAY:**

> "That covers the technical architecture.
>
> Key takeaways:
> - AI pipeline: Resume Parser → Voice Transcription → Scoring Engine
> - Database: 15 collections with careful indexing
> - API: Hono with central router, consistent patterns
> - Codebase: Feature-based, well-organized
>
> In the final video, we'll cover security, infrastructure, and our roadmap for future development.
>
> See you in Clip 4."

---

# CLIP 4: SECURITY, INFRASTRUCTURE & ROADMAP
## Duration: 15 Minutes

### INTRODUCTION (0:00 - 0:30)

**[SCREEN: Dashboard or title]**

**SAY:**

> "Welcome to the final video in our series - Clip 4.
>
> We'll cover three important areas:
> 1. Security - how we protect the system and data
> 2. Infrastructure - how the platform is deployed and monitored
> 3. Roadmap - what's coming next
>
> Let's start with security."

---

### SECURITY FRAMEWORK (0:30 - 5:00)

#### Authentication System (0:30 - 1:30)

**[SCREEN: VS Code or diagram]**

**SAY:**

> "Our authentication system is built on JWT tokens.
>
> **How it works:**
>
> 1. User logs in with email and password
> 2. We verify password against bcrypt hash in database
> 3. Generate JWT token containing:
>    - User ID
>    - Email
>    - Name
>    - Role
>    - Expiration (7 days)
> 4. Token is stored in HTTP-only cookie
>
> **Security measures:**
>
> - **HTTP-only cookie** - JavaScript cannot access the token, preventing XSS attacks
> - **Secure flag** - Cookie only sent over HTTPS
> - **SameSite=Strict** - Prevents CSRF attacks
> - **bcrypt hashing** - Passwords are never stored in plaintext, 12 salt rounds
>
> The token is verified on every API request by our middleware."

---

#### Role-Based Access Control (1:30 - 3:00)

**[SCREEN: Permission matrix or dashboard]**

**SAY:**

> "We have a three-level role hierarchy.
>
> **Level 1: Reviewer**
> - View assigned applicants
> - View AI evaluations (filtered - no red flags)
> - Submit manual reviews
> - Add team comments
> - CANNOT create jobs, delete applicants, see sensitive data
>
> **Level 2: Admin**
> - Everything Reviewer can do, PLUS
> - Create, edit, delete jobs
> - Manage all applicants
> - Schedule interviews
> - Access company settings
> - See full evaluation data including red flags
>
> **Level 3: SuperAdmin**
> - Everything Admin can do, PLUS
> - User management - create, delete users
> - System configuration
> - Audit log access
> - Permission management
>
> Every API endpoint is protected with role checks.
>
> **Data filtering by role:**
>
> When a Reviewer fetches an applicant, we automatically filter out:
> - Red flags
> - Salary expectations (if configured)
> - Personal info (if blind hiring is enabled)
>
> They literally cannot see data they shouldn't see."

---

#### Audit Logging (3:00 - 4:00)

**[ACTION: Navigate to Audit Logs page if SuperAdmin]**
**[SCREEN: Audit logs page]**

**SAY:**

> "Every action in the system is logged.
>
> We track:
> - **Who** - user ID, email, name, role
> - **What** - 50+ action types: login, job.created, applicant.status_changed, etc.
> - **When** - timestamp
> - **Where** - IP address, user agent
> - **Changes** - before and after state for updates
>
> Logs are retained for 90 days, then automatically deleted via TTL index.
>
> This provides:
> - Complete audit trail for compliance
> - Debugging capability
> - Security monitoring
>
> SuperAdmins can filter logs by user, action type, date range, and severity."

---

#### Anti-Cheat for Candidates (4:00 - 4:30)

**SAY:**

> "For candidates, we have anti-cheat mechanisms:
>
> - **Session tracking** - unique ID per application session
> - **Tab visibility detection** - we detect if they switch tabs during assessment
> - **IP logging** - recorded for each submission
> - **User agent** - browser fingerprinting
> - **Auto-submit** - if timer runs out, recording is submitted automatically
> - **Suspicious flag** - applications can be flagged for review
>
> Recruiters can see if an application was marked suspicious."

---

#### Security Best Practices (4:30 - 5:00)

**SAY:**

> "Additional security measures:
>
> - All inputs are validated with Zod schemas
> - File type verification on uploads
> - Rate limiting (planned)
> - HTTPS enforced
> - Environment variables for secrets
> - No sensitive data in client-side code
>
> We follow OWASP guidelines for web application security."

---

### INFRASTRUCTURE & DEPLOYMENT (5:00 - 9:00)

#### Environment Architecture (5:00 - 6:00)

**[SCREEN: Diagram or dashboard]**

**SAY:**

> "We have three environments:
>
> **Development:**
> - localhost:3000
> - Development MongoDB database
> - Development storage bucket
>
> **Staging:**
> - Vercel preview deployments
> - Staging database
> - Staging storage bucket
>
> **Production:**
> - Vercel production
> - Production MongoDB Atlas
> - Production DigitalOcean Spaces
>
> Each environment is isolated with its own credentials."

---

#### Service Architecture (6:00 - 7:00)

**SAY:**

> "Our production architecture:
>
> **Hosting: Vercel**
> - Automatic deployments from Git
> - Edge functions for API routes
> - Global CDN for static assets
> - Automatic SSL
>
> **Database: MongoDB Atlas**
> - Managed MongoDB cluster
> - Automatic backups
> - High availability
> - Scaling as needed
>
> **Storage: DigitalOcean Spaces**
> - S3-compatible object storage
> - Stores CVs, voice recordings, files
> - CDN for fast access
>
> **AI Services:**
> - Google Gemini 2.0 Flash (primary)
> - OpenAI (fallback)
>
> **Email: Resend**
> - Transactional email delivery"

---

#### CI/CD Pipeline (7:00 - 7:45)

**SAY:**

> "Our deployment pipeline:
>
> **On every push to a feature branch:**
> 1. Lint check runs
> 2. Build verification
> 3. Preview deployment created automatically
>
> **On merge to main:**
> 1. Full build
> 2. Tests run (when implemented)
> 3. Deploy to production
>
> This gives us:
> - Automatic preview URLs for review
> - Confidence that main is always deployable
> - Fast iteration cycles"

---

#### Environment Variables (7:45 - 8:15)

**SAY:**

> "Required environment variables:
>
> ```
> MONGODB_URI          - Database connection
> JWT_SECRET           - Token signing
> GOOGLE_API_KEY       - Gemini AI
> OPENAI_API_KEY       - Fallback AI
> DO_SPACES_*          - Storage credentials
> RESEND_API_KEY       - Email service
> NEXT_PUBLIC_APP_URL  - Application URL
> ```
>
> All secrets are stored securely in Vercel's environment variable system.
>
> Never committed to Git."

---

#### Monitoring (8:15 - 9:00)

**SAY:**

> "Current and planned monitoring:
>
> **Current:**
> - Vercel Analytics for performance
> - Vercel Logs for debugging
> - MongoDB Atlas monitoring for database
>
> **Planned:**
> - Sentry for error tracking
> - Better Uptime for availability monitoring
> - Custom dashboards for business metrics
>
> **Key metrics we track:**
> - API response times
> - Error rates
> - AI evaluation duration
> - Database query performance
> - Storage usage"

---

### PERFORMANCE CONSIDERATIONS (9:00 - 10:00)

**SAY:**

> "Performance targets and optimizations:
>
> **Frontend:**
> - Server-side rendering for fast initial load
> - Code splitting for smaller bundles
> - Image optimization with Next.js Image
> - Target: LCP under 2.5 seconds
>
> **API:**
> - Connection pooling for database
> - Efficient queries with proper indexes
> - Target: p95 response under 500ms
>
> **AI Pipeline:**
> - Parallel operations where possible
> - Efficient prompts to minimize tokens
> - Target: Full evaluation under 60 seconds
>
> **Database:**
> - Compound indexes for common queries
> - Lean queries where full documents aren't needed
> - TTL index for automatic cleanup of audit logs"

---

### FUTURE ROADMAP (10:00 - 14:00)

#### Short-Term: Q1-Q2 2026 (10:00 - 11:30)

**[SCREEN: Dashboard or roadmap slide]**

**SAY:**

> "Let me share our development roadmap.
>
> **Short-term priorities (next 6 months):**
>
> **1. Video Question Support** - Priority: High
> - Add video recording alongside audio
> - AI analysis of visual presentation
> - Useful for customer-facing roles
>
> **2. Two-Factor Authentication** - Priority: High
> - TOTP-based 2FA
> - Enhanced security for enterprise clients
>
> **3. Calendar Integration** - Priority: High
> - Google Calendar sync
> - Outlook Calendar sync
> - Automatic interview invites
>
> **4. Advanced Analytics Dashboard** - Priority: High
> - Time-to-hire metrics
> - Funnel conversion rates
> - Source tracking
> - Custom reports
>
> **5. Error Tracking (Sentry)** - Priority: High
> - Real-time error monitoring
> - Performance tracking
> - User session replay
>
> **6. API Rate Limiting** - Priority: High
> - Protect against abuse
> - Fair usage policies"

---

#### Medium-Term: Q3-Q4 2026 (11:30 - 12:30)

**SAY:**

> "**Medium-term goals (6-12 months):**
>
> **1. Mobile Application** - Priority: Medium
> - React Native or Flutter
> - Core recruiter functionality
> - Push notifications
> - On-the-go candidate review
>
> **2. ATS Integrations** - Priority: Medium
> - Greenhouse integration
> - Lever integration
> - Workday integration
> - Bi-directional sync
>
> **3. Custom Scoring Weights** - Priority: Medium
> - Admin can configure criterion weights per job
> - More control over AI evaluation
>
> **4. Email Template Builder** - Priority: Medium
> - Visual email editor
> - Custom templates for different stages
> - Variable substitution
>
> **5. WebSocket Real-time Updates** - Priority: Medium
> - Live updates without refresh
> - Collaborative features
> - Real-time notifications
>
> **6. Candidate Self-Service Portal** - Priority: Medium
> - Candidates can check application status
> - Update their information
> - View scheduled interviews"

---

#### Long-Term: 2027+ (12:30 - 13:00)

**SAY:**

> "**Long-term vision (12+ months):**
>
> **Multi-tenancy**
> - Single deployment serving multiple companies
> - Data isolation
> - Custom branding per tenant
>
> **AI Interview Assistant**
> - AI-suggested interview questions
> - Real-time coaching for interviewers
> - Automated note-taking
>
> **Skills Assessment Integrations**
> - HackerRank, Codility integration
> - Psychometric tests
> - Technical assessments
>
> **HRIS Integrations**
> - SAP SuccessFactors
> - Oracle HCM
> - Automated onboarding
>
> **On-Premise Deployment**
> - For enterprises requiring data sovereignty
> - Docker-based deployment
> - Self-hosted option"

---

### PROJECT SUMMARY (13:00 - 14:30)

**[SCREEN: Dashboard or summary slide]**

**SAY:**

> "Let me summarize everything we've covered across these four videos.
>
> **What is GoIELTS?**
> - An AI-powered recruitment platform
> - Built bilingual from day one (Arabic/English)
> - Voice assessment capability unique in the market
> - Modern, scalable architecture
>
> **Key Features:**
> - Smooth candidate application with voice recording
> - AI-assisted job creation wizard
> - Kanban-based applicant management
> - Detailed AI evaluation with bilingual output
> - Comprehensive team collaboration tools
>
> **Technical Foundation:**
> - Next.js 16 + React 19 + TypeScript
> - Hono API with MongoDB
> - Google Gemini AI for evaluation
> - Secure, role-based access control
> - Complete audit logging
>
> **Business Value:**
> - Reduces screening time by 85%+
> - Consistent, unbiased evaluation
> - Assess communication skills at scale
> - Native support for MENA market requirements
>
> **Roadmap:**
> - Video support, 2FA, calendar integration in near term
> - Mobile app, ATS integrations in medium term
> - Multi-tenancy, advanced AI in long term"

---

### CLOSING (14:30 - 15:00)

**[SCREEN: Dashboard or thank you slide]**

**SAY:**

> "That concludes our four-part presentation series on GoIELTS.
>
> To recap the four videos:
> - **Clip 1:** Project overview and business context
> - **Clip 2:** Features and user experience deep dive
> - **Clip 3:** AI system and technical architecture
> - **Clip 4:** Security, infrastructure, and roadmap
>
> I hope this gives you a comprehensive understanding of what we've built and where we're headed.
>
> If you have any questions, please don't hesitate to reach out.
>
> Thank you for watching, and I look forward to your feedback.
>
> Shukran."

---

# APPENDIX: QUICK REFERENCE

## Clip Duration Breakdown

| Clip | Section | Time |
|------|---------|------|
| **1** | Introduction | 0:00-1:30 |
| | Problems We Solve | 1:30-4:00 |
| | Solution Overview | 4:00-7:00 |
| | Platform Walkthrough | 7:00-10:00 |
| | User Roles | 10:00-12:30 |
| | Tech Stack | 12:30-14:30 |
| | Closing | 14:30-15:00 |
| **2** | Introduction | 0:00-0:30 |
| | Candidate Flow | 0:30-6:00 |
| | Job Wizard | 6:00-9:30 |
| | Applicant Management | 9:30-14:30 |
| | Closing | 14:30-15:00 |
| **3** | Introduction | 0:00-0:30 |
| | AI Pipeline | 0:30-5:30 |
| | Database Design | 5:30-9:00 |
| | API Architecture | 9:00-12:30 |
| | Project Structure | 12:30-14:30 |
| | Closing | 14:30-15:00 |
| **4** | Introduction | 0:00-0:30 |
| | Security | 0:30-5:00 |
| | Infrastructure | 5:00-9:00 |
| | Performance | 9:00-10:00 |
| | Roadmap | 10:00-14:00 |
| | Summary & Closing | 14:00-15:00 |

## Key Files to Show in VS Code

| Clip | Files |
|------|-------|
| 3 | `services/evaluation/resumeParser.ts` |
| 3 | `services/evaluation/voiceTranscription.ts` |
| 3 | `services/evaluation/scoringEngine.ts` |
| 3 | `models/Applicants/applicantSchema.ts` |
| 3 | `models/Evaluations/evaluationSchema.ts` |
| 3 | `app/api/[[...route]]/route.ts` |
| 3 | `lib/authMiddleware.ts` |
| 4 | `lib/session.ts` |
| 4 | `lib/mongodb.ts` |

## Demo Pages to Prepare

| Clip | URLs |
|------|------|
| 1, 2 | `/dashboard` |
| 2 | `/apply/[jobId]` (public) |
| 2 | `/dashboard/jobs` |
| 2 | `/dashboard/applicants` |
| 4 | `/dashboard/audit-logs` |
| 4 | `/dashboard/settings` |

---

*Video Series Script Version: 1.0*
*Total Duration: 60 minutes (4 x 15 min)*
*Last Updated: January 2026*
