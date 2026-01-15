#!/bin/bash

# MongoDB Database Migration Script
# Migrates all collections from 'goielts' to 'jadara'

echo "🔄 MongoDB Database Migration: goielts → jadara"
echo "================================================"
echo ""

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is not set"
    echo "Please set it first:"
    echo "export MONGODB_URI='your_mongodb_connection_string'"
    exit 1
fi

# Extract base URI without database name
BASE_URI=$(echo $MONGODB_URI | sed 's/\/[^\/]*$//')

SOURCE_DB="goielts"
TARGET_DB="jadara"

echo "Source Database: $SOURCE_DB"
echo "Target Database: $TARGET_DB"
echo ""

# Get list of collections from source database
echo "📋 Getting list of collections..."
COLLECTIONS=$(mongosh "$BASE_URI/$SOURCE_DB" --quiet --eval "db.getCollectionNames().join(' ')")

if [ -z "$COLLECTIONS" ]; then
    echo "❌ No collections found in $SOURCE_DB or connection failed"
    exit 1
fi

echo "Found collections: $COLLECTIONS"
echo ""

# Copy each collection
for COLLECTION in $COLLECTIONS; do
    echo "📦 Copying collection: $COLLECTION"
    
    # Count documents in source
    SOURCE_COUNT=$(mongosh "$BASE_URI/$SOURCE_DB" --quiet --eval "db.$COLLECTION.countDocuments()")
    echo "   Source documents: $SOURCE_COUNT"
    
    # Copy using aggregation pipeline
    mongosh "$BASE_URI/$SOURCE_DB" --quiet --eval "
        db.$COLLECTION.aggregate([
            { \$match: {} },
            { \$out: { db: '$TARGET_DB', coll: '$COLLECTION' } }
        ])
    " > /dev/null
    
    # Verify copy
    TARGET_COUNT=$(mongosh "$BASE_URI/$TARGET_DB" --quiet --eval "db.$COLLECTION.countDocuments()")
    echo "   Target documents: $TARGET_COUNT"
    
    if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
        echo "   ✅ Successfully copied"
    else
        echo "   ❌ Warning: Document count mismatch!"
        exit 1
    fi
    echo ""
done

echo "================================================"
echo "✅ Migration complete!"
echo ""
echo "⚠️  IMPORTANT: Verify your data in the 'jadara' database"
echo "   Then manually drop the 'goielts' database:"
echo ""
echo "   mongosh \"$BASE_URI/goielts\" --eval \"db.dropDatabase()\""
echo ""
