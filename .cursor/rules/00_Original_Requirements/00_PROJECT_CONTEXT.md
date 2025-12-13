# Project Context: SmartRecruit AI (SaaS)

## Project Goal
To build a recruitment platform where candidates answer questions via **timed voice recording** (no retakes allowed). The system uses AI to analyze the audio, parsing the text, and matching it against job criteria defined by the Admin.

## Key Constraints
1.  **Non-Technical Founder:** The code must be clean, standard, and easy to deploy.
2.  **Language:** UI must support Arabic (RTL).
3.  **Strict Logic:** The exam timer and "no-retake" policy are critical.
4.  **Security:** Specific roles (Reviewers) must NOT see "Salary Expectations".

## Documentation Structure (Reference)
I will provide the following files sequentially to build the app. Please do not hallucinate features outside of these documents:

1.  **CORE_PRD.md:** The MVP features (Dashboard, Forms, Candidate Flow).
2.  **TECH_STACK.md:** The specific technologies to use (React, Supabase, Tailwind).
3.  **UNIFIED_SRS_FRD.md:** The strict logic for the Voice Exam and Resume Parsing.
4.  **DATA_ROLES.md:** Database schema and Security roles (Admin vs. Reviewer).
5.  **AI_LOGIC.md:** Instructions for OpenAI/Whisper integration (Step 4).

## Current Phase
[We are currently in Phase 1: Setup & UI Skeleton]