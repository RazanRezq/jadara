# Testing Guide: Screening Questions & Languages Feature

## Prerequisites

1. MongoDB running
2. Development server running: `bun dev`
3. At least one active job in the database

## Test Plan

### Test Case 1: Basic Display (Without Screening Questions/Languages)

**Steps:**
1. Create a job WITHOUT screening questions or languages
2. Navigate to `/apply/[jobId]`
3. Click "Start Application"
4. Fill in the personal information form

**Expected Result:**
- ✅ No screening questions section appears
- ✅ No languages section appears
- ✅ Form works normally
- ✅ Can submit successfully

---

### Test Case 2: Display with Screening Questions Only

**Setup:**
Create a job with:
- 2 screening questions
  - Q1: "Do you have a valid work permit?" (disqualify: true)
  - Q2: "Can you relocate if needed?" (disqualify: false)

**Steps:**
1. Navigate to `/apply/[jobId]`
2. Click "Start Application"
3. Scroll to screening questions section

**Expected Result:**
- ✅ Section header shows: 🛡️ "Screening Questions" / "أسئلة الفرز"
- ✅ Both questions are displayed
- ✅ Q1 shows red "Critical Question" badge
- ✅ Q2 does NOT show badge
- ✅ Radio buttons (Yes/No) are displayed
- ✅ RTL works correctly in Arabic

---

### Test Case 3: Display with Languages Only

**Setup:**
Create a job with:
- 2 required languages
  - English (advanced)
  - Arabic (native)

**Steps:**
1. Navigate to `/apply/[jobId]`
2. Click "Start Application"
3. Scroll to languages section

**Expected Result:**
- ✅ Section header shows: 🌐 "Languages" / "اللغات"
- ✅ Both languages are displayed in 2-column grid
- ✅ Each shows required level as badge
- ✅ Dropdown shows 4 options: Beginner, Intermediate, Advanced, Native
- ✅ RTL works correctly in Arabic

---

### Test Case 4: Knockout Validation (Critical Question = No)

**Setup:**
Job with screening question: "Do you have a valid work permit?" (disqualify: true)

**Steps:**
1. Fill in all required fields
2. Answer "No" to the critical question
3. Answer other questions normally
4. Click "Continue to Assessment"

**Expected Result:**
- ✅ Error toast appears with message: "Unfortunately, you do not meet the minimum requirements..."
- ✅ Form submission is BLOCKED
- ✅ User remains on the form
- ✅ No data is saved to database

**Test in Arabic:**
- ✅ Message shows: "للأسف، أنت لا تستوفي الحد الأدنى من المتطلبات لهذه الوظيفة. شكراً لاهتمامك."

---

### Test Case 5: Successful Submission with All Data

**Setup:**
Job with:
- 2 screening questions (both with disqualify: false)
- 2 languages

**Steps:**
1. Fill in all personal information
2. Answer "Yes" to all screening questions
3. Select proficiency levels for all languages
4. Fill in LinkedIn and Portfolio (if required)
5. Click "Continue to Assessment"

**Expected Result:**
- ✅ Form validation passes
- ✅ User proceeds to assessment instructions
- ✅ Check database - Applicant record should contain:
  ```json
  {
    "personalData": {
      "name": "...",
      "email": "...",
      "screeningAnswers": {
        "Question 1": true,
        "Question 2": true
      },
      "languageProficiency": {
        "English": "advanced",
        "Arabic": "native"
      }
    }
  }
  ```

---

### Test Case 6: Validation - Missing Required Fields

**Steps:**
1. Fill in basic info (name, email, phone)
2. Leave screening questions unanswered
3. Leave language proficiency empty
4. Click "Continue to Assessment"

**Expected Result:**
- ✅ Form shows validation errors
- ✅ Screening questions show error: "This question is required"
- ✅ Languages show error: "Please specify your language proficiency"
- ✅ Form submission is blocked

---

### Test Case 7: RTL (Arabic) Layout

**Steps:**
1. Switch language to Arabic using language switcher
2. Navigate to application form
3. Observe layout

**Expected Result:**
- ✅ All text is right-aligned
- ✅ Icons appear on the right side
- ✅ Radio buttons: "نعم" on the right, "لا" on the left
- ✅ Badges appear on the left side of text
- ✅ Dropdown direction is RTL
- ✅ Grid layout reverses correctly

---

### Test Case 8: Multiple Critical Questions (Stress Test)

**Setup:**
Job with:
- 3 critical questions (all with disqualify: true)

