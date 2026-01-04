# GoIELTS Video Presentation Script
## Complete Recording Guide for Manager Presentation (30 Minutes)

---

# PRE-RECORDING CHECKLIST

## Before You Start Recording

### Browser Setup
- [ ] Open Chrome/Edge in a clean window (no personal tabs)
- [ ] Clear browser history or use Incognito for candidate demo
- [ ] Zoom browser to 100% or 110% for readability
- [ ] Close all notifications (Slack, email, etc.)

### Application Setup
- [ ] Start the development server: `bun dev`
- [ ] Have these URLs ready in separate tabs:
  1. Dashboard login page: `http://localhost:3000/login`
  2. Public job application: `http://localhost:3000/apply/[active-job-id]`
  3. VS Code with project open (for code showing)

### Test Data Needed
- [ ] At least 1 active job with questions configured
- [ ] At least 5-10 applicants in different statuses
- [ ] At least 1 applicant with completed AI evaluation
- [ ] Admin account credentials ready
- [ ] Candidate test data (name, email, phone) ready

### Recording Software
- [ ] Screen recording software ready (OBS, Loom, or QuickTime)
- [ ] Microphone tested and working
- [ ] Record at 1080p or higher resolution

---

# PRESENTATION SCRIPT

## PART 1: INTRODUCTION (0:00 - 2:00)

### Screen: Desktop or Title Slide

**[SHOW: A simple title slide or your desktop with the app logo]**

---

**SAY:**

> "Assalamu Alaikum, and welcome to this comprehensive demonstration of GoIELTS - our AI-powered recruitment platform.
>
> My name is [Your Name], and over the next 30 minutes, I'll walk you through the complete system - from how candidates apply for jobs, to how our AI evaluates them, to how recruiters manage the entire hiring pipeline.
>
> GoIELTS was built to solve three major challenges in recruitment:
>
> **First** - the overwhelming volume of applications that HR teams receive. Our AI automatically scores and ranks every candidate, saving hours of manual screening.
>
> **Second** - the need for consistent, unbiased evaluation. Our system evaluates every candidate against the same criteria, removing human bias from initial screening.
>
> **Third** - the complexity of managing a bilingual workforce. The entire platform works seamlessly in both Arabic and English, with full right-to-left support.
>
> Let me show you how it all works, starting from the candidate's perspective."

---

## PART 2: CANDIDATE APPLICATION FLOW (2:00 - 7:00)

### Scene 2.1: Job Landing Page (2:00 - 3:00)

**[ACTION: Switch to browser tab with public job application URL]**
**[SHOW: Job landing page at /apply/[jobId]]**

---

**SAY:**

> "This is what candidates see when they click on a job link. Let's say this was shared on LinkedIn or sent via email.
>
> At the top, you can see the job title - in this case, [read the job title]. Below that, we display key information candidates care about:
>
> - The employment type - whether it's full-time, part-time, contract, or remote
> - The location
> - And the salary range, if the company chooses to display it
>
> On the right side, we show the required skills as badges, so candidates can quickly assess if they're a good fit.
>
> The full job description is displayed here, with all the requirements and responsibilities.
>
> When a candidate is ready to apply, they click this 'Start Application' button."

**[ACTION: Click the "Start Application" button]**

---

### Scene 2.2: Personal Information Step (3:00 - 4:00)

**[SHOW: Personal information form]**

---

**SAY:**

> "The first step collects the candidate's personal information.
>
> We ask for:
> - Full name
> - Email address - which we validate in real-time
> - Phone number with country code selection
> - Their age range
> - Their major or field of study
> - Years of experience
> - And optionally, their salary expectations
>
> We also collect social profile links - LinkedIn, Portfolio, GitHub, and Behance. These are optional but valuable because our AI can analyze these profiles to build a more complete picture of the candidate.
>
> Let me fill this out quickly..."

**[ACTION: Fill out the form with test data]**
**[ACTION: Enter name, email, phone, select age range, enter major, years of experience]**
**[ACTION: Click Continue/Next]**

---

### Scene 2.3: Screening Questions (4:00 - 4:30)

**[SHOW: Screening questions page]**

---

**SAY:**

