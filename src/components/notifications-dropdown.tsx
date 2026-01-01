"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useTranslate } from "@/hooks/useTranslate"
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

// Helper to get localized notification text
function getLocalizedText(
    notification: Notification,
    field: 'title' | 'message',
    t: (key: string, params?: Record<string, string | number>) => string
): string {
    const key = field === 'title' ? notification.titleKey : notification.messageKey

    // Use translation key if available
    if (key) {
        return t(key, notification.params || {})
    }

    // Fallback to legacy title/message for backward compatibility
    return notification[field]
}

interface NotificationsDropdownProps {
    userId: string
}

export function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
    const { t, locale, dir, isRTL } = useTranslate()
    const dateLocale = locale === "ar" ? ar : enUS
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = useCallback(async () => {
        // Skip if userId is not provided
        if (!userId) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/notifications?userId=${userId}&limit=10`)

            if (!response.ok) {
                console.error(`Error fetching notifications: ${response.status} ${response.statusText}`)
                setIsLoading(false)
                return
            }

            const result = await response.json()

            if (result.success) {
                setNotifications(result.data.notifications)
                setUnreadCount(result.data.unreadCount)
            } else {
                console.error("Error fetching notifications:", result.error)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (userId) {
            fetchNotifications()
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000)
            return () => clearInterval(interval)
        }
    }, [userId, fetchNotifications])

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: "PATCH",
            })

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif._id === notificationId ? { ...notif, isRead: true } : notif
                    )
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`/api/notifications/read-all?userId=${userId}`, {
                method: "PATCH",
            })

            if (response.ok) {
                setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error)
        }
    }

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: "DELETE",
            })

            if (response.ok) {
                setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId))
                const deletedNotif = notifications.find((n) => n._id === notificationId)
                if (deletedNotif && !deletedNotif.isRead) {
                    setUnreadCount((prev) => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error("Error deleting notification:", error)
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent":
                return "bg-red-500"
            case "high":
                return "bg-white dark:bg-gray-300"
            case "medium":
                return "bg-blue-500"
            case "low":
                return "bg-gray-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 end-[-4px] h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">{t("notifications.title")}</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                        >
                            <Check className="w-3 h-3 me-1" />
                            {t("notifications.markAllRead")}
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t("common.loading")}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            {t("notifications.noNotifications")}
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={cn(
                                    "p-4 border-b hover:bg-muted/50 transition-colors group",
                                    !notification.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full mt-2",
                                            getPriorityColor(notification.priority)
                                        )}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn("font-medium text-sm", isRTL && "text-right")}>
                                                {getLocalizedText(notification, 'title', t)}
                                            </p>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => markAsRead(notification._id)}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() =>
                                                        deleteNotification(notification._id)
                                                    }
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className={cn("text-sm text-muted-foreground mt-1", isRTL && "text-right")}>
                                            {getLocalizedText(notification, 'message', t)}
                                        </p>
                                        {notification.actionUrl && (
                                            <Link
                                                href={notification.actionUrl}
                                                className="text-xs text-primary hover:underline mt-2 inline-block"
                                                onClick={() => {
                                                    markAsRead(notification._id)
                                                    setIsOpen(false)
                                                }}
                                            >
                                                {t("notifications.viewDetails")}
                                            </Link>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: dateLocale,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Link href="/dashboard/notifications">
                            <Button variant="ghost" className="w-full" size="sm">
                                {t("notifications.viewAll")}
                            </Button>
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
