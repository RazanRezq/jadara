"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRoleColor, type SessionPayload } from "@/lib/auth"
import { logoutAction } from "@/app/(auth)/login/actions"
import { useTranslate } from "@/hooks/useTranslate"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { LogOut, Menu, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
    user: SessionPayload
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const router = useRouter()
    const { t } = useTranslate()

    async function handleLogout() {
        await logoutAction()
        router.push("/login")
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl px-6">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-400 hover:text-white"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Search or breadcrumb area */}
            <div className="flex-1">
                {/* Can add search or breadcrumbs here */}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Notifications */}
                <NotificationsDropdown userId={user.userId} />

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-3 h-auto px-3 py-2 hover:bg-white/5"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block text-start">
                                <p className="text-sm font-medium text-white">
                                    {user.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {user.email}
                                </p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 bg-[#16161d] border-white/10 text-white"
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.email}</p>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium w-fit",
                                    getRoleColor(user.role)
                                )}>
                                    {t(`roles.${user.role}`)}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5 cursor-pointer">
                            <User className="h-4 w-4 me-2" />
                            {t("header.profile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-white/5 cursor-pointer">
                            <Settings className="h-4 w-4 me-2" />
                            {t("header.settings")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                        >
                            <LogOut className="h-4 w-4 me-2" />
                            {t("header.logout")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