> "Next, we have screening questions. These are yes-or-no questions that the hiring manager configured when creating the job.
>
> Some of these are what we call 'knockout questions' - if a candidate answers incorrectly, they may be automatically flagged or rejected.
>
> For example, 'Do you have the legal right to work in Saudi Arabia?' - if someone answers 'No', that's a deal-breaker for most positions.
>
> This saves recruiters from reviewing candidates who don't meet basic requirements."

**[ACTION: Answer the screening questions]**
**[ACTION: Click Continue/Next]**

---

### Scene 2.4: Text Questions (4:30 - 5:00)

**[SHOW: Text question page]**

---

**SAY:**

> "Now we get to the assessment portion. This is a text-based question where candidates type their response.
>
> You can see the question here: [read the question]
>
> As they type, we track the word count in real-time. We also record how long they spend on each question - this data is available to reviewers later.
>
> The time spent can indicate how thoughtfully someone approached the question."

**[ACTION: Type a brief answer]**
**[ACTION: Click Continue/Next]**

---

### Scene 2.5: Voice Recording (5:00 - 6:30)

**[SHOW: Voice recording page]**

---

**SAY:**

> "This is one of our most powerful features - voice recording questions.
>
> The candidate sees the question here: [read the question]
>
> They have a time limit - in this case, [X] minutes - shown by this countdown timer.
>
> We offer several advanced options that the hiring manager can configure:
>
> **Blind mode** - where the question is hidden until they start recording. This tests their ability to think on their feet.
>
> **Different time limits** - from 30 seconds up to 5 minutes depending on the complexity of the question.
>
> When they click 'Start Recording', the browser requests microphone access, and they can begin speaking.
>
> They can pause and resume if needed, and they can play back their recording before submitting.
>
> If the timer runs out, the recording is automatically submitted - this prevents candidates from taking unlimited time.
>
> After recording, our AI transcribes the audio and analyzes:
> - What they said (the content)
> - How they said it (fluency, confidence, filler words)
> - The sentiment of their response
>
> This gives recruiters insights that text alone cannot provide."

**[ACTION: If comfortable, do a quick recording demo, or skip to file upload]**
**[ACTION: Click Continue/Next]**

---

### Scene 2.6: File Upload & Submission (6:30 - 7:00)

**[SHOW: File upload page]**

---

**SAY:**

> "The final step is file upload - typically the CV or resume.
>
> Candidates can drag and drop their file or click to browse. We accept PDF, DOC, and DOCX formats.
>
> Once uploaded, they see a confirmation and can submit their application.
>
> When they click Submit, several things happen in the background:
>
> 1. The application is saved to our database
> 2. Files are securely stored in our cloud storage
> 3. **Most importantly** - our AI evaluation pipeline kicks off automatically
>
> The candidate sees a thank you page, and within minutes, their application has been fully scored and analyzed."

**[ACTION: Upload a test CV if available, or explain the process]**
**[ACTION: Show the thank you page if possible]**

---

## PART 3: DASHBOARD OVERVIEW (7:00 - 12:00)

### Scene 3.1: Login & Main Dashboard (7:00 - 8:30)

**[ACTION: Switch to dashboard login page]**
**[ACTION: Login with admin credentials]**

---

**SAY:**

> "Now let's switch to the recruiter's perspective. I'll log in as an Admin user.
>
> [Enter credentials and login]
>
> This is the main dashboard - the command center for the hiring team."

**[SHOW: Main dashboard after login]**

---

**SAY:**

> "At the top, we have key metrics:
>
> - **Total Applicants** - [X] candidates in the system
> - **Active Jobs** - [X] positions currently accepting applications
> - **Hired This Month** - tracking our success rate
> - **Upcoming Interviews** - scheduled interviews for the team
>
> Below that, we have the **Hiring Funnel** - a visual representation of where candidates are in the pipeline. You can see at a glance how many are in each stage.
>
> On the right, there's an **Application Trends** chart showing the last 30 days of applications. This helps identify if a job posting is getting traction or needs more promotion.
>
> And here's the **Recent Activity** feed - showing the latest applicants with their AI scores. Green badges indicate high scores, yellow is medium, and red is low.
>
> Finally, the **Action Center** shows items needing attention - pending reviews, scheduled interviews, and so on."

---

