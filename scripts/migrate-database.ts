import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
    console.error('❌ Please define MONGODB_URI environment variable')
    process.exit(1)
}

// Extract base URI without database name
const baseUri = MONGODB_URI.replace(/\/[^\/]+(\?|$)/, '/$1')
const sourceDbName = 'goielts'
const targetDbName = 'jadara'

async function migrateDatabase() {
    console.log('🔄 MongoDB Database Migration: goielts → jadara')
    console.log('================================================\n')

    try {
        // Connect to source database
        console.log(`📡 Connecting to source database: ${sourceDbName}`)
        const sourceUri = baseUri.replace(/\/(\?|$)/, `/${sourceDbName}$1`)
        const sourceConn = await mongoose.createConnection(sourceUri).asPromise()
        console.log('✅ Connected to source\n')

        // Connect to target database
        console.log(`📡 Connecting to target database: ${targetDbName}`)
        const targetUri = baseUri.replace(/\/(\?|$)/, `/${targetDbName}$1`)
        const targetConn = await mongoose.createConnection(targetUri).asPromise()
        console.log('✅ Connected to target\n')

        // Get all collections from source
        const collections = await sourceConn.db.listCollections().toArray()
        console.log(`📋 Found ${collections.length} collections to migrate:\n`)

        for (const collInfo of collections) {
            const collectionName = collInfo.name

            // Skip system collections
            if (collectionName.startsWith('system.')) {
                console.log(`⏭️  Skipping system collection: ${collectionName}\n`)
                continue
            }

            console.log(`📦 Migrating collection: ${collectionName}`)

            // Get source collection
            const sourceCollection = sourceConn.db.collection(collectionName)
            const sourceCount = await sourceCollection.countDocuments()
            console.log(`   Source documents: ${sourceCount}`)

            if (sourceCount === 0) {
                console.log(`   ⚠️  Empty collection, skipping...\n`)
                continue
            }

            // Get target collection
            const targetCollection = targetConn.db.collection(collectionName)

            // Check if target collection already has data
            const targetCount = await targetCollection.countDocuments()
            if (targetCount > 0) {
                console.log(
                    `   ⚠️  Target collection already has ${targetCount} documents`
                )
                console.log(`   Clearing target collection first...`)
                await targetCollection.deleteMany({})
            }

            // Copy documents in batches
            const batchSize = 1000
            let processedCount = 0

            const cursor = sourceCollection.find({})

            while (await cursor.hasNext()) {
                const batch = []

                for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
                    const doc = await cursor.next()
                    if (doc) batch.push(doc)
                }

                if (batch.length > 0) {
                    await targetCollection.insertMany(batch, { ordered: false })
                    processedCount += batch.length
                    process.stdout.write(
                        `\r   Progress: ${processedCount}/${sourceCount} documents`
                    )
                }
            }

            console.log('') // New line after progress

            // Verify count
            const finalTargetCount = await targetCollection.countDocuments()
            console.log(`   Target documents: ${finalTargetCount}`)

            if (finalTargetCount === sourceCount) {
                console.log(`   ✅ Successfully migrated ${collectionName}\n`)
            } else {
                console.error(
                    `   ❌ Error: Document count mismatch for ${collectionName}!`
                )
                console.error(`      Expected: ${sourceCount}, Got: ${finalTargetCount}`)
                throw new Error(`Migration failed for collection: ${collectionName}`)
            }

            // Copy indexes
            console.log(`   🔍 Copying indexes...`)
            const indexes = await sourceCollection.indexes()
            for (const index of indexes) {
                // Skip the default _id index
                if (index.name === '_id_') continue

                try {
                    const indexKey = index.key
                    const indexOptions: any = {
                        name: index.name,
                    }

                    if (index.unique) indexOptions.unique = true
                    if (index.sparse) indexOptions.sparse = true
                    if (index.expireAfterSeconds !== undefined)
                        indexOptions.expireAfterSeconds = index.expireAfterSeconds

                    await targetCollection.createIndex(indexKey, indexOptions)
                    console.log(`   ✅ Created index: ${index.name}`)
                } catch (error) {
                    console.log(
                        `   ⚠️  Index ${index.name} might already exist, skipping...`
                    )
                }
            }
            console.log('')
        }

        console.log('================================================')
        console.log('✅ Migration complete!\n')
        console.log('📊 Summary:')
        console.log(`   Total collections migrated: ${collections.length}`)
        console.log(`   Source database: ${sourceDbName}`)
        console.log(`   Target database: ${targetDbName}\n`)
        console.log('⚠️  IMPORTANT NEXT STEPS:')
        console.log('   1. Verify your data in MongoDB Compass')
        console.log('   2. Test your application with the new database')
        console.log(
            `   3. Update MONGODB_URI to point to '${targetDbName}' database`
        )
        console.log(
            `   4. Only after verification, drop the '${sourceDbName}' database\n`
        )

        await sourceConn.close()
        await targetConn.close()
        process.exit(0)
    } catch (error) {
        console.error('\n❌ Migration failed:', error)
        process.exit(1)
    }
}

migrateDatabase()
