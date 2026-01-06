# Testing Guide: MongoDB Map Casting Fix

## Quick Test Steps

### 1. **Prerequisites**
- Make sure you have at least one **active job** with **screening questions** configured
- The job should have at least one screening question (preferably with a disqualifying question for thorough testing)

### 2. **Test the Application Submission**

#### Step 1: Start the Development Server
```bash
bun dev
```

#### Step 2: Navigate to a Job Application Page
- Go to: `http://localhost:3000/apply/[jobId]`
- Replace `[jobId]` with an actual job ID from your database

#### Step 3: Fill Out the Application Form
1. **Personal Information Step:**
   - Fill in: Name, Email, Phone
   - Fill in other optional fields (age, major, experience, etc.)
   - **IMPORTANT:** Answer the screening questions (Yes/No)
   - If there are language requirements, select proficiency levels
   - Click "Next" or "Continue"

2. **Complete Remaining Steps:**
   - Answer text questions (if any)
   - Record voice responses (if any)
   - Upload CV (if required)
   - Complete all steps

#### Step 4: Submit the Application
- Click "Submit Application"
- **Watch for:**
  - ✅ **Success:** Should see "Thank You" page immediately
  - ❌ **Error:** If you see the Map casting error, the fix didn't work

---

## What to Check

### ✅ **Success Indicators:**

1. **Browser Console (F12 → Console tab)**
   - Should see: `[Submission] Application saved successfully`
   - Should NOT see: `Cast to Map failed` error
   - Should NOT see: `Applicant validation failed` error

2. **Network Tab (F12 → Network tab)**
   - Find the `POST /api/applicants` request
   - Status should be `200 OK` or `201 Created`
   - Response should contain:
     ```json
     {
       "success": true,
       "applicantId": "...",
       "message": "..."
     }
     ```

3. **Thank You Page**
   - Should appear immediately (or within 1-2 seconds)
   - Should show confirmation message
   - Should NOT show any error messages

### ❌ **If You See Errors:**

**Error Message:**
```
Applicant validation failed:
personalData.screeningAnswers: Cast to Map failed for value "Map(1) { ... }"
```

**This means:**
- The fix didn't work
- Check that you saved the file `actions.ts`
- Restart the dev server: `bun dev`
- Check browser cache (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

---

## Database Verification

### Check MongoDB Directly

1. **Connect to MongoDB** (using MongoDB Compass, Studio 3T, or CLI)

2. **Find the Applicant Record:**
   ```javascript
   db.applicants.findOne({ "personalData.email": "test@example.com" })
   ```

3. **Check screeningAnswers Field:**
   ```javascript
   // Should see something like:
   {
     "personalData": {
       "screeningAnswers": {
         "Question 1 text here": true,
         "Question 2 text here": false
       }
     }
   }
   ```

   **✅ Correct:** Plain object `{ "question": true }`
   **❌ Wrong:** Would show as `Map` type or cause errors

4. **Check languageProficiency Field:**
   ```javascript
   // Should see:
   {
     "personalData": {
       "languageProficiency": {
         "Arabic": "native",
         "English": "advanced"
       }
     }
   }
   ```

---

## Test Cases

### Test Case 1: Application with Screening Questions Only
**Steps:**
1. Create a job with 2-3 screening questions
2. Submit application answering all questions
3. **Expected:** Application saves successfully, no errors

### Test Case 2: Application with Language Requirements
**Steps:**
1. Create a job with language requirements (e.g., Arabic: native, English: advanced)
2. Submit application selecting language proficiencies
3. **Expected:** Application saves successfully, languages saved correctly

### Test Case 3: Application with Both Screening Questions AND Languages
**Steps:**
1. Create a job with both screening questions and language requirements
2. Submit application filling both sections
3. **Expected:** Both `screeningAnswers` and `languageProficiency` save correctly

### Test Case 4: Application with Disqualifying Question (Knockout)
**Steps:**
1. Create a job with a disqualifying screening question
2. Answer "No" to the disqualifying question
3. **Expected:** 
   - Frontend should prevent submission (shows error toast)
   - If somehow submitted, should still save (but evaluation might reject)

### Test Case 5: Application WITHOUT Screening Questions
**Steps:**
1. Create a job with NO screening questions
2. Submit application
3. **Expected:** Application saves successfully, `screeningAnswers` should be `undefined` or empty

---

## Quick Verification Script

Run this in your browser console after submission:

```javascript
// Check if submission was successful
fetch('/api/applicants', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  const latest = data.data?.[0];
  if (latest?.personalData?.screeningAnswers) {
    console.log('✅ screeningAnswers saved:', latest.personalData.screeningAnswers);
    console.log('Type:', typeof latest.personalData.screeningAnswers);
    console.log('Is Map?', latest.personalData.screeningAnswers instanceof Map);
  } else {
    console.log('ℹ️ No screeningAnswers (might be normal if job has no questions)');
  }
});
```

---

## Troubleshooting

### Issue: Still seeing the error after fix

**Solutions:**
1. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   bun dev
   ```

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache in browser settings

3. **Check file was saved:**
   ```bash
   # Verify the fix is in the file
   grep -A 5 "Prepare personalData" src/app/(public)/apply/[jobId]/_components/actions.ts
   ```
   Should show the new code without `new Map(...)`

4. **Check for TypeScript errors:**
   ```bash
   bun run build
   ```
   Should compile without errors

### Issue: Application saves but screeningAnswers is empty

**Possible causes:**
- Job doesn't have screening questions configured
- Form didn't capture the answers
- Check browser console for form validation errors

**Check:**
```javascript
// In browser console during form submission
console.log('Form data:', formData);
// Should show screeningAnswers object
```

---

## Expected Behavior Summary

| Scenario | Expected Result |
|----------|----------------|
| Submit with screening questions | ✅ Saves successfully, no Map error |
| Submit with language requirements | ✅ Saves successfully, no Map error |
| Submit with both | ✅ Both save correctly |
| Submit without screening questions | ✅ Saves successfully (field is optional) |
| Submit with disqualifying "No" answer | ⚠️ Frontend prevents submission (by design) |

---

## Success Criteria

✅ **Fix is working if:**
1. No "Cast to Map failed" errors in console
2. Application submits successfully
3. Thank you page appears
4. Database shows correct `screeningAnswers` structure
5. Can view applicant in dashboard with screening answers visible

---

## Next Steps After Testing

If test passes:
- ✅ Fix is confirmed working
- Consider testing with multiple concurrent submissions
- Monitor production logs for any edge cases

If test fails:
- Check error message details
- Verify file changes were saved
- Check MongoDB connection
- Review server logs for more details

---

*Last Updated: January 2026*

