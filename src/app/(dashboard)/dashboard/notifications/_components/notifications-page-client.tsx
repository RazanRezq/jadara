"use client"

import { useState, useEffect } from "react"
import { useTranslate } from "@/hooks/useTranslate"
import { Search, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
    _id: string
    type: string
    priority: "low" | "medium" | "high" | "urgent"
    title: string
    message: string
    titleKey?: string
    messageKey?: string
    params?: Record<string, any>
    actionUrl?: string
    isRead: boolean
    createdAt: Date
}

interface NotificationsPageClientProps {
    userId: string
}

export function NotificationsPageClient({ userId }: NotificationsPageClientProps) {
    const { t, locale, dir, isRTL } = useTranslate()
    const dateLocale = locale === "ar" ? ar : enUS

    // State management
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // Filters
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    // Fetch notifications with filters
    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                userId,
                page: String(currentPage),
                limit: String(itemsPerPage),
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(typeFilter !== "all" && { type: typeFilter }),
                ...(priorityFilter !== "all" && { priority: priorityFilter }),
                ...(searchQuery && { search: searchQuery }),
            })

            const response = await fetch(`/api/notifications?${params}`)
            const result = await response.json()

            if (result.success) {
                setNotifications(result.data.notifications)
                setTotalCount(result.data.total)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [currentPage, statusFilter, typeFilter, priorityFilter, searchQuery])

    // Helper for localized text
    const getLocalizedText = (
        notification: Notification,
        field: 'title' | 'message'
    ): string => {
        const key = field === 'title' ? notification.titleKey : notification.messageKey
        if (key) {
            return t(key, notification.params || {})
        }
        return notification[field]
    }

    // Actions
    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: "PATCH",
            })
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
                )
            }
        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`/api/notifications/read-all?userId=${userId}`, {
                method: "PATCH",
            })
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            }
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: "DELETE",
            })
            if (response.ok) {
                setNotifications(prev => prev.filter(n => n._id !== notificationId))
                setTotalCount(prev => prev - 1)
            }
        } catch (error) {
            console.error("Error deleting notification:", error)
        }
    }

    const deleteReadNotifications = async () => {
        try {
            const response = await fetch(`/api/notifications/delete-read?userId=${userId}`, {
                method: "DELETE",
            })
            if (response.ok) {
                fetchNotifications()
            }
        } catch (error) {
            console.error("Error deleting read notifications:", error)
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "bg-red-500"
            case "high": return "bg-white dark:bg-gray-300"
            case "medium": return "bg-blue-500"
            case "low": return "bg-gray-500"
            default: return "bg-gray-500"
        }
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const startItem = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0
    const endItem = Math.min(currentPage * itemsPerPage, totalCount)

    return (
        <div className="p-6 space-y-6" dir={dir}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <PageHeader
                    titleKey="notifications.page.title"
                    subtitle={totalCount > 0 ?
                        `${t("notifications.page.showing")} ${startItem} ${t("notifications.page.to")} ${endItem} ${t("notifications.page.of")} ${totalCount} ${t("notifications.page.notifications")}`
                        : t("notifications.noNotifications")
                    }
                    className="px-0 pt-0 pb-0"
                />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={markAllAsRead}>
                        <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {t("notifications.markAllRead")}
                    </Button>
                    <Button variant="destructive" onClick={deleteReadNotifications}>
                        <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                        {t("notifications.page.deleteRead")}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <Input
                            placeholder={t("notifications.page.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(isRTL ? "pr-10 text-right" : "pl-10")}
                        />
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t("notifications.page.filterByStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("notifications.page.statusAll")}</SelectItem>
                            <SelectItem value="unread">{t("notifications.page.statusUnread")}</SelectItem>
                            <SelectItem value="read">{t("notifications.page.statusRead")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t("notifications.page.filterByType")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("notifications.page.typeAll")}</SelectItem>
                            <SelectItem value="new_applicant">{t("notifications.types.new_applicant.title")}</SelectItem>
                            <SelectItem value="review_assigned">{t("notifications.types.review_assigned.title")}</SelectItem>
                            <SelectItem value="review_completed">{t("notifications.types.review_completed.title")}</SelectItem>
                            <SelectItem value="comment_added">{t("notifications.types.comment_added.title")}</SelectItem>
                            <SelectItem value="applicant_hired">{t("notifications.types.applicant_hired.title")}</SelectItem>
                            <SelectItem value="job_expired">{t("notifications.types.job_expired.title")}</SelectItem>
                            <SelectItem value="system_alert">{t("notifications.types.system_alert.title")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Priority Filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t("notifications.page.filterByPriority")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("notifications.page.priorityAll")}</SelectItem>
                            <SelectItem value="urgent">{t("notifications.priority.urgent")}</SelectItem>
                            <SelectItem value="high">{t("notifications.priority.high")}</SelectItem>
                            <SelectItem value="medium">{t("notifications.priority.medium")}</SelectItem>
                            <SelectItem value="low">{t("notifications.priority.low")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Notifications List */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {t("common.loading")}
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold mb-2">
                            {t("notifications.page.emptyState")}
                        </h3>
                        <p className="text-muted-foreground">
                            {t("notifications.page.emptyStateDescription")}
                        </p>
                    </Card>
                ) : (
                    notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            className={cn(
                                "p-4 transition-colors hover:bg-muted/50",
                                !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                {/* Priority Indicator */}
                                <div
                                    className={cn(
                                        "w-3 h-3 rounded-full mt-1 flex-shrink-0",
                                        getPriorityColor(notification.priority)
                                    )}
                                />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className={cn(
                                                "font-semibold text-base mb-1",
                                                isRTL && "text-right"
                                            )}>
                                                {getLocalizedText(notification, 'title')}
                                            </h3>
                                            <p className={cn(
                                                "text-sm text-muted-foreground",
                                                isRTL && "text-right"
                                            )}>
                                                {getLocalizedText(notification, 'message')}
                                            </p>
                                            {notification.actionUrl && (
                                                <Link
                                                    href={notification.actionUrl}
                                                    className="text-sm text-primary hover:underline mt-2 inline-block"
                                                    onClick={() => markAsRead(notification._id)}
                                                >
                                                    {t("notifications.viewDetails")} →
                                                </Link>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge variant="outline">
                                                {t(`notifications.priority.${notification.priority}`)}
                                            </Badge>
                                            {!notification.isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => markAsRead(notification._id)}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteNotification(notification._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <p className={cn(
                                        "text-xs text-muted-foreground mt-2",
                                        isRTL && "text-right"
                                    )}>
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: dateLocale,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {t("common.page")} {currentPage} {t("common.of")} {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            {t("common.previous")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t("common.next")}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