### Scene 3.2: Jobs Management (8:30 - 9:30)

**[ACTION: Click on "Jobs" in the sidebar]**
**[SHOW: Jobs list page]**

---

**SAY:**

> "Let's look at Jobs management. This is where we create and manage all job postings.
>
> You can see all jobs listed here with their status - Draft, Active, Closed, or Archived.
>
> Each job card shows:
> - The job title
> - Number of applicants
> - Status badge
> - Created date
>
> We can filter by status using these tabs, and search for specific jobs.
>
> Jobs go through a lifecycle:
> - They start as **Draft** while being configured
> - When ready, they're **Published** and become Active
> - When hiring is complete, they're **Closed**
> - Old jobs can be **Archived** for record-keeping
>
> Let me click on a job to show you the details..."

**[ACTION: Click on an active job to view details, or open the wizard]**

---

### Scene 3.3: Applicant Kanban Board (9:30 - 11:00)

**[ACTION: Click on "Applicants" in the sidebar]**
**[SHOW: Applicants page with Kanban board view]**

---

**SAY:**

> "This is the Applicants page - and this Kanban board is where recruiters spend most of their time.
>
> Candidates are organized into columns by status:
>
> - **New** - just submitted, AI has scored them but they haven't been reviewed
> - **Evaluated** - a team member has reviewed their application
> - **Interview** - they've been scheduled for an interview
> - **Hired** - they got the job!
> - **Rejected** - they didn't make it this time
>
> Each card shows the candidate's name, email, and most importantly - their **AI Score** as a badge.
>
> Look at this candidate - they have a score of [X]. And this one has [Y]. At a glance, recruiters know who to prioritize.
>
> The beauty of this board is **drag and drop**. When a recruiter decides to move a candidate forward, they simply drag the card to the next column."

**[ACTION: Demonstrate drag and drop - move a candidate from one column to another]**

---

**SAY:**

> "We also have filtering options here. Recruiters can filter by:
> - Score range - show only candidates above 70, for example
> - Date applied
> - Specific job
>
> This is especially useful when you have hundreds of applicants."

---

### Scene 3.4: Applicant Detail View (11:00 - 12:00)

**[ACTION: Click on a candidate card to open the detail dialog]**
**[SHOW: Applicant detail dialog - Overview tab]**

---

**SAY:**

> "Let's click on a candidate to see their full profile.
>
> This dialog has multiple tabs - let me walk through them quickly.
>
> **Overview** shows their personal information, contact details, and a preview of their CV if they uploaded one.
>
> We can see their current status, when they applied, and any tags assigned to them."

---

## PART 4: AI EVALUATION DEEP DIVE (12:00 - 18:00)

### Scene 4.1: AI Evaluation Tab (12:00 - 14:00)

**[ACTION: Click on the "AI Evaluation" tab in the applicant dialog]**
**[SHOW: AI Evaluation tab with scores and analysis]**

---

**SAY:**

> "Now for the most important part - the AI Evaluation tab. This is where our AI's analysis is displayed.
>
> At the top, you see the **Overall Score** - [X] out of 100. This is a weighted score based on multiple criteria.
>
> Below that is the **Recommendation** - our AI suggests whether to Hire, Hold for further review, or Reject this candidate.
>
> Let me break down how the scoring works..."

**[SHOW: Scroll to criteria matches section]**

---

**SAY:**

> "Here's the **Criteria Matching** section. For each criterion we evaluate:
>
> - **Skills Match** - how well do their skills align with the job requirements? This candidate scored [X]% on skills.
>
> - **Experience** - do they have enough years of experience? The job required [X] years, they have [Y].
>
> - **Language Proficiency** - if the job requires specific languages, how do they match up?
>
> - **Screening Questions** - did they pass the knockout questions?
>
> - **Response Quality** - how well did they answer the assessment questions?
>
> Each criterion has a weight - skills might be 25% of the total, experience 20%, and so on. These weights are configurable per job."

**[SHOW: Scroll to Strengths/Weaknesses section]**

---

**SAY:**

> "The AI also generates **Strengths** and **Weaknesses** - in both English and Arabic.
>
> Strengths for this candidate include:
> - [Read 2-3 strengths from the screen]
>
> And some weaknesses or areas of concern:
> - [Read 1-2 weaknesses]
>
> This narrative helps recruiters understand *why* the AI gave this score, not just the number."

