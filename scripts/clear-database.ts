import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to database...')
    await dbConnect()

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    // Get all collections
    const collections = await db.listCollections().toArray()
    console.log('\n📋 Found collections:', collections.map(c => c.name).join(', '))

    // Collections to preserve
    const preserveCollections = ['users', 'companyprofiles']

    // Collections to drop
    const collectionsToRemove = collections.filter(
      c => !preserveCollections.includes(c.name.toLowerCase())
    )

    if (collectionsToRemove.length === 0) {
      console.log('\n✅ No collections to remove (only Users collection exists)')
      process.exit(0)
    }

    console.log('\n🗑️  Collections to be deleted:')
    collectionsToRemove.forEach(c => console.log(`   - ${c.name}`))

    console.log('\n✅ Collections to be preserved:')
    preserveCollections.forEach(c => console.log(`   - ${c}`))

    console.log('\n⚠️  Starting cleanup in 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Drop each collection
    for (const collection of collectionsToRemove) {
      try {
        await db.dropCollection(collection.name)
        console.log(`   ✓ Dropped ${collection.name}`)
      } catch (error: any) {
        console.error(`   ✗ Failed to drop ${collection.name}:`, error.message)
      }
    }

    console.log('\n✨ Database cleanup complete!')
    console.log('👥 Users collection preserved with all accounts intact')
    console.log('🏢 CompanyProfiles collection preserved')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  }
}

clearDatabase()
