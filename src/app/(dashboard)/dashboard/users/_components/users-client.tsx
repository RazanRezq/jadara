"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { type UserRole } from "@/lib/auth"
import { getRoleColor, hasPermission } from "@/lib/authClient"
import { useTranslate } from "@/hooks/useTranslate"
import { cn } from "@/lib/utils"
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Shield,
    UserCheck,
    UserX,
    RefreshCw,
    Upload,
    Download,
} from "lucide-react"
import { AddUserDialog } from "./add-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { BulkImportDialog } from "./bulk-import-dialog"
import { toast } from "sonner"

interface User {
    id: string
    email: string
    name: string
    role: UserRole
    avatar?: string
    isActive: boolean
    lastLogin?: string
    createdAt: string
}

interface UsersClientProps {
    currentUserRole: UserRole
}

export function UsersClient({ currentUserRole }: UsersClientProps) {
    const { t, locale } = useTranslate()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Dialog states
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            })
            if (searchTerm) params.append("search", searchTerm)
            if (roleFilter && roleFilter !== "all") params.append("role", roleFilter)

            const response = await fetch(`/api/users/list?${params}`)
            const data = await response.json()

            if (data.success) {
                setUsers(data.users)
                setTotalPages(data.pagination.totalPages)
                setTotal(data.pagination.total)
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error(t("common.loading"))
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, roleFilter, t])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPage(1)
    }

    const handleRoleFilter = (value: string) => {
        setRoleFilter(value)
        setPage(1)
    }

    const handleEditUser = (user: User) => {
        setSelectedUser(user)
        setEditDialogOpen(true)
    }

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user)
        setDeleteDialogOpen(true)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return t("users.never")
        return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    }

    const handleExport = async () => {
        try {
            const params = new URLSearchParams()
            if (roleFilter && roleFilter !== "all") params.append("role", roleFilter)

            const response = await fetch(`/api/users/export?${params}`)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Users exported successfully")
        } catch (error) {
            console.error("Export failed:", error)
            toast.error("Failed to export users")
        }
    }

    return (
        <div className="dashboard-container space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t("users.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("users.subtitle")}
                    </p>
                </div>
            </div>

            {/* Filters and Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("users.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="ps-10"
                    />
                </div>

                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={handleRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t("users.filterByRole")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t("users.allRoles")}
                        </SelectItem>
                        <SelectItem value="superadmin">
                            {t("roles.superadmin")}
                        </SelectItem>
                        <SelectItem value="admin">
                            {t("roles.admin")}
                        </SelectItem>
                        <SelectItem value="reviewer">
                            {t("roles.reviewer")}
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>

                {hasPermission(currentUserRole, "admin") && (
                    <>
                        {/* Export Button */}
                        <Button
                            variant="outline"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4 me-2" />
                            Export
                        </Button>

                        {/* Bulk Import Button */}
                        <Button
                            variant="outline"
                            onClick={() => setBulkImportDialogOpen(true)}
                        >
                            <Upload className="h-4 w-4 me-2" />
                            Import
                        </Button>

                        {/* Add User Button */}
                        <Button
                            onClick={() => setAddDialogOpen(true)}
                            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                        >
                            <Plus className="h-4 w-4 me-2" />
                            {t("users.addUser")}
                        </Button>
                    </>
                )}
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Spinner className="h-8 w-8 text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Shield className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">{t("users.noUsersFound")}</p>
                            <p className="text-sm">{t("users.tryAdjusting")}</p>
                        </div>
                    ) : (
                        <>
                        {/* Desktop Table View - hidden on mobile */}
                        <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-start">{t("users.user")}</TableHead>
                                    <TableHead className="text-start">{t("common.role")}</TableHead>
                                    <TableHead className="text-start">{t("common.status")}</TableHead>
                                    <TableHead className="text-start">{t("users.lastLogin")}</TableHead>
                                    <TableHead className="text-start">{t("users.joined")}</TableHead>
                                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-muted-foreground text-sm">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("border-0", getRoleColor(user.role))}>
                                                {t(`roles.${user.role}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                    <UserCheck className="h-4 w-4" />
                                                    {t("common.active")}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                                    <UserX className="h-4 w-4" />
                                                    {t("common.inactive")}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(user.lastLogin)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(user.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleEditUser(user)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Pencil className="h-4 w-4 me-2" />
                                                        {t("common.edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4 me-2" />
                                                        {t("common.delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>

                        {/* Mobile Card View - shown on mobile only */}
                        <div className="md:hidden p-4 space-y-3">
                            {users.map((user) => (
                                <Card key={user.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
                                    <CardContent className="p-4 space-y-3">
                                        {/* Header with avatar and name */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold shrink-0">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-semibold text-base truncate">{user.name}</h4>
                                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn("border-0 shrink-0", getRoleColor(user.role))}>
                                                {t(`roles.${user.role}`)}
                                            </Badge>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                            {/* Status */}
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">{t("common.status")}</p>
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                                                        <UserCheck className="h-4 w-4" />
                                                        {t("common.active")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                                                        <UserX className="h-4 w-4" />
                                                        {t("common.inactive")}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Last Login */}
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">{t("users.lastLogin")}</p>
                                                <p className="text-sm">{formatDate(user.lastLogin)}</p>
                                            </div>

                                            {/* Joined */}
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground mb-1">{t("users.joined")}</p>
                                                <p className="text-sm">{formatDate(user.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex justify-end gap-2 pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditUser(user)}
                                            >
                                                <Pencil className="h-4 w-4 me-2" />
                                                {t("common.edit")}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 me-2" />
                                                {t("common.delete")}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                {t("common.showing")} {users.length} {t("common.of")} {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    {t("common.previous")}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    {t("common.page")} {page} {t("common.of")} {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    {t("common.next")}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddUserDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={fetchUsers}
                currentUserRole={currentUserRole}
            />

            <BulkImportDialog
                open={bulkImportDialogOpen}
                onOpenChange={setBulkImportDialogOpen}
                onSuccess={fetchUsers}
            />

            {selectedUser && (
                <>
                    <EditUserDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        user={selectedUser}
                        onSuccess={fetchUsers}
                        currentUserRole={currentUserRole}
                    />
                    <DeleteUserDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                        user={selectedUser}
                        onSuccess={fetchUsers}
                    />
                </>
            )}
        </div>
    )
}
