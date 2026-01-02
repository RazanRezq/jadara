"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Monitor, Smartphone, Tablet, MapPin, Chrome, AlertCircle, Loader2, Trash2, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useTranslate } from "@/hooks/useTranslate"

interface Session {
    _id: string
    userId: string
    userEmail: string
    userName: string
    userRole: string
    sessionId: string
    ipAddress: string
    userAgent: string
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
    browser: string
    os: string
    city?: string
    country?: string
    isActive: boolean
    lastActivity: string
    createdAt: string
    expiresAt: string
}

export function SessionsClient() {
    const { t } = useTranslate()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
    const [revokeAllDialogOpen, setRevokeAllDialogOpen] = useState(false)
    const [revoking, setRevoking] = useState(false)

    // Filters
    const [searchEmail, setSearchEmail] = useState("")
    const [filterActive, setFilterActive] = useState<string>("true")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchSessions = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
            })

            if (filterActive) params.append("isActive", filterActive)

            const response = await fetch(`/api/sessions?${params}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                let filteredSessions = result.data.sessions

                // Client-side email search
                if (searchEmail) {
                    filteredSessions = filteredSessions.filter((s: Session) =>
                        s.userEmail.toLowerCase().includes(searchEmail.toLowerCase()) ||
                        s.userName.toLowerCase().includes(searchEmail.toLowerCase())
                    )
                }

                setSessions(filteredSessions)
                setTotal(result.data.pagination.total)
            } else {
                toast.error(t("sessions.fetchError"))
            }
        } catch (error) {
            console.error("Error fetching sessions:", error)
            toast.error(t("sessions.loadError"))
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/sessions/stats")

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setStats(result.data)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    useEffect(() => {
        fetchSessions()
        fetchStats()
    }, [page, filterActive])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchSessions()
            } else {
                setPage(1)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchEmail])

    const handleRevokeSession = async () => {
        if (!selectedSession) return

        try {
            setRevoking(true)
            const response = await fetch(`/api/sessions/revoke/${selectedSession.sessionId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Revoked by superadmin" }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                toast.success(t("sessions.revokeSuccess"))
                setRevokeDialogOpen(false)
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || t("sessions.revokeError"))
            }
        } catch (error) {
            console.error("Error revoking session:", error)
            toast.error(t("sessions.revokeErrorGeneric"))
        } finally {
            setRevoking(false)
        }
    }

    const handleRevokeAllSessions = async (userId: string) => {
        try {
            setRevoking(true)
            const response = await fetch(`/api/sessions/revoke-all/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "All sessions revoked by superadmin" }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                toast.success(result.message || t("sessions.revokeAllSuccess"))
                setRevokeAllDialogOpen(false)
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || t("sessions.revokeAllError"))
            }
        } catch (error) {
            console.error("Error revoking all sessions:", error)
            toast.error(t("sessions.revokeAllErrorGeneric"))
        } finally {
            setRevoking(false)
        }
    }

    const handleCleanup = async () => {
        if (!confirm(t("sessions.cleanupConfirm"))) return

        try {
            const response = await fetch("/api/sessions/cleanup", { method: "DELETE" })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                toast.success(result.message || t("sessions.cleanupSuccess"))
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || t("sessions.cleanupError"))
            }
        } catch (error) {
            console.error("Error cleaning up sessions:", error)
            toast.error(t("sessions.cleanupErrorGeneric"))
        }
    }

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone className="h-4 w-4" />
            case 'tablet':
                return <Tablet className="h-4 w-4" />
            default:
                return <Monitor className="h-4 w-4" />
        }
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader
                    titleKey="sessions.title"
                    subtitleKey="sessions.subtitle"
                    className="px-0 pt-0 pb-0"
                />
                <Button variant="outline" onClick={handleCleanup}>
                    <Trash2 className="h-4 w-4 me-2" />
                    {t("sessions.cleanupOld")}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t("sessions.activeSessions")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeSessions}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t("sessions.last24Hours")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.recentSessions}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t("sessions.mobileSessions")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.byDevice?.find((d: any) => d._id === 'mobile')?.count || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{t("sessions.desktopSessions")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.byDevice?.find((d: any) => d._id === 'desktop')?.count || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("sessions.filters")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute top-3 start-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("sessions.searchPlaceholder")}
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="ps-9 text-start"
                            />
                        </div>
                        <Select value={filterActive} onValueChange={setFilterActive}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("sessions.activeOnly")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")} {t("sessions.activeSessions")}</SelectItem>
                                <SelectItem value="true">{t("sessions.activeOnly")}</SelectItem>
                                <SelectItem value="false">{t("sessions.revokedOnly")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("sessions.activeSessions")}</CardTitle>
                            <CardDescription>{total} {t("sessions.totalSessions")}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("sessions.noSessionsFound")}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Desktop Table View - hidden on mobile */}
                            <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-start">{t("auditLogs.user")}</TableHead>
                                        <TableHead className="text-start">{t("sessions.device")}</TableHead>
                                        <TableHead className="text-start">{t("sessions.location")}</TableHead>
                                        <TableHead className="text-start">{t("sessions.lastActivity")}</TableHead>
                                        <TableHead className="text-start">{t("common.status")}</TableHead>
                                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow key={session._id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{session.userName}</div>
                                                    <div className="text-xs text-muted-foreground">{session.userEmail}</div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {session.userRole}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getDeviceIcon(session.deviceType)}
                                                    <div>
                                                        <div className="text-sm font-medium capitalize leading-tight">{session.deviceType}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {session.browser} on {session.os}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>
                                                        {session.city && session.country
                                                            ? `${session.city}, ${session.country}`
                                                            : session.ipAddress}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(session.lastActivity), "MMM d, yyyy HH:mm")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {session.isActive ? (
                                                    <Badge className="bg-green-500">{t("sessions.active")}</Badge>
                                                ) : (
                                                    <Badge variant="secondary">{t("sessions.revoked")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 justify-end">
                                                    {session.isActive && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedSession(session)
                                                                    setRevokeDialogOpen(true)
                                                                }}
                                                            >
                                                                {t("sessions.revoke")}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedSession(session)
                                                                    setRevokeAllDialogOpen(true)
                                                                }}
                                                            >
                                                                {t("sessions.revokeAll")}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>

                            {/* Mobile Card View - shown on mobile only */}
                            <div className="md:hidden space-y-3">
                                {sessions.map((session) => (
                                    <Card key={session._id} className={`border-l-4 ${session.isActive ? 'border-l-green-500' : 'border-l-gray-400'}`}>
                                        <CardContent className="p-4 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{session.userName}</h4>
                                                    <p className="text-sm text-muted-foreground truncate">{session.userEmail}</p>
                                                    <Badge variant="outline" className="text-xs mt-1">
                                                        {session.userRole}
                                                    </Badge>
                                                </div>
                                                {session.isActive ? (
                                                    <Badge className="bg-green-500 shrink-0">{t("sessions.active")}</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="shrink-0">{t("sessions.revoked")}</Badge>
                                                )}
                                            </div>

                                            {/* Device Info */}
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    {getDeviceIcon(session.deviceType)}
                                                    <div>
                                                        <p className="text-sm font-medium capitalize leading-tight">{session.deviceType}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {session.browser} on {session.os}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span>
                                                        {session.city && session.country
                                                            ? `${session.city}, ${session.country}`
                                                            : session.ipAddress}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-muted-foreground">{t("sessions.lastActivity")}</p>
                                                    <p className="text-sm">
                                                        {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(session.lastActivity), "MMM d, yyyy HH:mm")}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {session.isActive && (
                                                <div className="flex gap-2 pt-2 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => {
                                                            setSelectedSession(session)
                                                            setRevokeDialogOpen(true)
                                                        }}
                                                    >
                                                        {t("sessions.revoke")}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => {
                                                            setSelectedSession(session)
                                                            setRevokeAllDialogOpen(true)
                                                        }}
                                                    >
                                                        {t("sessions.revokeAll")}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {t("sessions.showing")} {sessions.length} {t("sessions.of")} {total} {t("sessions.totalSessions")}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        {t("sessions.previous")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={sessions.length < 50}
                                    >
                                        {t("sessions.next")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Revoke Single Session Dialog */}
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("sessions.revokeSession")}</DialogTitle>
                        <DialogDescription>
                            {t("sessions.revokeSessionConfirm")}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSession && (
                        <div className="space-y-2 py-4">
                            <div><strong>{t("sessions.user")}:</strong> {selectedSession.userName}</div>
                            <div><strong>{t("sessions.device")}:</strong> {selectedSession.deviceType}</div>
                            <div><strong>{t("sessions.browser")}:</strong> {selectedSession.browser}</div>
                            <div><strong>{t("sessions.ip")}:</strong> {selectedSession.ipAddress}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeDialogOpen(false)} disabled={revoking}>
                            {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeSession} disabled={revoking}>
                            {revoking ? t("sessions.revoking") : t("sessions.revokeSession")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke All Sessions Dialog */}
            <Dialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("sessions.revokeAllSessions")}</DialogTitle>
                        <DialogDescription>
                            {t("sessions.revokeAllConfirm")}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSession && (
                        <div className="space-y-2 py-4">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">{t("sessions.warningAffectsAll")}</span>
                            </div>
                            <div><strong>{t("sessions.user")}:</strong> {selectedSession.userName}</div>
                            <div><strong>{t("common.email")}:</strong> {selectedSession.userEmail}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeAllDialogOpen(false)} disabled={revoking}>
                            {t("common.cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedSession && handleRevokeAllSessions(selectedSession.userId)}
                            disabled={revoking}
                        >
                            {revoking ? t("sessions.revoking") : t("sessions.revokeAllSessions")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