---

### Scene 4.2: Voice Analysis Tab (14:00 - 15:30)

**[ACTION: Click on the "Voice Analysis" tab]**
**[SHOW: Voice analysis with transcripts and metrics]**

---

**SAY:**

> "If the candidate answered voice questions, we have detailed analysis here.
>
> First, you can **play back the audio** - recruiters can listen to exactly what the candidate said.
>
> Below that, we show two transcripts:
> - The **Raw Transcript** - exactly what they said, including 'um', 'uh', pauses
> - The **Cleaned Transcript** - grammatically corrected, fillers removed
>
> Then we have **Fluency Metrics**:
> - **Words per minute** - speaking pace
> - **Filler word count** - how many 'ums' and 'uhs'
> - **Confidence score** - based on speech patterns
>
> And **Sentiment Analysis** - was their tone positive, neutral, or negative?
>
> This is incredibly valuable for roles where communication skills matter - sales, customer service, management positions."

---

### Scene 4.3: Text Responses & Screening (15:30 - 16:30)

**[ACTION: Click on "Text Responses" tab]**
**[SHOW: Text responses with analysis]**

---

**SAY:**

> "The Text Responses tab shows all their written answers.
>
> For each question, we display:
> - The question that was asked
> - Their complete answer
> - Word count
> - A quality assessment from our AI
>
> The AI evaluates relevance - did they actually answer the question? And quality - was the answer well-structured and insightful?"

**[ACTION: Click on "Screening" tab]**

---

**SAY:**

> "The Screening tab shows how they answered the yes/no questions.
>
> You can see which questions they passed and which they failed.
>
> If any were knockout questions and they answered incorrectly, it's highlighted here. That might explain a low AI score or automatic rejection recommendation."

---

### Scene 4.4: External Profiles (16:30 - 17:00)

**[ACTION: Click on "External Profiles" tab if candidate provided LinkedIn/GitHub]**
**[SHOW: External profiles analysis]**

---

**SAY:**

> "If the candidate provided links to their LinkedIn, GitHub, or portfolio, our AI analyzes those too.
>
> For LinkedIn, we extract:
> - Their headline and summary
> - Listed skills
> - Work experience highlights
>
> For GitHub, we look at:
> - Number of repositories
> - Star count
> - Top projects and technologies used
>
> This gives a more complete picture than just their CV alone."

---

### Scene 4.5: Team Notes & Manual Review (17:00 - 18:00)

**[ACTION: Click on "Team Notes" tab]**
**[SHOW: Team notes/comments section]**

---

**SAY:**

> "The Team Notes tab is for internal collaboration.
>
> Team members can leave comments about the candidate. You can @mention colleagues to bring something to their attention.
>
> All notes are time-stamped with who wrote them."

**[ACTION: Click on "Manual Review" tab]**

---

**SAY:**

> "Finally, the Manual Review tab is where team members record their human evaluation.
>
> They can:
> - Give a rating from 1 to 5 stars
> - Select a decision: Strong Hire, Recommended, Neutral, Not Recommended, or Strong No
> - Write pros and cons
> - Add private notes that only admins can see
>
> This human review complements the AI evaluation - we believe in AI-assisted, not AI-only, decision making."

---

## PART 5: JOB WIZARD DEMONSTRATION (18:00 - 22:00)

### Scene 5.1: Opening the Wizard (18:00 - 18:30)

**[ACTION: Navigate back to Jobs page]**
**[ACTION: Click "Create Job" or "+" button to open wizard]**
**[SHOW: Job wizard dialog - Step 1]**

---

**SAY:**

> "Now let me show you how easy it is to create a new job posting with our wizard.
>
> The wizard has 5 steps, and I'll walk through each one.
>
> This is Step 1: Job Basics."

---

### Scene 5.2: Step 1 - Job Basics (18:30 - 19:15)

**[SHOW: Step 1 of wizard - basics form]**

---

**SAY:**

> "First, we enter the basic information:
>
> - **Job Title** - let's say 'Senior Software Engineer'
> - **Job Description** - here's where it gets interesting..."

**[ACTION: Type job title]**

