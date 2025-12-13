# Unified SRS & FRD: Smart Recruitment SaaS
**Version:** 1.0
**Owner:** [Your Name]
**System Purpose:** A blind-hiring platform using voice assessments and AI analysis.

---

## 1. Functional Requirements (FRD)

### Module 1: The Applicant Exam (The "Trap" Logic)
**Logic:** To prevent cheating and ensure spontaneity.
1.  **Workflow:**
    * User clicks "Start Assessment".
    * System checks browser permissions (Microphone access) -> *Critical Requirement.*
    * **Text Section:** Standard inputs (Name, Phone, numeric Age).
    * **Voice Section (The Core):**
        * Screen shows: "Ready for Question X? (Time limit: 3 mins)".
        * User clicks "Show Question".
        * **IMMEDIATE ACTION:** Recording starts automatically (or within 3 seconds).
        * **CONSTRAINT:** User cannot pause, cannot stop, cannot re-record.
        * If timer ends -> Auto-submit audio and move to next.
        * If user closes tab -> Session marked as "Incomplete/Suspicious".

### Module 2: The Resume Parser & Scraper
**Logic:** Aggregating scattered data.
1.  **Inputs:** PDF Upload, LinkedIn URL input, Behance/Portfolio URL input.
2.  **Processing:**
    * Extract text from PDF.
    * (Optional API) Fetch public data from provided URLs.
3.  **Output:** A structured JSON profile merging all sources (e.g., Skills from PDF + Projects from Behance).

### Module 3: Admin Dashboard & Filtering
**Logic:** Advanced filtering logic.
1.  **Filter Logic:**
    * Must allow "AND" logic (e.g., Age < 30 AND Experience > 5 years).
    * Must allow filtering by "AI Score" range (e.g., Top 10%).
2.  **Blind Review Mode:**
    * If current user role is `Reviewer`: Hide field `Salary_Expectation`.
    * If current user role is `Admin`: Show all fields.

### Module 4: The Interview Intelligence
**Logic:** Post-Interview analysis.
1.  **Upload:** Admin uploads video file (MP4/MOV).
2.  **Processing:**
    * Transcribe audio to text.
    * Analyze Sentiment (Positive/Negative/Neutral).
    * Detect Keywords (e.g., matching job description keywords).
3.  **Result:** Append report to Candidate Profile.

---

## 2. Non-Functional Requirements (SRS)

### A. Performance & Reliability
* **Audio Upload:** Must handle slow internet connections (use chunked upload or background retry).
* **Latency:** Transcription results should be available within 5 minutes of submission.

### B. Security & Data Integrity
* **Access Control:** Strict separation between `Admin` and `Reviewer` roles (Row Level Security).
* **Storage:** CVs and Audio files must be stored in private buckets (not public URLs), accessible only via signed URLs.

### C. Language Support
* **Interface:** Arabic (RTL) is the primary interface direction.
* **AI Processing:** Must support Arabic dialects in Speech-to-Text (STT).