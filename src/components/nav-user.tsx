"use client"

import { useRouter } from "next/navigation"
import {
    ChevronsUpDown,
    LogOut,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useTranslate } from "@/hooks/useTranslate"
import { type UserRole } from "@/lib/auth"
import { getRoleColor } from "@/lib/authClient"
import { logoutAction } from "@/app/(auth)/login/actions"
import { cn } from "@/lib/utils"

interface NavUserProps {
    user: {
        name: string
        email: string
        role: UserRole
    }
}

export function NavUser({ user }: NavUserProps) {
    const { isMobile } = useSidebar()
    const { t, isRTL } = useTranslate()
    const router = useRouter()

    async function handleLogout() {
        await logoutAction()
        router.push("/login")
        router.refresh()
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="border-t border-border/50"
                        >
                            <Avatar className="h-9 w-9 rounded-xl border-2 border-border">
                                <AvatarFallback className="rounded-xl bg-transparent text-foreground font-bold text-base">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-start text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span
                                    className={cn(
                                        "truncate text-xs px-2 py-0.5 rounded-md w-fit font-medium border",
                                        getRoleColor(user.role)
                                    )}
                                >
                                    {t(`roles.${user.role}`)}
                                </span>
                            </div>
                            <ChevronsUpDown className="size-4 ms-auto text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : isRTL ? "left" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2 text-start text-sm">
                                <Avatar className="h-9 w-9 rounded-xl border-2 border-border">
                                    <AvatarFallback className="rounded-xl bg-transparent text-foreground font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut />
                            <span>{t("header.logout")}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
