"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslate } from "@/hooks/useTranslate"
import { Users, Briefcase, Activity, Plus, Edit, UserX } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getRoleColor } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"

interface SuperAdminStats {
    totalUsers: number
    totalJobs: number
    systemHealth: "healthy" | "warning" | "critical"
    users: Array<{
        _id: string
        name: string
        email: string
        role: UserRole
        isActive: boolean
        lastLogin?: Date
    }>
}

interface SuperAdminViewProps {
    stats: SuperAdminStats
}

export function SuperAdminView({ stats }: SuperAdminViewProps) {
    const { t } = useTranslate()

    const getHealthColor = (health: string) => {
        switch (health) {
            case "healthy":
                return "from-emerald-500 to-green-500"
            case "warning":
                return "from-amber-500 to-orange-500"
            case "critical":
                return "from-red-500 to-rose-500"
            default:
                return "from-gray-500 to-slate-500"
        }
    }

    const getHealthText = (health: string) => {
        switch (health) {
            case "healthy":
                return t("dashboard.superAdmin.systemHealthy")
            case "warning":
                return t("dashboard.superAdmin.systemWarning")
            case "critical":
                return t("dashboard.superAdmin.systemCritical")
            default:
                return t("dashboard.superAdmin.systemUnknown")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("dashboard.superAdmin.title")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("dashboard.superAdmin.subtitle")}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.superAdmin.totalUsers")}
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("dashboard.superAdmin.registeredUsers")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.superAdmin.totalJobs")}
                        </CardTitle>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("dashboard.superAdmin.systemWide")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t("dashboard.superAdmin.systemHealth")}
                        </CardTitle>
                        <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getHealthColor(
                                stats.systemHealth
                            )} flex items-center justify-center shadow-lg`}
                        >
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{getHealthText(stats.systemHealth)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("dashboard.superAdmin.allSystemsOperational")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* User Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("dashboard.superAdmin.userManagement")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.superAdmin.userManagementDesc")}
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/users">
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t("dashboard.superAdmin.createNewUser")}
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-lg font-medium">{t("dashboard.superAdmin.noUsers")}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("dashboard.superAdmin.createFirstUser")}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("common.name")}</TableHead>
                                        <TableHead>{t("common.email")}</TableHead>
                                        <TableHead>{t("common.role")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>{t("users.lastLogin")}</TableHead>
                                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(
                                                        user.role
                                                    )}`}
                                                >
                                                    {t(`roles.${user.role}`)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.isActive ? (
                                                    <Badge variant="default" className="bg-emerald-500">
                                                        {t("common.active")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {t("common.inactive")}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLogin
                                                    ? new Date(user.lastLogin).toLocaleDateString()
                                                    : t("users.never")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/dashboard/users/${user._id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="sm" className="text-red-500">
                                                        <UserX className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
