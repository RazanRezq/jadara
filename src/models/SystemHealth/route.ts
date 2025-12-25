import { Hono } from 'hono'
import dbConnect from '@/lib/mongodb'
import { authenticate, requireRole } from '@/lib/authMiddleware'
import mongoose from 'mongoose'
import os from 'os'

const app = new Hono()

/**
 * GET /api/system-health
 * Get current system health metrics
 */
app.get('/', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        // Database health
        const dbState = mongoose.connection.readyState
        const dbStatus =
            dbState === 1
                ? 'connected'
                : dbState === 2
                  ? 'connecting'
                  : dbState === 3
                    ? 'disconnecting'
                    : 'disconnected'

        // Database stats
        const dbStats = await mongoose.connection.db?.stats()

        // System metrics
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem
        const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2)

        const loadAvg = os.loadavg()
        const cpuCount = os.cpus().length

        // Uptime
        const systemUptime = os.uptime()
        const processUptime = process.uptime()

        // Collection stats
        const collections = await mongoose.connection.db
            ?.listCollections()
            .toArray()

        const collectionStats = await Promise.all(
            (collections || []).map(async (col) => {
                try {
                    const collection = mongoose.connection.db?.collection(col.name) as any
                    const stats = await collection?.stats()
                    return {
                        name: col.name,
                        count: stats?.count || 0,
                        size: stats?.size || 0,
                        avgObjSize: stats?.avgObjSize || 0,
                        storageSize: stats.storageSize,
                        indexes: stats.nindexes,
                    }
                } catch (error) {
                    return {
                        name: col.name,
                        count: 0,
                        size: 0,
                        avgObjSize: 0,
                        storageSize: 0,
                        indexes: 0,
                    }
                }
            })
        )

        // Response times (from process)
        const hrtime = process.hrtime()
        const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000

        return c.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
                database: {
                    status: dbStatus,
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                    collections: dbStats?.collections || 0,
                    dataSize: dbStats?.dataSize || 0,
                    storageSize: dbStats?.storageSize || 0,
                    indexes: dbStats?.indexes || 0,
                    avgObjSize: dbStats?.avgObjSize || 0,
                },
                memory: {
                    total: totalMem,
                    free: freeMem,
                    used: usedMem,
                    usagePercent: parseFloat(memoryUsagePercent),
                },
                cpu: {
                    count: cpuCount,
                    loadAverage: {
                        '1min': loadAvg[0],
                        '5min': loadAvg[1],
                        '15min': loadAvg[2],
                    },
                },
                uptime: {
                    system: systemUptime,
                    process: processUptime,
                },
                collections: collectionStats,
                performance: {
                    responseTime,
                },
            },
        })
    } catch (error: any) {
        console.error('Error fetching system health:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch system health',
                details: error.message,
            },
            500
        )
    }
})

/**
 * GET /api/system-health/alerts
 * Get system health alerts and warnings
 */
app.get('/alerts', authenticate, requireRole('superadmin'), async (c) => {
    try {
        await dbConnect()

        const alerts: Array<{
            type: 'error' | 'warning' | 'info'
            category: string
            message: string
            value?: number
            threshold?: number
        }> = []

        // Check memory usage
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100

        if (memoryUsagePercent > 90) {
            alerts.push({
                type: 'error',
                category: 'Memory',
                message: 'Critical memory usage',
                value: memoryUsagePercent,
                threshold: 90,
            })
        } else if (memoryUsagePercent > 75) {
            alerts.push({
                type: 'warning',
                category: 'Memory',
                message: 'High memory usage',
                value: memoryUsagePercent,
                threshold: 75,
            })
        }

        // Check CPU load
        const loadAvg = os.loadavg()
        const cpuCount = os.cpus().length
        const load1minPerCPU = loadAvg[0] / cpuCount

        if (load1minPerCPU > 0.9) {
            alerts.push({
                type: 'error',
                category: 'CPU',
                message: 'Critical CPU load',
                value: load1minPerCPU * 100,
                threshold: 90,
            })
        } else if (load1minPerCPU > 0.7) {
            alerts.push({
                type: 'warning',
                category: 'CPU',
                message: 'High CPU load',
                value: load1minPerCPU * 100,
                threshold: 70,
            })
        }

        // Check database connection
        const dbState = mongoose.connection.readyState
        if (dbState !== 1) {
            alerts.push({
                type: 'error',
                category: 'Database',
                message: 'Database connection issue',
            })
        }

        // Check database size
        const dbStatsForAlerts = await mongoose.connection.db?.stats()
        const dbSizeGB = (dbStatsForAlerts?.storageSize || 0) / (1024 * 1024 * 1024)

        if (dbSizeGB > 10) {
            alerts.push({
                type: 'warning',
                category: 'Database',
                message: 'Large database size',
                value: dbSizeGB,
                threshold: 10,
            })
        }

        return c.json({
            success: true,
            data: {
                alerts,
                count: alerts.length,
                hasErrors: alerts.some((a) => a.type === 'error'),
                hasWarnings: alerts.some((a) => a.type === 'warning'),
            },
        })
    } catch (error: any) {
        console.error('Error fetching system alerts:', error)
        return c.json(
            {
                success: false,
                error: 'Failed to fetch system alerts',
                details: error.message,
            },
            500
        )
    }
})

export default app
