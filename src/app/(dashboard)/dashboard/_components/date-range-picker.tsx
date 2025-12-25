"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useTranslate } from "@/hooks/useTranslate"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateRange {
    from: Date
    to: Date
}

interface DateRangePickerProps {
    dateRange: DateRange
    onDateRangeChange: (range: DateRange) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const { t, locale } = useTranslate()
    const dateLocale = locale === "ar" ? ar : enUS

    const presets = [
        {
            label: t("dashboard.filters.last7Days"),
            getValue: () => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 7)
                return { from, to }
            },
        },
        {
            label: t("dashboard.filters.last30Days"),
            getValue: () => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 30)
                return { from, to }
            },
        },
        {
            label: t("dashboard.filters.last90Days"),
            getValue: () => {
                const to = new Date()
                const from = new Date()
                from.setDate(from.getDate() - 90)
                return { from, to }
            },
        },
        {
            label: t("dashboard.filters.thisMonth"),
            getValue: () => {
                const now = new Date()
                const from = new Date(now.getFullYear(), now.getMonth(), 1)
                const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                return { from, to }
            },
        },
        {
            label: t("dashboard.filters.lastMonth"),
            getValue: () => {
                const now = new Date()
                const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const to = new Date(now.getFullYear(), now.getMonth(), 0)
                return { from, to }
            },
        },
    ]

    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to ? (
                            <>
                                {format(dateRange.from, "PPP", { locale: dateLocale })} -{" "}
                                {format(dateRange.to, "PPP", { locale: dateLocale })}
                            </>
                        ) : (
                            <span>{t("dashboard.filters.selectDateRange")}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        <div className="border-r p-3 space-y-2">
                            <div className="text-sm font-medium mb-2">
                                {t("dashboard.filters.presets")}
                            </div>
                            {presets.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => onDateRangeChange(preset.getValue())}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <CalendarComponent
                            mode="range"
                            selected={{ from: dateRange.from, to: dateRange.to }}
                            onSelect={(range) => {
                                if (range?.from && range?.to) {
                                    onDateRangeChange({ from: range.from, to: range.to })
                                }
                            }}
                            numberOfMonths={2}
                            locale={dateLocale}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
