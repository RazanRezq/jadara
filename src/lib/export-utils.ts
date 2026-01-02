/**
 * Professional Export Utilities for Dashboard Data
 * Supports CSV (UTF-8 BOM), Excel (XLSX), and PDF export
 * @module export-utils
 */

import type { WorkSheet, WorkBook } from 'xlsx'

// ============================================================================
// Type Definitions
// ============================================================================

interface ExportData {
    headers: string[]
    rows: (string | number)[][]
    filename: string
}

interface ExportOptions {
    /** Include company branding in exports */
    includeBranding?: boolean
    /** Custom title for the export */
    title?: string
    /** Show generation timestamp */
    includeTimestamp?: boolean
    /** Language for export ('en' | 'ar' | 'both') - defaults to 'en' */
    language?: 'en' | 'ar' | 'both'
    /** Text direction ('ltr' | 'rtl') - auto-detected if not specified */
    direction?: 'ltr' | 'rtl'
}

// ============================================================================
// CSV Export (UTF-8 with BOM for Excel compatibility)
// ============================================================================

/**
 * Export data to CSV format with UTF-8 BOM
 * The BOM ensures proper character encoding in Excel
 */
export function exportToCSV(data: ExportData, options: ExportOptions = {}) {
    const { headers, rows, filename } = data
    const { includeTimestamp = true } = options

    // Build CSV content
    const csvRows: string[] = []

    // Add optional header with timestamp
    if (includeTimestamp) {
        csvRows.push(`"Generated: ${new Date().toLocaleString()}"`)
        csvRows.push('') // Empty line for spacing
    }

    // Add column headers
    csvRows.push(headers.map(escapeCSVValue).join(','))

    // Add data rows
    rows.forEach(row => {
        csvRows.push(row.map(escapeCSVValue).join(','))
    })

    const csvContent = csvRows.join('\r\n') // Use Windows line endings for better Excel compatibility

    // Add UTF-8 BOM for proper encoding in Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    downloadBlob(blob, `${filename}.csv`)
}

/**
 * Escape CSV cell values properly
 */
function escapeCSVValue(value: string | number): string {
    const str = String(value)

    // If the value contains comma, quote, newline, or starts with special chars, wrap in quotes
    if (
        str.includes(',') ||
        str.includes('"') ||
        str.includes('\n') ||
        str.includes('\r') ||
        /^[=+\-@]/.test(str) // Prevent CSV injection
    ) {
        // Escape quotes by doubling them
        return `"${str.replace(/"/g, '""')}"`
    }

    return str
}

// ============================================================================
// Excel Export (XLSX format using SheetJS)
// ============================================================================

/**
 * Export data to Excel XLSX format with professional styling
 * Enhanced with better column widths, alternating rows, and modern design
 */
