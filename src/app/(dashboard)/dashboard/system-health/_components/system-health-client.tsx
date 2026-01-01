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
            <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 transition-all">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-xl border-2 shadow-sm",
                                health.status === "healthy"
                                    ? "bg-emerald-500/10 border-emerald-300/50 dark:border-emerald-700/50"
                                    : "bg-rose-500/10 border-rose-300/50 dark:border-rose-700/50"
                            )}>
                                {health.status === "healthy" ? (
                                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <XCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {health.status === "healthy"
                                        ? locale === "ar"
                                            ? "النظام يعمل بشكل طبيعي"
                                            : "System is Healthy"
                                        : locale === "ar"
                                          ? "النظام يواجه مشاكل"
                                          : "System has Issues"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {locale === "ar" ? "آخر تحديث:" : "Last updated:"}{" "}
                                    {new Date(health.timestamp).toLocaleString(
                                        locale === "ar" ? "ar-SA" : "en-US"
                                    )}
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-base px-6 py-2 shadow-sm font-bold border-2 transition-all",
                                health.status === "healthy"
                                    ? "border-emerald-300/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 dark:border-emerald-700/50"
                                    : "border-rose-300/50 bg-rose-500/5 text-rose-700 dark:text-rose-400 dark:border-rose-700/50"
                            )}
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
                <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-300/50 dark:border-amber-700/50">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-bold text-foreground">
                                {locale === "ar" ? "التنبيهات" : "Alerts"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border-2 shadow-sm transition-all hover:shadow-md",
                                        alert.type === "error"
                                            ? "bg-rose-50/40 border-rose-300/50 dark:bg-rose-950/20 dark:border-rose-800/50"
                                            : "bg-amber-50/40 border-amber-300/50 dark:bg-amber-950/20 dark:border-amber-800/50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg border",
                                        alert.type === "error"
                                            ? "bg-rose-500/5 border-rose-300/50 dark:border-rose-700/50"
                                            : "bg-amber-500/5 border-amber-300/50 dark:border-amber-700/50"
                                    )}>
                                        {alert.type === "error" ? (
                                            <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-foreground">{alert.message}</p>
                                        {alert.value !== undefined && alert.threshold !== undefined && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {locale === "ar" ? "القيمة:" : "Value:"}{" "}
                                                <span className="font-medium">{alert.value.toFixed(2)}%</span> /{" "}
                                                {locale === "ar" ? "الحد:" : "Threshold:"}{" "}
                                                <span className="font-medium">{alert.threshold}%</span>
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "shadow-sm font-medium border-2",
                                            alert.type === "error"
                                                ? "bg-rose-500/5 border-rose-300/50 text-rose-700 dark:text-rose-400 dark:border-rose-700/50"
                                                : "bg-amber-500/5 border-amber-300/50 text-amber-700 dark:text-amber-400 dark:border-amber-700/50"
                                        )}
                                    >
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
                <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                                <Database className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-foreground">
                                {locale === "ar" ? "قاعدة البيانات" : "Database"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "الحالة" : "Status"}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "border-2 font-medium shadow-sm",
                                        health.database.status === "connected"
                                            ? "border-emerald-300/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                                            : "border-rose-300/50 bg-rose-500/5 text-rose-700 dark:text-rose-400"
                                    )}
                                >
                                    {health.database.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "المجموعات" : "Collections"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {health.database.collections}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "حجم البيانات" : "Data Size"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatBytes(health.database.dataSize)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Memory Usage */}
                <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                                <HardDrive className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-foreground">
                                {locale === "ar" ? "الذاكرة" : "Memory"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {locale === "ar" ? "الاستخدام" : "Usage"}
                                    </span>
                                    <span className="text-sm font-bold text-foreground">
                                        {health.memory.usagePercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${health.memory.usagePercent}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "المستخدم" : "Used"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatBytes(health.memory.used)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "الإجمالي" : "Total"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatBytes(health.memory.total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CPU Load */}
                <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                                <Cpu className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-foreground">
                                {locale === "ar" ? "المعالج" : "CPU"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "عدد الأنوية" : "Cores"}
                                </span>
                                <span className="text-sm font-bold text-foreground">{health.cpu.count}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "متوسط 1 د" : "1 min avg"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {health.cpu.loadAverage["1min"].toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "متوسط 5 د" : "5 min avg"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {health.cpu.loadAverage["5min"].toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "متوسط 15 د" : "15 min avg"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {health.cpu.loadAverage["15min"].toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Uptime */}
                <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 transition-all">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-foreground">
                                {locale === "ar" ? "وقت التشغيل" : "Uptime"}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "النظام" : "System"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatUptime(health.uptime.system)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "العملية" : "Process"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {formatUptime(health.uptime.process)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {locale === "ar" ? "وقت الاستجابة" : "Response Time"}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                    {health.performance.responseTime.toFixed(2)}ms
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Collections Table */}
            <Card className="border-2 border-border/50 shadow-md bg-gradient-to-br from-muted/30 via-background to-muted/10 overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                            <Server className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-foreground font-bold">
                            {locale === "ar" ? "مجموعات قاعدة البيانات" : "Database Collections"}
                        </span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {locale === "ar"
                            ? "نظرة عامة على جميع المجموعات في قاعدة البيانات"
                            : "Overview of all database collections"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border-2 border-border/50 overflow-hidden bg-background/50">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-border/50 bg-muted/50">
                                    <th className="p-4 text-start font-bold text-foreground">
                                        {locale === "ar" ? "المجموعة" : "Collection"}
                                    </th>
                                    <th className="p-4 text-start font-bold text-foreground">
                                        {locale === "ar" ? "العدد" : "Count"}
                                    </th>
                                    <th className="p-4 text-start font-bold text-foreground">
                                        {locale === "ar" ? "الحجم" : "Size"}
                                    </th>
                                    <th className="p-4 text-start font-bold text-foreground">
                                        {locale === "ar" ? "متوسط حجم العنصر" : "Avg. Object Size"}
                                    </th>
                                    <th className="p-4 text-start font-bold text-foreground">
                                        {locale === "ar" ? "الفهارس" : "Indexes"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {health.collections.map((col, idx) => (
                                    <tr
                                        key={col.name}
                                        className={cn(
                                            "border-b border-border/50 transition-colors hover:bg-muted/30",
                                            idx % 2 === 0 && "bg-muted/20"
                                        )}
                                    >
                                        <td className="p-4 font-semibold text-foreground">{col.name}</td>
                                        <td className="p-4 font-medium text-muted-foreground">{col.count.toLocaleString()}</td>
                                        <td className="p-4 font-medium text-muted-foreground">{formatBytes(col.size)}</td>
                                        <td className="p-4 font-medium text-muted-foreground">{formatBytes(col.avgObjSize)}</td>
                                        <td className="p-4 font-medium text-muted-foreground">{col.indexes}</td>
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
