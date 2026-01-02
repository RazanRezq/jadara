/**
 * Export Utilities for Dashboard Data
 * Supports CSV, Excel, and PDF export as per CORE_PRD.md requirements
 */

interface ExportData {
    headers: string[]
    rows: (string | number)[][]
    filename: string
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData) {
    const { headers, rows, filename } = data

    // Create CSV content
    const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
            row
                .map((cell) => {
                    // Handle cells with commas or quotes
                    const cellStr = String(cell)
                    if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                        return `"${cellStr.replace(/"/g, '""')}"`
                    }
                    return cellStr
                })
                .join(",")
        ),
    ].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export data to Excel format (using HTML table method)
 */
export function exportToExcel(data: ExportData) {
    const { headers, rows, filename } = data

    // Create HTML table
    const htmlTable = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4CAF50; color: white; font-weight: bold; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
                </thead>
                <tbody>
                    ${rows
                        .map(
                            (row) =>
                                `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join("")}</tr>`
                        )
                        .join("")}
                </tbody>
            </table>
        </body>
        </html>
    `

    // Create blob and download
    const blob = new Blob([htmlTable], {
        type: "application/vnd.ms-excel;charset=utf-8;",
    })
    downloadBlob(blob, `${filename}.xls`)
}

/**
 * Export data to PDF format (using jsPDF)
 */
export async function exportToPDF(data: ExportData) {
    const { headers, rows, filename } = data

    // Dynamically import jsPDF to reduce bundle size
    const { default: jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text(filename, 14, 15)

    // Add table
    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 25,
        theme: "grid",
        styles: {
            fontSize: 10,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [76, 175, 80],
            fontStyle: "bold",
        },
    })

    // Save PDF
    doc.save(`${filename}.pdf`)
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

/**
 * Format applicant data for export
 * Enhanced with AI Summary and Key Insights
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatApplicantsForExport(applicants: any[], includeAISummary = true) {
    const baseHeaders = [
        "Name",
        "Email",
        "Phone",
        "Job Title",
        "Status",
        "AI Score",
        "Experience (Years)",
        "Submitted Date",
    ]

    const aiHeaders = includeAISummary
        ? [
              "AI Summary",
              "Top Strengths",
              "Red Flags",
              "Recommendation",
          ]
        : []

    const headers = [...baseHeaders, ...aiHeaders]

    const rows = applicants.map((applicant) => {
        const baseData = [
            applicant.personalData?.name || "N/A",
            applicant.personalData?.email || "N/A",
            applicant.personalData?.phone || "N/A",
            applicant.jobTitle || "N/A",
            applicant.status || "N/A",
            applicant.aiScore || 0,
            applicant.personalData?.yearsOfExperience || 0,
            applicant.submittedAt
                ? new Date(applicant.submittedAt).toLocaleDateString()
                : "N/A",
        ]

        if (!includeAISummary) {
            return baseData
        }

        // Extract AI evaluation data
        const evaluation = applicant.evaluation

        // Handle bilingual fields - prefer English, fallback to Arabic
        const aiSummary = evaluation?.summary?.en || evaluation?.summary?.ar || evaluation?.summary || "No AI evaluation available"

        const topStrengths = evaluation?.strengths?.en?.slice(0, 3)
            .map((s: string) => `• ${s}`)
            .join("\n") ||
            evaluation?.strengths?.ar?.slice(0, 3)
            .map((s: string) => `• ${s}`)
            .join("\n") ||
            (Array.isArray(evaluation?.strengths)
                ? evaluation.strengths.slice(0, 3).map((s: string) => `• ${s}`).join("\n")
                : "N/A")

        const redFlags = (evaluation?.redFlags?.en && evaluation.redFlags.en.length > 0)
            ? evaluation.redFlags.en.map((r: string) => `⚠️ ${r}`).join("\n")
            : (evaluation?.redFlags?.ar && evaluation.redFlags.ar.length > 0)
            ? evaluation.redFlags.ar.map((r: string) => `⚠️ ${r}`).join("\n")
            : (Array.isArray(evaluation?.redFlags) && evaluation.redFlags.length > 0)
            ? evaluation.redFlags.map((r: string) => `⚠️ ${r}`).join("\n")
            : "None"

        const recommendation = evaluation?.recommendation?.en || evaluation?.recommendation?.ar || evaluation?.recommendation || "Pending review"

        const aiData = [aiSummary, topStrengths, redFlags, recommendation]

        return [...baseData, ...aiData]
    })

    return { headers, rows }
}

/**
 * Format dashboard stats for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDashboardStatsForExport(stats: any) {
    const headers = ["Metric", "Value"]

    const rows = [
        ["Action Required", stats.actionRequired || 0],
        ["Interviews Scheduled", stats.interviewsScheduled || 0],
        ["Total Hired", stats.totalHired || 0],
        ["Active Jobs", stats.activeJobs || 0],
    ]

    return { headers, rows }
}