---

**SAY:**

> "We have an AI assistant that can help generate the job description.
>
> I can provide some bullet points of what we're looking for, and the AI will write a professional job description in seconds.
>
> Or I can write it manually.
>
> We also select:
> - **Department**
> - **Location**
> - **Employment Type** - full-time, part-time, contract, etc.
> - **Salary Range** - with currency selection
>
> Let me fill this out and move to Step 2."

**[ACTION: Fill out the form quickly]**
**[ACTION: Click Next to go to Step 2]**

---

### Scene 5.3: Step 2 - Evaluation Criteria (19:15 - 20:15)

**[SHOW: Step 2 - Criteria with skills, screening questions, languages]**

---

**SAY:**

> "Step 2 is where we define how candidates will be evaluated.
>
> **Skills** - I can manually add skills, or click this button to have AI extract skills from the job description.
>
> [Click AI extract if available]
>
> See how it automatically identified relevant skills? I can mark each as 'Required' or 'Preferred', and 'Technical' or 'Soft'.
>
> **Screening Questions** - these are the yes/no questions we saw earlier. I can add questions like 'Do you have 5+ years of experience?' and mark it as a knockout question.
>
> **Language Requirements** - if the job requires Arabic fluency or English proficiency, I add those here with the required level.
>
> **Minimum Experience** - set the years of experience required.
>
> All of these criteria will be used by our AI to score candidates."

**[ACTION: Add a skill or two, add a screening question]**
**[ACTION: Click Next]**

---

### Scene 5.4: Step 3 - Candidate Data (20:15 - 20:45)

**[SHOW: Step 3 - Candidate data requirements]**

---

**SAY:**

> "Step 3 configures what data we collect from candidates.
>
> We can toggle:
> - **Require CV** - must they upload a resume?
> - **Require LinkedIn** - must they provide their LinkedIn URL?
> - **Require Portfolio** - for design or creative roles
>
> There are also privacy settings:
> - **Hide salary from reviewers** - so only admins see salary expectations
> - **Hide personal info from reviewers** - for blind hiring processes
>
> This gives flexibility for different hiring approaches."

**[ACTION: Click Next]**

---

### Scene 5.5: Step 4 - Exam Builder (20:45 - 21:30)

**[SHOW: Step 4 - Question builder]**

---

**SAY:**

> "Step 4 is the Exam Builder - this is where we create the assessment questions.
>
> I can add **Text Questions** - where candidates type their answers.
>
> Or **Voice Questions** - where they record audio responses.
>
> For each question, I set:
> - The question text
> - The weight (importance) from 1 to 10
> - For voice: the time limit and whether to use blind mode
>
> Let me add a voice question..."

**[ACTION: Add a voice question with time limit]**

---

**SAY:**

> "I've added a question with a 2-minute time limit.
>
> We can also configure the **Retake Policy** - can candidates re-record their answers? How many attempts?
>
> And there's a field for **Candidate Instructions** - any special directions or tips."

**[ACTION: Click Next]**

---

### Scene 5.6: Step 5 - Review & Publish (21:30 - 22:00)

**[SHOW: Step 5 - Review page]**

---

**SAY:**

> "Finally, Step 5 shows a complete summary of everything we configured.
>
> We can review:
> - Job details
> - Skills and criteria
> - Questions
> - Settings
>
> If everything looks good, we can either **Save as Draft** to continue later, or **Publish** to make it live immediately.
>
> Once published, the job appears on our careers page and candidates can start applying.
>
> The entire job creation process takes just a few minutes."

---

## PART 6: TECHNICAL ARCHITECTURE (22:00 - 26:00)

### Scene 6.1: Architecture Overview (22:00 - 23:30)

**[ACTION: Switch to VS Code or show an architecture diagram]**
**[SHOW: Either code structure or a pre-made diagram]**

---

**SAY:**

> "Let me give you a quick overview of the technical architecture.
>
> GoIELTS is built on a modern tech stack:
>
> **Frontend:**
> - Next.js 16 with the App Router - the latest from Vercel
> - React 19 with TypeScript for type safety
> - Tailwind CSS for styling
> - shadcn/ui for consistent, accessible components
>
> **Backend:**
> - Hono framework for our API - it's fast and lightweight
> - MongoDB for our database - flexible schema for complex hiring data
> - DigitalOcean Spaces for file storage - CVs, voice recordings
>
> **AI Layer:**
> - Google Gemini 2.0 Flash for all AI processing
> - OpenAI as a fallback if Gemini is unavailable
>
> The architecture follows a clean separation of concerns."

