# Data Structure & User Roles

## 1. User Roles (RBAC)
1. **Super Admin:** Full Access.
2. **Admin (Recruiter):** Full Access to jobs and candidates.
3. **Reviewer (Blind Access):**
   - Can see: CV, Experience, Audio, Scores.
   - **CANNOT SEE:** Salary Expectations field.
   - Purpose: Unbiased technical evaluation.

## 2. Data Schemas (Simplified)
- **Job:** `id`, `title`, `criteria_json`, `status`.
- **Question:** `id`, `job_id`, `type` (text/voice), `time_limit`.
- **Applicant:** `id`, `personal_data`, `cv_url`, `linkedin_url`.
- **Response:** `id`, `applicant_id`, `question_id`, `audio_url`, `raw_text`, `clean_text`.
- **Evaluation:** `id`, `applicant_id`, `ai_score`, `ai_summary`, `recruiter_notes`.

## 3. Security & Compliance
- Data stored securely (Supabase/Firebase recommended).
- PDF Parsing must happen server-side or via secure API.