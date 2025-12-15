"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarIcon } from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { useTranslate } from "@/hooks/useTranslate"

export function SiteHeader() {
    const { toggleSidebar } = useSidebar()
    const { t, isRTL } = useTranslate()
    const pathname = usePathname()

    // Generate breadcrumbs from pathname
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = "/" + pathSegments.slice(0, index + 1).join("/")
        const isLast = index === pathSegments.length - 1
        
        // Try multiple translation keys in order of preference
        const translationKeys = [
            `breadcrumb.${segment}`,  // Breadcrumb-specific translations
            `sidebar.${segment}`,     // Sidebar translations
            `settings.${segment}.title`, // Settings section titles
        ]
        
        let translatedName = segment.charAt(0).toUpperCase() + segment.slice(1) // Default fallback
        
        for (const key of translationKeys) {
            const translation = t(key)
            if (translation !== key) {
                translatedName = translation
                break
            }
        }
        
        return { href, name: translatedName, isLast }
    })

    return (
        <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
            <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
                <Button
                    className="h-8 w-8"
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                >
                    <SidebarIcon />
                </Button>
                <Separator orientation="vertical" className={isRTL ? "ml-2" : "mr-2"} />
                <Breadcrumb className="hidden sm:block">
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.href}>
                                {index > 0 && <BreadcrumbSeparator />}
                                <BreadcrumbItem>
                                    {crumb.isLast ? (
                                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={crumb.href}>
                                            {crumb.name}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
                <div className={`flex items-center gap-2 ${isRTL ? "mr-auto" : "ml-auto"}`}>
                    <ThemeToggle />
                    <LanguageSwitcher />
                </div>
            </div>
        </header>
    )
}