**[SHOW: Project structure in VS Code if available]**

---

**SAY:**

> "In the codebase:
>
> - The `app` folder contains all our pages and routes
> - The `models` folder has our database schemas and API routes
> - The `services` folder contains business logic, including our entire AI evaluation pipeline
> - The `lib` folder has utilities - database connection, file storage, authentication
>
> Every database operation goes through Mongoose, and every API route is protected by our authentication middleware."

---

### Scene 6.2: AI Pipeline Explanation (23:30 - 25:00)

**[SHOW: VS Code with services/evaluation folder open, or diagram]**

---

**SAY:**

> "The AI evaluation pipeline is the heart of our system. Let me explain how it works.
>
> When a candidate submits their application, an evaluation job is triggered.
>
> **Step 1: Resume Parsing**
> We send the CV to Gemini's vision API. It extracts structured data - skills, work experience, education, languages.
>
> **Step 2: Voice Transcription**
> For each voice recording, we transcribe the audio to text. We generate both a raw transcript and a cleaned version.
>
> **Step 3: Profile Extraction**
> If they provided LinkedIn or GitHub, we fetch and analyze that data.
>
> **Step 4: Scoring**
> All this data goes into our Scoring Engine. It compares the candidate against the job requirements and generates:
> - An overall score from 0 to 100
> - Individual scores for each criterion
> - Strengths and weaknesses
> - A recommendation
>
> **Step 5: Storage**
> The evaluation is saved to our database and linked to the applicant record.
>
> This entire process happens automatically within minutes of submission."

---

### Scene 6.3: Security Overview (25:00 - 26:00)

**[SHOW: Can stay on VS Code or switch back to app]**

---

**SAY:**

> "Security is built into every layer.
>
> **Authentication:**
> - JWT-based sessions stored in HTTP-only cookies
> - Passwords hashed with bcrypt
> - Sessions expire after 7 days
>
> **Authorization:**
> We have three roles:
> - **Reviewer** - can view applicants and submit reviews, but limited access
> - **Admin** - full job and applicant management
> - **SuperAdmin** - system settings, user management, audit logs
>
> Each API route checks the user's role before allowing access.
>
> **Data Protection:**
> - Reviewers cannot see sensitive data like red flags or salary expectations
> - All file uploads are private by default
> - Full audit logging of every action in the system
>
> **Anti-Cheat:**
> For candidates, we track session IDs, detect tab switches, and flag suspicious activity."

---

## PART 7: ADDITIONAL FEATURES (26:00 - 28:00)

### Scene 7.1: Calendar & Interviews (26:00 - 26:45)

**[ACTION: Navigate to Calendar page]**
**[SHOW: Calendar with interview events]**

---

**SAY:**

> "The Calendar view shows all scheduled interviews.
>
> Recruiters can see their upcoming interviews at a glance, click on any event to see details or reschedule.
>
> Interview statuses are tracked:
> - Scheduled
> - Confirmed
> - Completed
> - Cancelled
> - No Show
>
> This keeps the team organized and ensures no candidate falls through the cracks."

---

### Scene 7.2: User Management (26:45 - 27:15)

**[ACTION: Navigate to Users page (if SuperAdmin)]**
**[SHOW: Users list]**

---

**SAY:**

> "For SuperAdmins, there's a User Management section.
>
> We can:
> - Create new team members
> - Assign roles
> - Activate or deactivate accounts
> - Even bulk import users from a CSV file
>
> This makes it easy to onboard new HR team members."

---

### Scene 7.3: Audit Logs (27:15 - 27:45)

**[ACTION: Navigate to Audit Logs page]**
**[SHOW: Audit logs list]**

---

**SAY:**

> "The Audit Logs page provides a complete trail of everything that happens in the system.
>
> Every action is logged:
> - Who did it
> - What they did
> - When
> - The before and after state
>
> This is essential for compliance, debugging, and security monitoring.
>
> Logs are automatically deleted after 90 days to manage storage."