export async function exportToExcel(data: ExportData, options: ExportOptions = {}) {
    const { headers, rows, filename } = data
    const { title = 'Export Report', includeTimestamp = true } = options

    // Dynamically import xlsx-js-style for styling support (row heights, cell styles)
    const XLSX = await import('xlsx-js-style')

    // Create workbook and worksheet
    const wb: WorkBook = XLSX.utils.book_new()

    // Prepare data with title and timestamp
    const wsData: (string | number)[][] = []

    // Add title row
    wsData.push([title])

    // Add timestamp and metadata
    if (includeTimestamp) {
        wsData.push([`Generated: ${new Date().toLocaleString()} | Total Records: ${rows.length}`])
    }

    // Add empty row for spacing
    wsData.push([])

    // Add headers
    wsData.push(headers)

    // Add data rows
    wsData.push(...rows)

    // Create worksheet from data
    const ws: WorkSheet = XLSX.utils.aoa_to_sheet(wsData)

    // Calculate column widths dynamically based on actual content length
    const colWidths = headers.map((header, i) => {
        const headerStr = String(header)

        // Calculate max content width in this column
        let maxWidth = headerStr.length

        // Check all rows to find the longest content
        rows.forEach(row => {
            const cellText = String(row[i] || '')

            // For very long text, we'll wrap it - estimate wrapped width
            if (cellText.length > 100) {
                // Find longest word or phrase for minimum width
                const words = cellText.split(' ')
                const longestWord = Math.max(...words.map(w => w.length))
                // Use longer of: longest word or 50 chars (good wrapping width)
                maxWidth = Math.max(maxWidth, Math.min(longestWord + 10, 60))
            } else {
                // For shorter text, use actual length
                maxWidth = Math.max(maxWidth, cellText.length)
            }
        })

        // Add small padding
        const width = maxWidth + 2

        // Set reasonable bounds (10-80 characters)
        return { wch: Math.min(Math.max(width, 10), 80) }
    })

    ws['!cols'] = colWidths

    // Set row heights with dynamic calculation for multi-line content
    const rowHeights: any[] = [
        { hpt: 32 }, // Title row - taller
        { hpt: 22 }, // Timestamp row
        { hpt: 10 }, // Empty row
        { hpt: 28 }, // Header row - prominent
    ]

    // Data rows with dynamic height based on content and column width
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        let maxLines = 1

        // Check each cell in the row for line breaks or long content
        row.forEach((cell, colIdx) => {
            const cellText = String(cell || '')
            const colWidth = colWidths[colIdx]?.wch || 50

            // Count explicit newlines
            const newlineCount = (cellText.match(/\n/g) || []).length + 1

            // Only calculate wrapped lines if content exceeds column width
            let estimatedLines = 1
            if (cellText.length > colWidth) {
                // Estimate lines based on text length and column width
                estimatedLines = Math.ceil(cellText.length / colWidth)
            }

            // Use the maximum of newlines and estimated wrapped lines
            const cellLines = Math.max(newlineCount, Math.min(estimatedLines, 8)) // Cap at 8 lines

            maxLines = Math.max(maxLines, cellLines)
        })

        // Set row height: base 20pt + 14pt per additional line (readable)
        const rowHeight = maxLines === 1 ? 20 : 20 + (maxLines - 1) * 14
        rowHeights.push({ hpt: Math.min(rowHeight, 120) }) // Cap at 120pt for very long content
    }

    ws['!rows'] = rowHeights

    // Merge title and timestamp cells across all columns
    const titleRange = { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
    const timestampRange = { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
    ws['!merges'] = [titleRange, timestampRange]

    // Enhanced cell styling
    const headerRowIndex = includeTimestamp ? 3 : 2
    const dataStartRow = headerRowIndex + 1

    // Title cell (A1) - Bold green title
    if (ws['A1']) {
        ws['A1'].s = {
            font: { bold: true, sz: 20, color: { rgb: '4CAF50' }, name: 'Calibri' },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'F8F9FA' } }
        }
    }

    // Timestamp cell (A2) - Subtle gray
    if (ws['A2']) {
        ws['A2'].s = {
            font: { sz: 11, color: { rgb: '666666' }, name: 'Calibri' },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'F8F9FA' } }
        }
    }

    // Header row styling - Green background with white text
    headers.forEach((header, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIdx })
        if (ws[cellRef]) {
            ws[cellRef].s = {
                font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
                fill: { fgColor: { rgb: '4CAF50' } },
                alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
                border: {
                    top: { style: 'medium', color: { rgb: '3C8B41' } },
                    bottom: { style: 'medium', color: { rgb: '3C8B41' } },
                    left: { style: 'thin', color: { rgb: '3C8B41' } },
                    right: { style: 'thin', color: { rgb: '3C8B41' } }
                }
            }
        }
    })

    // Data rows styling with alternating colors and conditional formatting
    rows.forEach((row, rowIdx) => {
        const actualRowIdx = dataStartRow + rowIdx
        const isAlternate = rowIdx % 2 === 1

        row.forEach((cell, colIdx) => {
            const cellRef = XLSX.utils.encode_cell({ r: actualRowIdx, c: colIdx })
            if (ws[cellRef]) {
                const header = String(headers[colIdx])
                const cellText = String(cell || '')
                const colWidth = colWidths[colIdx]?.wch || 50

                // Only enable wrapText if content is long enough to need it
                const needsWrap = cellText.length > colWidth || cellText.includes('\n')

                let cellStyle: any = {
                    font: { sz: 11, name: 'Calibri' },
                    alignment: { horizontal: 'left', vertical: 'center', wrapText: needsWrap },
                    border: {
                        top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                        bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                        left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                        right: { style: 'thin', color: { rgb: 'E0E0E0' } }
                    }
                }

                // Alternating row background
                if (isAlternate) {
                    cellStyle.fill = { fgColor: { rgb: 'FCFDFC' } }
                } else {
                    cellStyle.fill = { fgColor: { rgb: 'FFFFFF' } }
                }

                // AI Score column - color coding
                if (header === 'AI Score' && typeof cell === 'number') {
                    if (cell >= 80) {
                        cellStyle.font.color = { rgb: '2E7D32' } // Dark green
                        cellStyle.font.bold = true
                    } else if (cell >= 60) {
                        cellStyle.font.color = { rgb: 'FB8C00' } // Orange
                    } else if (cell > 0) {
                        cellStyle.font.color = { rgb: 'D32F2F' } // Red
                    }
                }

                // Recommendation column - color coding
                if (header === 'Recommendation') {
                    const rec = String(cell).toLowerCase()
                    if (rec.includes('hire')) {
                        cellStyle.fill = { fgColor: { rgb: 'E8F5E9' } } // Light green
                        cellStyle.font.color = { rgb: '2E7D32' }
                        cellStyle.font.bold = true
                    } else if (rec.includes('reject')) {
                        cellStyle.fill = { fgColor: { rgb: 'FFEBEE' } } // Light red
                        cellStyle.font.color = { rgb: 'D32F2F' }
                    }
                }

                // Status column - capitalize and style
                if (header === 'Status') {
                    const status = String(cell).toLowerCase()
                    if (status === 'hired') {
                        cellStyle.font.color = { rgb: '2E7D32' }
                        cellStyle.font.bold = true
                    } else if (status === 'rejected') {
                        cellStyle.font.color = { rgb: 'D32F2F' }
                    }
                }

                ws[cellRef].s = cellStyle
            }
        })
    })

    // Add worksheet to workbook with enhanced name
    XLSX.utils.book_append_sheet(wb, ws, 'Applicants Report')

    // Generate Excel file with metadata
    wb.Props = {
        Title: title,
        Subject: 'Applicants Export',
        Author: 'SmartRecruit AI',
        CreatedDate: new Date()
    }

    // Generate Excel file and download
    XLSX.writeFile(wb, `${filename}.xlsx`, {
        bookType: 'xlsx',
        type: 'binary',
    })
}

