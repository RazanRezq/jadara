# AI Job Description Generator - Setup Guide

## Overview
This feature uses Google Gemini AI to generate professional job descriptions through a 2-step interview process.

## Setup Instructions

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add API Key to Environment Variables

Create or update your `.env.local` file in the project root:

```bash
GOOGLE_API_KEY=your_api_key_here
```

⚠️ **Important**: Never commit your `.env.local` file to version control. It should be in `.gitignore`.

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
bun dev
```

## How It Works

### Step 1: Generate Scoping Questions
- The AI analyzes the job title, department, and employment type
- Generates 4 tailored scoping questions to understand the role better
- Questions are specific to the position and help extract key details

### Step 2: Generate Job Description
- User answers the 4 scoping questions
- AI processes the answers along with job details
- Creates a comprehensive, professional job description with:
  - Engaging role overview
  - Key responsibilities (bullet points)
  - Required qualifications
  - Nice-to-have skills
  - Proper markdown formatting

## Features

- **Smart Interview Flow**: AI acts as an interviewer to gather context
- **Bilingual Support**: Works in both English and Arabic
- **Real-time Generation**: Fast response times using Gemini 1.5 Flash
- **Editable Output**: Generated descriptions can be edited after applying
- **Error Handling**: Graceful fallbacks and user-friendly error messages

## Usage

1. Navigate to Jobs → Add New Job
2. Fill in Job Title, Department, and Employment Type
3. Click "Generate with AI" button next to the description field
4. Follow the 2-step interview process
5. Review and apply the generated description

## Technical Details

### Files Created

- `src/app/(dashboard)/dashboard/jobs/_components/wizard/ai-actions.ts`
  - Server Actions for Gemini AI integration
  - `generateScopingQuestions()`: Creates interview questions
  - `generateJobDescription()`: Generates final description

- `src/app/(dashboard)/dashboard/jobs/_components/wizard/ai-generation-modal.tsx`
  - Modal component with 4 steps: intro, questions, generating, success
  - Handles user interaction and state management
  - Beautiful UI with loading states and animations

- Updated `src/app/(dashboard)/dashboard/jobs/_components/wizard/step-1-basics.tsx`
  - Integrated AI generation modal
  - Button enabled only when required fields are filled

### Dependencies Added

- `@google/generative-ai`: Official Google Gemini SDK

### Translations Added

Added to both `en.json` and `ar.json`:
- `jobWizard.aiGeneration.*`: All UI strings for the AI feature
- `common.characters`: Character count label

## API Costs

Google Gemini API pricing (as of Dec 2024):
- **Gemini 1.5 Flash**: Free tier includes 15 requests per minute
- Very cost-effective for this use case
- Each job description generation = 2 API calls

## Troubleshooting

### "API key not configured" Error
- Make sure `GOOGLE_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### "Failed to parse AI response" Error
- This is rare but can happen if the AI returns unexpected format
- Simply click "Regenerate" to try again

### Button Disabled
- Ensure Job Title, Department, and Employment Type are filled
- These fields are required for AI to generate relevant questions

## Future Enhancements

Potential improvements:
- Cache commonly used questions for faster response
- Allow custom question templates
- Multi-language description generation
- A/B testing different prompts
- Save generated descriptions history

## Support

For issues or questions, contact the development team.