---

### Scene 7.4: Internationalization (27:45 - 28:00)

**[ACTION: Toggle language to Arabic in the UI]**
**[SHOW: Dashboard in Arabic (RTL)]**

---

**SAY:**

> "Finally, the entire application supports both Arabic and English.
>
> Watch as I switch to Arabic...
>
> [Toggle language]
>
> The entire interface flips to right-to-left. Every label, every message is translated.
>
> Even the AI-generated content - strengths, weaknesses, summaries - is provided in both languages.
>
> This is essential for our market."

---

## PART 8: FUTURE ROADMAP & CLOSING (28:00 - 30:00)

### Scene 8.1: Future Enhancements (28:00 - 29:00)

**[SHOW: Can show the app or switch back to slides/desktop]**

---

**SAY:**

> "Looking ahead, we have an exciting roadmap planned.
>
> **Near-term priorities:**
> - Video question support - adding video recording alongside audio
> - Two-factor authentication - enhanced security
> - Google and Outlook calendar integration - sync interviews automatically
> - Advanced analytics dashboard - time-to-hire metrics, funnel conversion rates
>
> **Medium-term goals:**
> - Mobile application for on-the-go recruitment
> - Integration with popular ATS platforms
> - Custom AI scoring weights - let admins tune the algorithm
> - Candidate self-service portal
>
> We're committed to continuous improvement based on user feedback."

---

### Scene 8.2: Closing (29:00 - 30:00)

**[SHOW: Return to dashboard or title slide]**

---

**SAY:**

> "To summarize what we've covered today:
>
> GoIELTS is a complete AI-powered recruitment platform that:
>
> 1. **Streamlines applications** with a smooth, mobile-friendly candidate experience
>
> 2. **Automates evaluation** using AI that scores candidates in minutes, not hours
>
> 3. **Empowers recruiters** with a Kanban board, detailed analytics, and collaboration tools
>
> 4. **Ensures consistency** with standardized criteria and unbiased initial screening
>
> 5. **Supports bilingual teams** with full Arabic and English interfaces
>
> The combination of AI efficiency and human judgment creates a powerful hiring process.
>
> Thank you for watching this demonstration. If you have any questions, I'm happy to dive deeper into any aspect of the system.
>
> Shukran, and I look forward to your feedback."

---

# POST-RECORDING CHECKLIST

- [ ] Review the recording for any errors or sensitive data shown
- [ ] Check audio levels are consistent throughout
- [ ] Trim any long pauses or mistakes
- [ ] Add chapter markers if your platform supports it:
  - 0:00 Introduction
  - 2:00 Candidate Application
  - 7:00 Dashboard Overview
  - 12:00 AI Evaluation
  - 18:00 Job Wizard
  - 22:00 Technical Architecture
  - 26:00 Additional Features
  - 28:00 Roadmap & Closing
- [ ] Export in high quality (1080p recommended)
- [ ] Upload to your sharing platform

---

# QUICK REFERENCE: KEY TALKING POINTS

## If Asked About AI Accuracy
> "Our AI uses Google Gemini 2.0, one of the most advanced language models available. It's been tuned for recruitment evaluation specifically. However, we always recommend human review - AI assists the decision, it doesn't make it."

## If Asked About Data Privacy
> "All data is encrypted in transit and at rest. We comply with GDPR principles - candidates can request their data or deletion. Audit logs track all access. Different roles have different data visibility to minimize exposure."

## If Asked About Scalability
> "The architecture is designed for scale. MongoDB handles millions of documents. File storage is on DigitalOcean Spaces with global CDN. The Hono API is lightweight and fast. We can handle thousands of concurrent applications."

## If Asked About Customization
> "Jobs are fully customizable - different questions, criteria, scoring weights. The wizard makes it easy. System settings allow admins to configure AI parameters, email templates, and feature flags without touching code."

## If Asked About Cost
> "Our main costs are AI API calls (per evaluation) and storage (for files and recordings). The architecture is efficient - we cache where possible and use the fastest Gemini model for most operations."

---

*Script Version: 1.0*
*Estimated Recording Time: 30 minutes*
*Last Updated: January 2026*
