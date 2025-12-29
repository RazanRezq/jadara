"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
    Activity,
    RefreshCw,
    Database,
    Cpu,
    HardDrive,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Server,
    Zap,
} from "lucide-react"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"

interface SystemHealth {
    timestamp: string
    status: "healthy" | "unhealthy"
    database: {
        status: string
        host: string
        name: string
        collections: number
        dataSize: number
        storageSize: number
        indexes: number
        avgObjSize: number
    }
    memory: {
        total: number
        free: number
        used: number
        usagePercent: number
    }
    cpu: {
        count: number
        loadAverage: {
            "1min": number
            "5min": number
            "15min": number
        }
    }
    uptime: {
        system: number
        process: number
    }
    collections: Array<{
        name: string
        count: number
        size: number
        avgObjSize: number
        storageSize: number
        indexes: number
    }>
    performance: {
        responseTime: number
    }
}

interface Alert {
    type: "error" | "warning" | "info"
    category: string
    message: string
    value?: number
    threshold?: number
}

export function SystemHealthClient() {
    const { locale } = useTranslate()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [autoRefresh, setAutoRefresh] = useState(false)

    const fetchHealth = async (showSpinner = true) => {
        if (showSpinner) setLoading(true)
        else setRefreshing(true)

        try {
            const [healthResponse, alertsResponse] = await Promise.all([
                fetch("/api/system-health"),
                fetch("/api/system-health/alerts"),
            ])

            if (!healthResponse.ok) {
                throw new Error(`HTTP error! status: ${healthResponse.status}`)
            }

            if (!alertsResponse.ok) {
                throw new Error(`HTTP error! status: ${alertsResponse.status}`)
            }

            const healthData = await healthResponse.json()
            const alertsData = await alertsResponse.json()

            if (healthData.success) {
                setHealth(healthData.data)
            }

            if (alertsData.success) {
                setAlerts(alertsData.data.alerts)
            }
        } catch (error) {
            console.error("Failed to fetch system health:", error)
            toast.error(locale === "ar" ? "فشل جلب بيانات النظام" : "Failed to fetch system health")
        } finally {
            if (showSpinner) setLoading(false)
            else setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchHealth()
    }, [])

    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            fetchHealth(false)
        }, 10000) // Refresh every 10 seconds

        return () => clearInterval(interval)
    }, [autoRefresh])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    if (loading || !health) {
        return (
            <div className="dashboard-container flex items-center justify-center py-20">
                <Spinner className="h-8 w-8 text-primary" />
            </div>
        )
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        {locale === "ar" ? "مراقبة صحة النظام" : "System Health Monitoring"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {locale === "ar"
                            ? "مراقبة أداء النظام والموارد في الوقت الفعلي"
                            : "Real-time system performance and resource monitoring"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <Zap className="h-4 w-4 me-2" />
                        {locale === "ar" ? "تحديث تلقائي" : "Auto Refresh"}
                    </Button>
                    <Button variant="outline" onClick={() => fetchHealth(false)} disabled={refreshing}>
                        <RefreshCw
                            className={cn("h-4 w-4 me-2", refreshing && "animate-spin")}
                        />
                        {locale === "ar" ? "تحديث" : "Refresh"}
                    </Button>
                </div>
            </div>

            {/* Status Badge */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {health.status === "healthy" ? (
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {health.status === "healthy"
                                        ? locale === "ar"
                                            ? "النظام يعمل بشكل طبيعي"
                                            : "System is Healthy"
                                        : locale === "ar"
                                          ? "النظام يواجه مشاكل"
                                          : "System has Issues"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {locale === "ar" ? "آخر تحديث:" : "Last updated:"}{" "}
                                    {new Date(health.timestamp).toLocaleString(
                                        locale === "ar" ? "ar-SA" : "en-US"
                                    )}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant={health.status === "healthy" ? "default" : "destructive"}
                            className="text-lg px-4 py-1"
                        >
                            {health.status === "healthy"
                                ? locale === "ar"
                                    ? "صحي"
                                    : "Healthy"
                                : locale === "ar"
                                  ? "غير صحي"
                                  : "Unhealthy"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            {alerts.length > 0 && (
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="h-5 w-5" />
                            {locale === "ar" ? "التنبيهات" : "Alerts"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg",
                                        alert.type === "error"
                                            ? "bg-red-100 dark:bg-red-950"
                                            : "bg-yellow-100 dark:bg-yellow-900"
                                    )}
                                >
                                    {alert.type === "error" ? (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium">{alert.message}</p>
                                        {alert.value !== undefined && alert.threshold !== undefined && (
                                            <p className="text-sm text-muted-foreground">
                                                {locale === "ar" ? "القيمة:" : "Value:"}{" "}
                                                {alert.value.toFixed(2)}% /{" "}
                                                {locale === "ar" ? "الحد:" : "Threshold:"}{" "}
                                                {alert.threshold}%
                                            </p>
                                        )}
                                    </div>
                                    <Badge variant={alert.type === "error" ? "destructive" : "secondary"}>
                                        {alert.category}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Database Status */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            {locale === "ar" ? "قاعدة البيانات" : "Database"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "الحالة" : "Status"}
                                </span>
                                <Badge
                                    variant={
                                        health.database.status === "connected"
                                            ? "default"
                                            : "destructive"
                                    }
                                >
                                    {health.database.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "المجموعات" : "Collections"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {health.database.collections}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "حجم البيانات" : "Data Size"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {formatBytes(health.database.dataSize)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Memory Usage */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-primary" />
                            {locale === "ar" ? "الذاكرة" : "Memory"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">
                                        {locale === "ar" ? "الاستخدام" : "Usage"}
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {health.memory.usagePercent.toFixed(1)}%
                                    </span>
                                </div>
                                <Progress value={health.memory.usagePercent} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "المستخدم" : "Used"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {formatBytes(health.memory.used)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "الإجمالي" : "Total"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {formatBytes(health.memory.total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CPU Load */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-primary" />
                            {locale === "ar" ? "المعالج" : "CPU"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "عدد الأنوية" : "Cores"}
                                </span>
                                <span className="text-sm font-semibold">{health.cpu.count}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "متوسط 1 د" : "1 min avg"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {health.cpu.loadAverage["1min"].toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "متوسط 5 د" : "5 min avg"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {health.cpu.loadAverage["5min"].toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "متوسط 15 د" : "15 min avg"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {health.cpu.loadAverage["15min"].toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Uptime */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {locale === "ar" ? "وقت التشغيل" : "Uptime"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "النظام" : "System"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {formatUptime(health.uptime.system)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "العملية" : "Process"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {formatUptime(health.uptime.process)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {locale === "ar" ? "وقت الاستجابة" : "Response Time"}
                                </span>
                                <span className="text-sm font-semibold">
                                    {health.performance.responseTime.toFixed(2)}ms
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Collections Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        {locale === "ar" ? "مجموعات قاعدة البيانات" : "Database Collections"}
                    </CardTitle>
                    <CardDescription>
                        {locale === "ar"
                            ? "نظرة عامة على جميع المجموعات في قاعدة البيانات"
                            : "Overview of all database collections"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-3 text-start">
                                        {locale === "ar" ? "المجموعة" : "Collection"}
                                    </th>
                                    <th className="p-3 text-start">
                                        {locale === "ar" ? "العدد" : "Count"}
                                    </th>
                                    <th className="p-3 text-start">
                                        {locale === "ar" ? "الحجم" : "Size"}
                                    </th>
                                    <th className="p-3 text-start">
                                        {locale === "ar" ? "متوسط حجم العنصر" : "Avg. Object Size"}
                                    </th>
                                    <th className="p-3 text-start">
                                        {locale === "ar" ? "الفهارس" : "Indexes"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {health.collections.map((col, idx) => (
                                    <tr key={col.name} className={cn(idx % 2 === 0 && "bg-muted/20")}>
                                        <td className="p-3 font-medium">{col.name}</td>
                                        <td className="p-3">{col.count.toLocaleString()}</td>
                                        <td className="p-3">{formatBytes(col.size)}</td>
                                        <td className="p-3">{formatBytes(col.avgObjSize)}</td>
                                        <td className="p-3">{col.indexes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
