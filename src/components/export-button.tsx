"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslate } from "@/hooks/useTranslate"
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"
import { toast } from "sonner"

interface ExportButtonProps {
    data: {
        headers: string[]
        rows: (string | number)[][]
        filename: string
    }
    variant?: "default" | "outline" | "ghost"
    size?: "default" | "sm" | "lg"
}

export function ExportButton({ data, variant = "outline", size = "default" }: ExportButtonProps) {
    const { t } = useTranslate()
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async (format: "csv" | "excel" | "pdf") => {
        setIsExporting(true)

        try {
            switch (format) {
                case "csv":
                    exportToCSV(data)
                    toast.success(t("export.success"), {
                        description: t("export.csvDownloaded"),
                    })
                    break
                case "excel":
                    exportToExcel(data)
                    toast.success(t("export.success"), {
                        description: t("export.excelDownloaded"),
                    })
                    break
                case "pdf":
                    await exportToPDF(data)
                    toast.success(t("export.success"), {
                        description: t("export.pdfDownloaded"),
                    })
                    break
            }
        } catch (error) {
            console.error("Export error:", error)
            toast.error(t("export.error"), {
                description: t("export.failed"),
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} disabled={isExporting}>
                    <Download className="w-4 h-4 me-2" />
                    {isExporting ? t("export.exporting") : t("export.export")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="w-4 h-4 me-2" />
                    {t("export.exportCSV")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileSpreadsheet className="w-4 h-4 me-2" />
                    {t("export.exportExcel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileType className="w-4 h-4 me-2" />
                    {t("export.exportPDF")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
