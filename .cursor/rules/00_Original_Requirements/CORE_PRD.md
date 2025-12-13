# Project Name: SmartRecruit AI - Core Requirements

## 1. Project Overview
A SaaS platform for advanced recruitment that replaces traditional forms with an interactive, timed, and AI-powered assessment system. The goal is to evaluate candidates based on voice answers, specific criteria, and resume analysis without manual filtering.

## 2. Core Modules (The MVP)

### A. Admin Dashboard (Recruiter View)
1. **Create Job Post:**
   - Input: Job Title, Description, Required Skills, Responsibilities.
   - **Evaluation Criteria Builder:** Admin defines key criteria (e.g., "Must have 5 years in Marketing").
2. **Form Builder (The Exam):**
   - **Personal Info Section:** Name, Age (Number), Phone, Major, YOE.
   - **Text Questions:** Standard open/closed questions.
   - **Voice Questions:**
     - Admin sets a timer (e.g., 3 mins max).
     - User cannot see the question until they click "Start".
     - Recording starts immediately or after a brief countdown.
     - **Constraint:** No pause, no retake (unless configured otherwise), strict timer.
3. **Candidates Pipeline:**
   - Kanban board or List view.
   - Filtering: By Age, YOE, Score (Calculated by AI), Specific Tags.
   - Detail View: See full candidate profile, play audio, read transcript.

### B. Candidate Interface (The App)
1. **Landing Page:** Simple job description.
2. **Assessment Flow:**
   - Step 1: Personal Info.
   - Step 2: Text Questions.
   - Step 3: Voice Exam (Blind questions).
     - UI: "Click to reveal question and start recording".
     - Timer: Visible countdown.
     - Audio visualizer (simple waves) to show recording is active.
   - Step 4: File Upload (CV, Portfolio).
   - Step 5: Submission.

### C. Reporting & Analytics
1. **Dashboard Stats:** Total applicants, Qualified %, Average Score.
2. **Export:** Button to export data (CSV/Excel/PDF) including AI summaries.