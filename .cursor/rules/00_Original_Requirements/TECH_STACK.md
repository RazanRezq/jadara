# Recommended Tech Stack for AI Builder

Since I am a non-technical founder using AI builders, please use the following modern, standard stack:

1. **Frontend:** React (Vite) or Next.js (App Router).
2. **Styling:** Tailwind CSS (for clean, beautiful, responsive UI).
3. **Database & Auth:** Supabase (PostgreSQL + Auth).
4. **AI & Logic APIs:**
   - **OpenAI (GPT-4o):** For parsing CVs, analyzing answers, and generating scores.
   - **OpenAI Whisper:** For Speech-to-Text (Arabic support).
   - **Function Calling:** To scrape external links (LinkedIn/Behance) - *Note: Might require a simple Edge Function.*
5. **UI Components:** Shadcn/ui (for professional look & feel).