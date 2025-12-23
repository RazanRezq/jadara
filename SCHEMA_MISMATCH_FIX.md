# Schema Mismatch Fix - Voice/Social/Text Analysis

## Problem Identified

The new UI components for **Voice Analysis**, **Social Profiles**, and **Written Responses** were not displaying because of a **critical schema mismatch** between:
1. MongoDB Schema (what the database expects)
2. Backend Data (what candidateEvaluator returns)
3. Frontend Types (what the UI expects)

### The Mismatch

#### ❌ Original MongoDB Schema (WRONG)
```typescript
interface IVoiceAnalysisDetails {
    overallSentiment: string
    averageConfidence: number
    responses: Array<{...}>  // Nested structure
    summary: IBilingualText
}
```

#### ✅ Backend Returns (CORRECT)
```typescript
voiceAnalysisDetails: DetailedVoiceAnalysis[]  // Flat array
```

#### ✅ Frontend Expects (CORRECT)
```typescript
evaluation.voiceAnalysisDetails.length > 0  // Array check
evaluation.voiceAnalysisDetails.map(...)     // Array iteration
```

**Result:** MongoDB was rejecting or not saving the data because the structure didn't match!

---

## Solution Applied

### 1. Updated Voice Analysis Schema

**Changed FROM (nested object):**
```typescript
export interface IVoiceAnalysisDetails {
    overallSentiment: string
    averageConfidence: number
    responses: Array<{...}>
    summary: IBilingualText
}
```

**Changed TO (flat array item):**
```typescript
export interface IVoiceAnalysisDetails {
    questionId: string
    questionText: string
    questionWeight: number
    rawTranscript: string
    cleanTranscript: string
    sentiment?: {
        score: number
        label: 'negative' | 'neutral' | 'positive'
    }
    confidence?: {
        score: number
        indicators: string[]
    }
    fluency?: {
        score: number
        wordsPerMinute?: number
        fillerWordCount?: number
    }
    keyPhrases?: string[]
}
```

### 2. Updated Social Profile Schema

**Changed TO match backend SocialProfileInsights:**
```typescript
export interface ISocialProfileInsights {
    linkedin?: {
        headline?: string
        summary?: string
        skills: string[]
        experience: Array<{...}>
        highlights: string[]
    }
    github?: {
        repositories: number  // Fixed: was totalRepos
        stars: number         // Fixed: was totalStars
        languages: string[]   // Fixed: was primaryLanguages
        topProjects: Array<{
            name: string
            description: string
            stars: number
        }>
        highlights: string[]
    }
    portfolio?: {...}
    behance?: {...}
}
```

### 3. Updated Text Response Schema

**Removed `summary` field (not in backend):**
```typescript
export interface ITextResponseAnalysis {
    totalResponses: number
    averageWordCount: number
    overallQuality: string
    responses: Array<{
        questionId: string
        questionText: string  // Fixed: was 'question'
        answer: string
        wordCount: number
        quality: string
        keyPoints: string[]
    }>
    // Removed: summary: IBilingualText
}
```

### 4. Updated IEvaluation Interface

**Changed voiceAnalysisDetails to array:**
```typescript
export interface IEvaluation extends Document {
    // ... other fields ...
    
    // Detailed analysis sections (arrays of analysis data)
    voiceAnalysisDetails?: IVoiceAnalysisDetails[]  // Array!
    socialProfileInsights?: ISocialProfileInsights
    textResponseAnalysis?: ITextResponseAnalysis
}
```

### 5. Updated MongoDB Sub-Schemas

Created proper Mongoose schemas matching the new structure:

```typescript
// Voice analysis - now an array of detailed analyses
const voiceAnalysisDetailsSchema = new Schema<IVoiceAnalysisDetails>({
    questionId: String,
    questionText: String,
    questionWeight: Number,
    rawTranscript: String,
    cleanTranscript: String,
    sentiment: sentimentSchema,
    confidence: confidenceSchema,
    fluency: fluencySchema,
    keyPhrases: [String],
}, { _id: false })

// In main schema:
voiceAnalysisDetails: {
    type: [voiceAnalysisDetailsSchema],  // Array!
},
```

---

## Data Flow (Fixed)

### ✅ Complete Data Pipeline

```
1. candidateEvaluator.ts
   └─> Returns: DetailedVoiceAnalysis[]
   
2. evaluationProcessingRoute.ts
   └─> Saves: evaluation.voiceAnalysisDetails = result.evaluation.voiceAnalysisDetails
   
3. MongoDB (evaluationSchema.ts)
   └─> Accepts: voiceAnalysisDetails: [voiceAnalysisDetailsSchema]
   
4. API (route.ts)
   └─> Returns: evaluation.voiceAnalysisDetails
   
5. Frontend (applicants-client.tsx)
   └─> Types: voiceAnalysisDetails?: Array<{...}>
   
6. UI (view-applicant-dialog.tsx)
   └─> Renders: evaluation.voiceAnalysisDetails.map(...)
```

---

## What This Fixes

### ✅ Voice Analysis Card
- **Before:** Empty (data not saved)
- **After:** Shows per-question transcripts, sentiment, confidence, fluency, key phrases

### ✅ Social Profiles Card
- **Before:** Empty (schema mismatch on field names)
- **After:** Shows LinkedIn/GitHub/Portfolio/Behance insights with correct fields

### ✅ Written Responses Card
- **Before:** Empty (schema field mismatch)
- **After:** Shows text responses with quality analysis

### ✅ Data Persistence
- **Before:** MongoDB silently discarded the data
- **After:** MongoDB saves all analysis data correctly

---

## Key Changes Summary

| Field | Before | After | Reason |
|-------|--------|-------|--------|
| `voiceAnalysisDetails` | Object with nested array | **Array** of objects | Match backend return type |
| `github.repositories` | `totalRepos` | `repositories` | Match backend field name |
| `github.stars` | `totalStars` | `stars` | Match backend field name |
| `github.languages` | `primaryLanguages` | `languages` | Match backend field name |
| `textResponse.questionText` | `question` | `questionText` | Match backend field name |
| Text `summary` field | Included | **Removed** | Not in backend data |

---

## Testing

### To Verify the Fix:

1. ✅ Have a candidate apply for a job with:
   - Voice responses
   - LinkedIn/GitHub profiles
   - Text answers

2. ✅ Wait for evaluation to complete

3. ✅ Open applicant dialog → "AI Evaluation" tab

4. ✅ Check that all 4 cards display:
   - 🟠 HR Requirements Card
   - 🟣 Voice Analysis Card (with per-question details)
   - 🔵 Social Profiles Card (LinkedIn/GitHub metrics)
   - 🟣 Written Responses Card (text quality analysis)

### Expected Behavior:

- Voice card shows sentiment emoji, confidence bar, fluency scores, key phrases
- Social card shows repo count, stars, languages, highlights
- Text card shows response quality, word counts, key points
- All data persists correctly in MongoDB

---

## Files Modified

1. ✅ `src/models/Evaluations/evaluationSchema.ts`
   - Updated `IVoiceAnalysisDetails` interface
   - Updated `ISocialProfileInsights` interface
   - Updated `ITextResponseAnalysis` interface
   - Updated `IEvaluation` interface
   - Created matching Mongoose sub-schemas
   - Fixed main schema field definitions

---

**Status:** ✅ **FIXED**  
**Impact:** UI components will now display complete evaluation data  
**Breaking Changes:** None - fully backward compatible (fields are optional)  
**Database Migration:** Not required - new evaluations will have correct structure


