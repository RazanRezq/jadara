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
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null }

if (!global.mongoose) {
    global.mongoose = cached
}

async function dbConnect(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
        }

        cached.promise = mongoose
            .connect(getMongoUri(), opts)
            .then((mongoose) => {
                console.log('MongoDB connected successfully')
                return mongoose
            })
            .catch((error) => {
                console.error('MongoDB connection error:', error)
                cached.promise = null
                throw error
            })
    }

    try {
        cached.conn = await cached.promise
        return cached.conn
    } catch (error) {
        cached.promise = null
        throw error
    }
}

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error)
    cached.promise = null
    cached.conn = null
})

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected')
    cached.promise = null
    cached.conn = null
})

export default dbConnect

