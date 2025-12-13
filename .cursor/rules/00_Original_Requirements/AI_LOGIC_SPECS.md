# Advanced AI & Logic Specifications

## 1. Voice Processing (Critical)
- **Requirement:** Convert voice to text.
- **Features:**
  - Support Arabic (primary) and English (secondary).
  - **Dual Output:** 1. Raw Transcript (Verbatim).
    2. Cleaned Transcript (Removing "umm", "ahh", correcting grammar).
- **Tech Suggestion:** Use OpenAI Whisper API or AssemblyAI.

## 2. Smart Scoring Engine (The Brain)
- **Input:** - Job Description & Defined Criteria (from Admin).
  - Candidate Data: CV (PDF), LinkedIn/Behance Links, Voice Transcripts.
- **Process:**
  - **Resume Parsing:** Extract Skills, Experience, Education from PDF.
  - **Link Scraper:** Fetch text content from LinkedIn/Behance profiles (requires backend scraper).
  - **Matching Algorithm:** Compare extracted data vs. Required Criteria.
- **Output:**
  - Match Score (0-100%).
  - "Why?" Section: "Matched 90% because candidate has 5 years marketing exp as requested."
  - "Red Flags": "Candidate mentioned salary expectation X which is above budget" (Hidden from specific roles).

## 3. Interview Assistant & Video Analysis (Experimental)
- **Pre-Interview:** - System generates custom interview questions based on missing info in CV (e.g., "You didn't mention Marketing, tell us about it").
- **Post-Interview (Video):**
  - **Analysis:** Analyze verbal content + Sentiment (Confidence, Hesitation).
  - **Recommendation:** "Hire" / "Reject" / "Hold" with reasoning.
- **Constraint:** Full body language analysis is complex. Focus primarily on *Verbal Sentiment* and *Facial Expression* basics if API permits.

## 4. Recommendation System
- Suggest the "Next Best Action" for each candidate.
- Sort candidates by "Best Fit" automatically.