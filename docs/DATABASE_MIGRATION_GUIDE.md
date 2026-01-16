# Database Migration Guide

This guide explains how to migrate your MongoDB database to `jadara`.

## ⚠️ Important Notes

1. **Backup First**: Always backup your data before migration
2. **Zero Downtime**: Stop your application during migration to avoid data loss
3. **Verification**: Thoroughly verify data after migration before dropping the old database

---

## Method 1: Automated Script (Recommended) ✅

### Step 1: Prepare

Make sure your `.env.local` file has the correct MongoDB URI:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/old_database
```

### Step 2: Run Migration Script

```bash
bun run migrate-db
```

This script will:
- ✅ Connect to both source and target databases
- ✅ Copy all collections with their data
- ✅ Copy all indexes
- ✅ Verify document counts
- ✅ Show detailed progress

### Step 3: Update Environment Variable

After successful migration, update your `.env.local`:

```env
# Old
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/old_database

# New
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jadara
```

### Step 4: Test Your Application

```bash
bun dev
```

Test all features thoroughly:
- [ ] Login/Authentication
- [ ] View jobs
- [ ] View applicants
- [ ] Create new job
- [ ] Submit application
- [ ] AI evaluation
- [ ] User management

### Step 5: Drop Old Database (After Verification)

Once everything is working perfectly, drop the old database using MongoDB Compass:

1. Right-click on `old_database` database
2. Select **"Drop Database"**
3. Confirm the action

---

## Method 2: Manual Migration via MongoDB Compass

### Step 1: Export Collections

For each collection in `old_database`:

1. Click the collection name
2. Click **"Export Collection"** (top toolbar)
3. Select format: **JSON**
4. Choose location: `~/Desktop/old_database-backup/`
5. Click **"Export"**

Repeat for all collections:
- applicants
- auditlogs
- comments
- companyprofiles
- evaluations
- interviews
- jobs
- notifications
- permission_sets
- questions
- responses
- reviews
- sessions
- systemconfigs
- users

### Step 2: Import to jadara

1. Click on `jadara` database in left sidebar
2. For each collection:
   - Click **"Create collection"** (if doesn't exist)
   - Enter collection name (exact same as source)
   - Click the new collection
   - Click **"Add Data"** → **"Import JSON or CSV file"**
   - Select the exported JSON file
   - Click **"Import"**

### Step 3: Verify Counts

Compare document counts between databases:

| Collection | old_database | jadara | Status |
|------------|---------|--------|--------|
| applicants | 18 | ? | ⏳ |
| auditlogs | 98 | ? | ⏳ |
| evaluations | 10 | ? | ⏳ |
| jobs | 7 | ? | ⏳ |
| users | ... | ? | ⏳ |

### Step 4: Update Connection String

Update `.env.local` as shown in Method 1, Step 3.

### Step 5: Drop Old Database

Same as Method 1, Step 5.

---

## Method 3: MongoDB CLI (mongodump/mongorestore)

### Step 1: Export (Backup)

```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/old_database" --out=./backup
```

### Step 2: Import

```bash
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/jadara" --dir=./backup/old_database
```

### Step 3: Verify & Update

Follow Steps 4-5 from Method 1.

---

## Troubleshooting

### Script Fails with Connection Error

**Problem**: Cannot connect to MongoDB

**Solution**: 
1. Check `.env.local` has correct `MONGODB_URI`
2. Verify your IP is whitelisted in MongoDB Atlas
3. Test connection in MongoDB Compass

### Document Count Mismatch

**Problem**: Different number of documents in source vs target

**Solution**:
1. Stop the script immediately
2. Check for errors in console
3. Don't drop the old database yet
4. Re-run the migration script (it will clear and retry)

### Application Shows "Database not found"

**Problem**: Updated connection string but database is empty

**Solution**:
1. Check if migration completed successfully
2. Verify collections exist in `jadara` database in Compass
3. Check that `.env.local` points to `jadara` not `old_database`

### Some Collections Missing

**Problem**: Not all collections were migrated

**Solution**:
1. List collections in both databases
2. Manually export/import missing collections
3. Or re-run the automated script

---

## Verification Checklist

Before dropping the `old_database` database, verify:

- [ ] All collections exist in `jadara`
- [ ] Document counts match for each collection
- [ ] Indexes are present (check in MongoDB Compass)
- [ ] Application starts without errors
- [ ] Login works with existing users
- [ ] Jobs page loads with existing jobs
- [ ] Applicants page loads with existing applicants
- [ ] Creating new job works
- [ ] Submitting application works
- [ ] AI evaluation works
- [ ] No console errors related to database

---

## Rollback Plan

If something goes wrong:

1. **Keep the old `old_database` database** (don't drop it yet)
2. Update `.env.local` back to use `old_database`:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/old_database
   ```
3. Restart your application
4. Investigate the issue
5. Try migration again when ready

---

## Post-Migration

After successful migration and verification:

1. ✅ Drop the `old_database` database to save space
2. ✅ Update any external services pointing to the database
3. ✅ Update documentation
4. ✅ Inform team members about the change
5. ✅ Update backup scripts if any

---

## Support

If you encounter issues:

1. Check the error messages carefully
2. Verify MongoDB connection string
3. Ensure sufficient permissions on MongoDB Atlas
4. Check network connectivity
5. Review this guide's troubleshooting section

---

**Remember**: Never drop the old database until you've thoroughly tested the new one! 🛡️