**Scenario A - Answer "No" to First:**
1. Answer "No" to question 1
2. Answer "Yes" to questions 2 & 3
3. Submit

**Expected:** ❌ Blocked with knockout message

**Scenario B - Answer "No" to Middle:**
1. Answer "Yes" to question 1
2. Answer "No" to question 2
3. Answer "Yes" to question 3
4. Submit

**Expected:** ❌ Blocked with knockout message

**Scenario C - Answer "Yes" to All:**
1. Answer "Yes" to all questions
2. Submit

**Expected:** ✅ Allowed to proceed

---

### Test Case 9: Salary Expectation Visibility

**Scenario A - Salary Hidden:**
Job config: `candidateDataConfig.hideSalaryExpectation: true`

**Expected:**
- ✅ Salary field does NOT appear
- ✅ Form can be submitted without salary

**Scenario B - Salary Visible:**
Job config: `candidateDataConfig.hideSalaryExpectation: false`

**Expected:**
- ✅ Salary field appears
- ✅ Salary is REQUIRED
- ✅ Must enter valid number to submit

---

### Test Case 10: Responsive Design

**Desktop (> 768px):**
- ✅ Languages section: 2-column grid
- ✅ Personal info fields: side-by-side
- ✅ All sections properly spaced

**Mobile (< 768px):**
- ✅ Languages section: single column
- ✅ All fields stack vertically
- ✅ Touch-friendly button sizes
- ✅ Radio buttons easy to tap

---

### Test Case 11: Accessibility

**Keyboard Navigation:**
1. Tab through all form fields
2. Expected: Logical tab order
3. Expected: Focus visible on all elements

**Screen Reader:**
1. Use screen reader (NVDA/JAWS/VoiceOver)
2. Navigate form
3. Expected: All labels read correctly
4. Expected: Validation errors announced

---

## Database Verification

After successful submission, verify in MongoDB:

```javascript
db.applicants.findOne({ email: "test@example.com" })
```

**Should contain:**
```json
{
  "_id": "...",
  "jobId": "...",
  "personalData": {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+966501234567",
    "age": 28,
    "major": "Computer Science",
    "yearsOfExperience": 5,
    "salaryExpectation": 15000,
    "screeningAnswers": {
      "Do you have a valid work permit?": true,
      "Can you work full-time on-site?": true
    },
    "languageProficiency": {
      "English": "advanced",
      "Arabic": "native"
    },
    "linkedinUrl": "https://linkedin.com/in/test",
    "portfolioUrl": "https://portfolio.test.com"
  },
  "status": "new",
  "isComplete": false,
  "createdAt": "2024-..."
}
```

---

## API Testing

### Test Job API Returns Screening Questions

```bash
curl http://localhost:3000/api/jobs/[jobId]
```

**Expected response includes:**
```json
{
  "success": true,
  "job": {
    "id": "...",
    "title": "...",
    "screeningQuestions": [
      {
        "question": "Do you have a valid work permit?",
        "disqualify": true
      },
      {
        "question": "Can you work full-time on-site?",
        "disqualify": false
      }
    ],
    "languages": [
      {
        "language": "English",
        "level": "advanced"
      },
      {
        "language": "Arabic",
        "level": "native"
      }
    ]
  }
}
```

---

## Performance Testing

1. **Load test with 10 screening questions:**
   - Expected: Page loads < 2 seconds
   - Expected: No lag when selecting options

2. **Load test with 5 languages:**
   - Expected: Dropdowns render instantly
   - Expected: Form validation < 100ms

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Common Issues & Solutions

### Issue 1: Screening questions not appearing
**Solution:** Check job API response includes `screeningQuestions` field

### Issue 2: Knockout validation not working
**Solution:** Verify `disqualify: true` is set on the question in the job config

### Issue 3: Languages dropdown empty
**Solution:** Check job API response includes `languages` field with valid values

### Issue 4: RTL not working
**Solution:** Verify `dir={isRTL ? "rtl" : "ltr"}` is on all form controls

### Issue 5: Data not saving
**Solution:** Check Applicant schema includes `screeningAnswers` and `languageProficiency` fields

---

## Success Criteria

All tests must pass:
- [x] Sections render correctly
- [x] Knockout validation works
- [x] Data persists to database
- [x] RTL layout correct
- [x] Validation messages in both languages
- [x] No console errors
- [x] No linter errors
- [x] Responsive on all screen sizes
- [x] Accessible with keyboard and screen reader








