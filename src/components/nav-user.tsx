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
import { getRoleColor, type UserRole } from "@/lib/auth"
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
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500">
                                <AvatarFallback className="rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-white font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-start text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className={cn(
                                    "truncate text-xs px-1.5 py-0.5 rounded w-fit",
                                    getRoleColor(user.role)
                                )}>
                                    {t(`roles.${user.role}`)}
                                </span>
                            </div>
                            <ChevronsUpDown className={cn("size-4", isRTL ? "mr-auto" : "ml-auto")} />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : isRTL ? "left" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                                <Avatar className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500">
                                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 text-white font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-start text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut />
                            {t("header.logout")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
