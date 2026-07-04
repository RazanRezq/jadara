// Temporary connectivity test — safe to delete
import mongoose from 'mongoose'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const uri = env.match(/^MONGODB_URI=(.+)$/m)?.[1]?.trim()
if (!uri) {
    console.error('No MONGODB_URI in .env.local')
    process.exit(1)
}

const start = Date.now()
console.log('Connecting to', uri.replace(/\/\/.*@/, '//***@'))

try {
    const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4,
    })
    console.log(`CONNECTED in ${Date.now() - start}ms`)
    const ping = Date.now()
    await conn.connection.db.admin().ping()
    console.log(`PING: ${Date.now() - ping}ms`)
    const collections = await conn.connection.db.listCollections().toArray()
    console.log(`COLLECTIONS (${collections.length}):`, collections.map(c => c.name).join(', '))
    const users = await conn.connection.db.collection('users').countDocuments()
    console.log(`users collection: ${users} documents`)
    await mongoose.disconnect()
    process.exit(0)
} catch (err) {
    console.error(`FAILED after ${Date.now() - start}ms:`, err.message)
    process.exit(1)
}
