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
                toast.error("Failed to fetch sessions")
            }
        } catch (error) {
            console.error("Error fetching sessions:", error)
            toast.error("Error loading sessions")
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
                toast.success("Session revoked successfully")
                setRevokeDialogOpen(false)
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || "Failed to revoke session")
            }
        } catch (error) {
            console.error("Error revoking session:", error)
            toast.error("Error revoking session")
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
                toast.success(result.message)
                setRevokeAllDialogOpen(false)
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || "Failed to revoke sessions")
            }
        } catch (error) {
            console.error("Error revoking all sessions:", error)
            toast.error("Error revoking sessions")
        } finally {
            setRevoking(false)
        }
    }

    const handleCleanup = async () => {
        if (!confirm("Are you sure you want to cleanup expired and revoked sessions?")) return

        try {
            const response = await fetch("/api/sessions/cleanup", { method: "DELETE" })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                toast.success(result.message)
                fetchSessions()
                fetchStats()
            } else {
                toast.error(result.error || "Failed to cleanup sessions")
            }
        } catch (error) {
            console.error("Error cleaning up sessions:", error)
            toast.error("Error cleaning up sessions")
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("sessions.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("sessions.subtitle")}
                    </p>
                </div>
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
                                <SelectItem value="false">Revoked Only</SelectItem>
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
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium capitalize">{session.deviceType}</div>
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
                                                    <Badge className="bg-green-500">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Revoked</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
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
                                                                Revoke
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedSession(session)
                                                                    setRevokeAllDialogOpen(true)
                                                                }}
                                                            >
                                                                Revoke All
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
                                                    <Badge className="bg-green-500 shrink-0">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="shrink-0">Revoked</Badge>
                                                )}
                                            </div>

                                            {/* Device Info */}
                                            <div className="space-y-2 pt-2 border-t">
                                                <div className="flex items-center gap-2">
                                                    {getDeviceIcon(session.deviceType)}
                                                    <div>
                                                        <p className="text-sm font-medium capitalize">{session.deviceType}</p>
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
                                                    <p className="text-xs text-muted-foreground">Last Activity</p>
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
                                                        Revoke
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
                                                        Revoke All
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
                                    Showing {sessions.length} of {total} sessions
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={sessions.length < 50}
                                    >
                                        Next
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
                        <DialogTitle>Revoke Session</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke this session? The user will be logged out from this device.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSession && (
                        <div className="space-y-2 py-4">
                            <div><strong>User:</strong> {selectedSession.userName}</div>
                            <div><strong>Device:</strong> {selectedSession.deviceType}</div>
                            <div><strong>Browser:</strong> {selectedSession.browser}</div>
                            <div><strong>IP:</strong> {selectedSession.ipAddress}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeDialogOpen(false)} disabled={revoking}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeSession} disabled={revoking}>
                            {revoking ? "Revoking..." : "Revoke Session"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke All Sessions Dialog */}
            <Dialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke All Sessions</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke ALL sessions for this user? They will be logged out from all devices.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSession && (
                        <div className="space-y-2 py-4">
                            <div className="flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Warning: This action affects all active sessions</span>
                            </div>
                            <div><strong>User:</strong> {selectedSession.userName}</div>
                            <div><strong>Email:</strong> {selectedSession.userEmail}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevokeAllDialogOpen(false)} disabled={revoking}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedSession && handleRevokeAllSessions(selectedSession.userId)}
                            disabled={revoking}
                        >
                            {revoking ? "Revoking..." : "Revoke All Sessions"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