// ============================================================================
// PDF Export (Professional Layout)
// ============================================================================

/**
 * Detect if text contains Arabic characters
 */
function containsArabic(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRegex.test(text)
}

/**
 * Get bilingual header text
 */
function getBilingualHeader(enText: string, arText: string, language: 'en' | 'ar' | 'both' = 'en'): string {
    if (language === 'both') {
        return `${enText} | ${arText}`
    }
    return language === 'ar' ? arText : enText
}

/**
 * Export data to PDF with professional styling and branding
 * Supports Arabic text with proper font and RTL layout
 */
export async function exportToPDF(data: ExportData, options: ExportOptions = {}) {
    const { headers, rows, filename } = data
    const {
        title = 'Export Report',
        includeBranding = true,
        includeTimestamp = true,
    } = options

    // Dynamically import jsPDF and autoTable
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    // Import Arabic font for proper rendering
    const { amiriFont } = await import('./fonts/amiri-regular')

    // Check if any Name field (first column) contains Arabic
    const hasArabicInNames = rows.some(row => containsArabic(String(row[0])))

    // Create PDF in landscape mode for better table fit
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    })

    // Add Arabic font support (for Name column if needed)
    if (hasArabicInNames) {
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFont)
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // ========================================
    // Header Section - English Only
    // ========================================

    if (includeBranding) {
        // Company name
        doc.setFontSize(20)
        doc.setTextColor(76, 175, 80) // Green color
        doc.setFont('helvetica', 'bold')
        doc.text('SmartRecruit AI', 15, yPosition)
        yPosition += 10
    }

    // Title
    doc.setFontSize(16)
    doc.setTextColor(33, 33, 33)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 15, yPosition)
    yPosition += 8

    // Metadata row
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')

    if (includeTimestamp) {
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPosition)
    }

    doc.text(`Total Records: ${rows.length}`, pageWidth - 15, yPosition, { align: 'right' })

    yPosition += 5

    // Decorative line separator
    doc.setDrawColor(76, 175, 80)
    doc.setLineWidth(0.5)
    doc.line(15, yPosition, pageWidth - 15, yPosition)

    yPosition += 10

    // Summary Statistics Box (if we have data)
    if (rows.length > 0) {
        // Calculate quick stats
        const avgScoreIdx = 5 // AI Score column
        const scores = rows.map(row => Number(row[avgScoreIdx]) || 0).filter(s => s > 0)
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A'
        const topScore = scores.length > 0 ? Math.max(...scores) : 'N/A'

        // Draw subtle background box
        doc.setFillColor(248, 249, 250)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.1)
        doc.roundedRect(15, yPosition, pageWidth - 30, 12, 2, 2, 'FD')

        // Add statistics text - English only
        doc.setFontSize(8)
        doc.setTextColor(60, 60, 60)
        doc.setFont('helvetica', 'bold')

        const statsText = [
            `Avg Score: ${avgScore}`,
            `Top Score: ${topScore}`,
            `Records: ${rows.length}`
        ]

        const spacing = (pageWidth - 30) / 3
        statsText.forEach((stat, idx) => {
            doc.text(stat, 20 + (idx * spacing), yPosition + 7.5)
        })

        yPosition += 15
    }

    // ========================================
    // Table Section
    // ========================================

    // Calculate optimal column widths for landscape A4
    const totalWidth = pageWidth - 24 // Account for margins
    const numCols = headers.length

    // Optimized column widths for better readability
    const baseWidths: Record<number, number> = {
        0: 20,  // Name
        1: 25,  // Email
        2: 18,  // Phone
        3: 22,  // Job Title
        4: 22,  // Status
        5: 18,  // AI Score - wider to fit text on one line
        6: 22,  // Experience (Years) - wider to fit text on one line
        7: 24,  // Submitted Date - wider to fit text on one line
    }

    // AI evaluation columns - set specific widths for single-line display
    const aiColumnWidths: Record<number, number> = {
        8: 30,   // AI Summary
        9: 28,   // Top Strengths
        10: 25,  // Red Flags
        11: 28,  // Recommendation - wider to fit text on one line
    }

    // Build column styles object for autoTable
    const columnStyles: Record<string, { cellWidth: number }> = {}
    headers.forEach((_, idx) => {
        columnStyles[idx] = {
            cellWidth: baseWidths[idx] || aiColumnWidths[idx] || 25
        }
    })

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
            fillColor: [76, 175, 80],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
            minCellHeight: 8,
            lineWidth: 0.2,
            lineColor: [60, 140, 65],
        },
        bodyStyles: {
            fontSize: 7,
            cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
            textColor: [33, 33, 33],
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            halign: 'left',
            minCellHeight: 10,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        didParseCell: (data: any) => {
            // Use Amiri font for Name column if it contains Arabic
            if (data.column.index === 0 && data.section === 'body' && hasArabicInNames) {
                const cellText = String(data.cell.raw)
                if (containsArabic(cellText)) {
                    data.cell.styles.font = 'Amiri'
                }
            }

            // Color code AI scores
            if (data.column.index === 5 && data.section === 'body') { // AI Score column
                const score = Number(data.cell.raw)
                if (score >= 80) {
                    data.cell.styles.textColor = [46, 125, 50] // Dark green for high scores
                    data.cell.styles.fontStyle = 'bold'
                } else if (score >= 60) {
                    data.cell.styles.textColor = [251, 140, 0] // Orange for medium scores
                } else if (score > 0) {
                    data.cell.styles.textColor = [211, 47, 47] // Red for low scores
                }
            }

            // Highlight recommendations
            if (data.column.index === headers.length - 1 && data.section === 'body') { // Recommendation column
                const rec = String(data.cell.raw).toLowerCase()
                if (rec.includes('hire')) {
                    data.cell.styles.fillColor = [232, 245, 233] // Light green background
                    data.cell.styles.textColor = [46, 125, 50]
                    data.cell.styles.fontStyle = 'bold'
                } else if (rec.includes('reject')) {
                    data.cell.styles.fillColor = [255, 235, 238] // Light red background
                    data.cell.styles.textColor = [211, 47, 47]
                }
            }
        },
        alternateRowStyles: {
            fillColor: [252, 253, 252],
        },
        columnStyles: columnStyles,
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 7,
            font: 'helvetica',
            fontStyle: 'normal',
            valign: 'middle',
        },
        margin: { left: 12, right: 12, top: 20, bottom: 25 },
        tableLineWidth: 0.2,
        tableLineColor: [180, 180, 180],
        didDrawPage: () => {
            // Footer with page numbers - English only
            const pageCount = doc.getNumberOfPages()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber

            // Draw footer separator line
            doc.setDrawColor(220, 220, 220)
            doc.setLineWidth(0.3)
            doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18)

            // Footer content
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.setFont('helvetica', 'normal')

            // Page number - centered
            doc.text(
                `Page ${currentPage} of ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            )

            // Footer text
            doc.text('Generated by SmartRecruit AI', 15, pageHeight - 10)
            doc.text(new Date().toLocaleDateString(), pageWidth - 15, pageHeight - 10, { align: 'right' })

            // Confidential watermark (subtle)
            doc.setFontSize(6)
            doc.setTextColor(220, 220, 220)
            doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight - 3, { align: 'center' })
        },
    })

    // Save PDF
    doc.save(`${filename}.pdf`)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }, 100)
}

/**
 * Helper to escape HTML special characters
 */
function escapeHtml(text: string | number): string {
    const str = String(text)
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
}

/**
 * Clean text by removing extra whitespace and special characters
 */
function cleanText(text: string | number): string {
    return String(text)
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
}

// ============================================================================
// Data Formatting Functions
// ============================================================================

/**
 * Format applicant data for export with enhanced formatting
 * Enhanced with AI Summary and Key Insights
 * Headers are always in English, but Name field supports Arabic text
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatApplicantsForExport(applicants: any[], includeAISummary = true, language: 'en' | 'ar' | 'both' = 'en') {
    // Column headers - always in English
    const columnHeaders = {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        jobTitle: 'Job Title',
        status: 'Status',
        aiScore: 'AI Score',
        experience: 'Experience (Years)',
        submittedDate: 'Submitted Date',
        aiSummary: 'AI Summary',
        topStrengths: 'Top Strengths',
        redFlags: 'Red Flags',
        recommendation: 'Recommendation',
    }

    const baseHeaders = [
        columnHeaders.name,
        columnHeaders.email,
        columnHeaders.phone,
        columnHeaders.jobTitle,
        columnHeaders.status,
        columnHeaders.aiScore,
        columnHeaders.experience,
        columnHeaders.submittedDate,
    ]

    const aiHeaders = includeAISummary
        ? [
              columnHeaders.aiSummary,
              columnHeaders.topStrengths,
              columnHeaders.redFlags,
              columnHeaders.recommendation,
          ]
        : []

    const headers = [...baseHeaders, ...aiHeaders]

    const rows = applicants.map((applicant) => {
        // Format status with proper capitalization
        const status = applicant.status
            ? String(applicant.status).charAt(0).toUpperCase() + String(applicant.status).slice(1)
            : 'N/A'

        const baseData = [
            cleanText(applicant.personalData?.name || 'N/A'),
            cleanText(applicant.personalData?.email || 'N/A'),
            cleanText(applicant.personalData?.phone || 'N/A'),
            cleanText(applicant.jobTitle || 'N/A'),
            status,
            applicant.aiScore !== undefined ? Math.round(applicant.aiScore) : 0,
            applicant.personalData?.yearsOfExperience || 0,
            applicant.submittedAt
                ? new Date(applicant.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                  })
                : 'N/A',
        ]

        if (!includeAISummary) {
            return baseData
        }

        // Extract AI evaluation data
        const evaluation = applicant.evaluation

        // Handle bilingual fields - prefer English, fallback to Arabic
        const aiSummary = cleanText(
            evaluation?.summary?.en ||
            evaluation?.summary?.ar ||
            evaluation?.summary ||
            'No AI evaluation available'
        )

        // Format strengths as clean bullet list (use • or - depending on format)
        const topStrengths = evaluation?.strengths?.en?.slice(0, 3)
            .map((s: string) => cleanText(s))
            .join('; ') ||
            evaluation?.strengths?.ar?.slice(0, 3)
            .map((s: string) => cleanText(s))
            .join('; ') ||
            (Array.isArray(evaluation?.strengths)
                ? evaluation.strengths.slice(0, 3).map((s: string) => cleanText(s)).join('; ')
                : 'N/A')

        // Format red flags
        const redFlags = (evaluation?.redFlags?.en && evaluation.redFlags.en.length > 0)
            ? evaluation.redFlags.en.map((r: string) => cleanText(r)).join('; ')
            : (evaluation?.redFlags?.ar && evaluation.redFlags.ar.length > 0)
            ? evaluation.redFlags.ar.map((r: string) => cleanText(r)).join('; ')
            : (Array.isArray(evaluation?.redFlags) && evaluation.redFlags.length > 0)
            ? evaluation.redFlags.map((r: string) => cleanText(r)).join('; ')
            : 'None'

        // Format recommendation with capitalization
        const recommendation = evaluation?.recommendation?.en ||
            evaluation?.recommendation?.ar ||
            evaluation?.recommendation ||
            'Pending review'

        const formattedRecommendation = String(recommendation)
            .charAt(0).toUpperCase() + String(recommendation).slice(1)

        const aiData = [
            aiSummary,
            topStrengths,
            redFlags,
            formattedRecommendation,
        ]

        return [...baseData, ...aiData]
    })

    return { headers, rows }
}

/**
 * Format dashboard stats for export
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatDashboardStatsForExport(stats: any) {
    const headers = ['Metric', 'Value']

    const rows = [
        ['Action Required', stats.actionRequired || 0],
        ['Interviews Scheduled', stats.interviewsScheduled || 0],
        ['Total Hired', stats.totalHired || 0],
        ['Active Jobs', stats.activeJobs || 0],
    ]

    return { headers, rows }
}
