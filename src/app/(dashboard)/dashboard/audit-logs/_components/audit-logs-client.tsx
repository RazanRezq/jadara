"use client"

import { useState, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Search, Filter, Download, Eye, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface AuditLog {
    _id: string
    userId: string
    userEmail: string
    userName: string
    userRole: string
    action: string
    resource: string
    resourceId?: string
    resourceName?: string
    description: string
    metadata?: Record<string, any>
    changes?: {
        before?: Record<string, any>
        after?: Record<string, any>
    }
    severity: 'info' | 'warning' | 'error' | 'critical'
    ipAddress?: string
    userAgent?: string
    timestamp: string
}

export function AuditLogsClient() {
    const { t } = useTranslate()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    // Pagination
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // Filters
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState<string>("")
    const [resourceFilter, setResourceFilter] = useState<string>("")
    const [severityFilter, setSeverityFilter] = useState<string>("")
    const [userRoleFilter, setUserRoleFilter] = useState<string>("")

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "50",
            })

            if (search) params.append("search", search)
            if (actionFilter) params.append("action", actionFilter)
            if (resourceFilter) params.append("resource", resourceFilter)
            if (severityFilter) params.append("severity", severityFilter)
            if (userRoleFilter) params.append("userRole", userRoleFilter)

            const response = await fetch(`/api/audit-logs?${params}`)
            const result = await response.json()

            if (result.success) {
                setLogs(result.data.logs)
                setTotal(result.data.pagination.total)
                setTotalPages(result.data.pagination.totalPages)
            } else {
                toast.error("Failed to fetch audit logs")
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error)
            toast.error("Error loading audit logs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [page, search, actionFilter, resourceFilter, severityFilter, userRoleFilter])

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log)
        setDetailsOpen(true)
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'info':
                return <Info className="h-4 w-4 text-blue-500" />
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-orange-500" />
            case 'critical':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Info className="h-4 w-4 text-gray-500" />
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'info':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            case 'error':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
            case 'critical':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        }
    }

    const clearFilters = () => {
        setSearch("")
        setActionFilter("")
        setResourceFilter("")
        setSeverityFilter("")
        setUserRoleFilter("")
        setPage(1)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("auditLogs.title")}</h1>
                <p className="text-muted-foreground">
                    {t("auditLogs.subtitle")}
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        {t("auditLogs.filters")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute top-3 start-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("auditLogs.searchPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-9"
                            />
                        </div>

                        {/* Severity Filter */}
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("auditLogs.severity")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")} {t("auditLogs.severity")}</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Resource Filter */}
                        <Select value={resourceFilter} onValueChange={setResourceFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("auditLogs.resource")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")} {t("auditLogs.resource")}</SelectItem>
                                <SelectItem value="User">User</SelectItem>
                                <SelectItem value="Job">Job</SelectItem>
                                <SelectItem value="Applicant">Applicant</SelectItem>
                                <SelectItem value="Evaluation">Evaluation</SelectItem>
                                <SelectItem value="System">System</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* User Role Filter */}
                        <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("auditLogs.userRole")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")} {t("common.role")}</SelectItem>
                                <SelectItem value="superadmin">{t("roles.superadmin")}</SelectItem>
                                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                                <SelectItem value="reviewer">{t("roles.reviewer")}</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        <Button variant="outline" onClick={clearFilters}>
                            {t("auditLogs.clearFilters")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("auditLogs.activityLog")}</CardTitle>
                            <CardDescription>
                                {total} {t("auditLogs.totalEntries")}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 me-2" />
                            {t("auditLogs.export")}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("auditLogs.noLogsFound")}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-start">{t("auditLogs.timestamp")}</TableHead>
                                        <TableHead className="text-start">{t("auditLogs.user")}</TableHead>
                                        <TableHead className="text-start">{t("auditLogs.action")}</TableHead>
                                        <TableHead className="text-start">{t("auditLogs.resource")}</TableHead>
                                        <TableHead className="text-start">{t("auditLogs.severity")}</TableHead>
                                        <TableHead className="text-start">{t("auditLogs.details")}</TableHead>
                                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-mono text-xs">
                                                {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{log.userName}</div>
                                                    <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.userRole}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.action}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{log.resource}</div>
                                                    {log.resourceName && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {log.resourceName}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getSeverityColor(log.severity)}>
                                                    <span className="flex items-center gap-1">
                                                        {getSeverityIcon(log.severity)}
                                                        {log.severity}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">
                                                {log.description}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
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
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this audit log entry
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                                    <div className="font-mono text-sm">
                                        {format(new Date(selectedLog.timestamp), "yyyy-MM-dd HH:mm:ss")}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Severity</div>
                                    <Badge className={getSeverityColor(selectedLog.severity)}>
                                        {selectedLog.severity}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">User</div>
                                    <div>{selectedLog.userName}</div>
                                    <div className="text-xs text-muted-foreground">{selectedLog.userEmail}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">User Role</div>
                                    <Badge variant="outline">{selectedLog.userRole}</Badge>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Action</div>
                                    <div className="font-mono text-sm">{selectedLog.action}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Resource</div>
                                    <div>{selectedLog.resource}</div>
                                    {selectedLog.resourceName && (
                                        <div className="text-xs text-muted-foreground">{selectedLog.resourceName}</div>
                                    )}
                                </div>
                                {selectedLog.ipAddress && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">IP Address</div>
                                        <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                                <div className="p-3 bg-muted rounded-md">{selectedLog.description}</div>
                            </div>

                            {selectedLog.changes && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">Changes</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedLog.changes.before && (
                                            <div>
                                                <div className="text-xs font-medium mb-1">Before</div>
                                                <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                                    {JSON.stringify(selectedLog.changes.before, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {selectedLog.changes.after && (
                                            <div>
                                                <div className="text-xs font-medium mb-1">After</div>
                                                <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                                    {JSON.stringify(selectedLog.changes.after, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">Metadata</div>
                                    <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.userAgent && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">User Agent</div>
                                    <div className="p-3 bg-muted rounded-md text-xs break-all">
                                        {selectedLog.userAgent}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
