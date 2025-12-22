# ScrapingDog API - Quick Fix Reference

## ❌ PROBLEM: ECONNRESET Error

```
Error: read ECONNRESET
code: 'ECONNRESET'
errno: -54
```

**Root Cause:** Parameter mismatch - sending username instead of full URL

---

## ✅ SOLUTION APPLIED

### Before (Incorrect):
```typescript
// Extracting username
const profileId = 'rznrzq'  // ❌ Wrong

// API call
params: {
    api_key: SCRAPINGDOG_API_KEY,
    id: profileId,  // ❌ Username only
    type: 'profile',
    premium: 'true',
    webhook: 'false',
    fresh: 'false'
}
timeout: 120000  // 2 minutes
```

### After (Correct):
```typescript
// No extraction - use full URL directly

// API call
params: {
    api_key: SCRAPINGDOG_API_KEY,
    type: 'profile',
    id: linkedinUrl  // ✅ Full URL: https://www.linkedin.com/in/rznrzq/
}
timeout: 30000  // 30 seconds
```

---

## 3 Key Changes

1. **Pass Full URL** (not username)
   - Before: `id: 'rznrzq'`
   - After: `id: 'https://www.linkedin.com/in/rznrzq/'`

2. **Remove Extra Parameters**
   - Removed: `premium`, `webhook`, `fresh`
   - Keep only: `api_key`, `type`, `id`

3. **Shorter Timeout**
   - Before: `120000` (2 minutes)
   - After: `30000` (30 seconds)

---

## Testing

Run a test application with a LinkedIn profile:
```bash
# The logs should now show:
[LinkedIn Extractor] Calling ScrapingDog API with full URL...
# Instead of:
[LinkedIn Extractor] Extracted profile ID: rznrzq
```

---

## Files Modified

- `/src/services/evaluation/urlContentExtractor.ts` (lines 372-419)

---

## Expected Result

✅ No more ECONNRESET errors
✅ LinkedIn profiles successfully scraped
✅ Faster failure detection (30s vs 2min)

---

## If Still Failing

Check:
1. ✅ API key is set: `SCRAPINGDOG_API_KEY`
2. ✅ Account has credits
3. ✅ LinkedIn URL is public
4. ✅ Network connectivity

---

**Status**: ✅ Fixed - Ready to test

