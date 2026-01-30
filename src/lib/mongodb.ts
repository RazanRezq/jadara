import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

function getMongoUri(): string {
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
    }
    return MONGODB_URI
}

interface MongooseCache {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
    isConnecting: boolean
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined
    var mongooseEventHandlersRegistered: boolean | undefined
}

// Use a unique key to avoid conflicts with mongoose's internal global
const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null, isConnecting: false }

if (!global.mongooseCache) {
    global.mongooseCache = cached
}

// Register event handlers only once (prevents memory leaks on hot reload)
if (!global.mongooseEventHandlersRegistered) {
    global.mongooseEventHandlersRegistered = true

    mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully')
    })

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error)
    })

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected - will auto-reconnect')
    })

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected')
    })
}

async function dbConnect(): Promise<typeof mongoose> {
    // Fast path: return existing connection immediately
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn
    }

    // If already connecting, wait for the existing promise
    if (cached.promise && cached.isConnecting) {
        try {
            cached.conn = await cached.promise
            return cached.conn
        } catch {
            // Connection failed, will retry below
        }
    }

    // If connection is in a bad state, reset
    const readyState = mongoose.connection.readyState
    if (readyState === 0 || readyState === 3) { // 0=disconnected, 3=disconnecting
        cached.conn = null
        cached.promise = null
        cached.isConnecting = false
    }

    // Create new connection if needed
    if (!cached.promise || !cached.isConnecting) {
        cached.isConnecting = true

        const opts: mongoose.ConnectOptions = {
            bufferCommands: false,
            // Connection timeouts
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            // Force IPv4 (avoids IPv6 issues)
            family: 4,
            // Connection pool settings - optimized for serverless
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            // Performance & reliability
            retryWrites: true,
            retryReads: true,
        }

        cached.promise = mongoose.connect(getMongoUri(), opts)
    }

    try {
        cached.conn = await cached.promise
        cached.isConnecting = false
        return cached.conn
    } catch (error) {
        cached.promise = null
        cached.conn = null
        cached.isConnecting = false
        throw error
    }
}

export default dbConnect
