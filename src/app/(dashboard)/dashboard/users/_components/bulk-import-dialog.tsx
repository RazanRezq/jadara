"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import Papa from "papaparse"

interface BulkImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [parsing, setParsing] = useState(false)
    const [importing, setImporting] = useState(false)
    const [dryRunResults, setDryRunResults] = useState<any>(null)
    const [importResults, setImportResults] = useState<any>(null)

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch("/api/users/import-template")

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "users-import-template.csv"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Template downloaded successfully")
        } catch (error) {
            console.error("Error downloading template:", error)
            toast.error("Failed to download template")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile && selectedFile.type === "text/csv") {
            setFile(selectedFile)
            setDryRunResults(null)
            setImportResults(null)
        } else {
            toast.error("Please select a valid CSV file")
        }
    }

    const parseCSV = (): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("No file selected"))
                return
            }

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
                complete: (results) => {
                    const users = results.data.map((row: any) => ({
                        name: row.name,
                        email: row.email,
                        password: row.password,
                        role: row.role || 'reviewer',
                        isActive: row.active === 'true' || row.active === true,
                    }))
                    resolve(users)
                },
                error: (error) => {
                    reject(error)
                },
            })
        })
    }

    const handleDryRun = async () => {
        try {
            setParsing(true)
            const users = await parseCSV()

            const response = await fetch("/api/users/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ users, dryRun: true }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setDryRunResults(result.results)
                toast.success(result.message)
            } else {
                toast.error(result.error || "Dry run failed")
            }
        } catch (error) {
            console.error("Error in dry run:", error)
            toast.error("Error parsing CSV file")
        } finally {
            setParsing(false)
        }
    }

    const handleImport = async () => {
        try {
            setImporting(true)
            const users = await parseCSV()

            const response = await fetch("/api/users/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ users, dryRun: false }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setImportResults(result.results)
                toast.success(result.message)
                if (result.results.successful > 0) {
                    onSuccess()
                }
            } else {
                toast.error(result.error || "Import failed")
            }
        } catch (error) {
            console.error("Error importing users:", error)
            toast.error("Error importing users")
        } finally {
            setImporting(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setDryRunResults(null)
        setImportResults(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Bulk Import Users
                    </DialogTitle>
                    <DialogDescription>
                        Import multiple users from a CSV file
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Download Template */}
                    <div>
                        <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                            <Download className="h-4 w-4 me-2" />
                            Download CSV Template
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                            Download the template to see the required format
                        </p>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label htmlFor="csv-upload" className="block text-sm font-medium mb-2">
                            Select CSV File
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                            {file && (
                                <div className="flex items-center gap-1 text-sm text-green-600">
                                    <FileText className="h-4 w-4" />
                                    {file.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dry Run Results */}
                    {dryRunResults && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="font-medium">Dry Run Results:</div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>Total: {dryRunResults.total}</div>
                                        <div className="text-green-600">✓ Success: {dryRunResults.successful}</div>
                                        <div className="text-red-600">✗ Failed: {dryRunResults.failed}</div>
                                    </div>
                                    {dryRunResults.errors.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-xs font-medium text-red-600">Errors:</div>
                                            <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                                {dryRunResults.errors.slice(0, 10).map((err: any, idx: number) => (
                                                    <div key={idx} className="text-muted-foreground">
                                                        Row {err.row}: {err.email} - {err.error}
                                                    </div>
                                                ))}
                                                {dryRunResults.errors.length > 10 && (
                                                    <div className="text-muted-foreground">
                                                        ...and {dryRunResults.errors.length - 10} more errors
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Import Results */}
                    {importResults && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <div className="font-medium">Import Complete!</div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>Total: {importResults.total}</div>
                                        <div className="text-green-600">✓ Created: {importResults.successful}</div>
                                        <div className="text-red-600">✗ Failed: {importResults.failed}</div>
                                    </div>
                                    {importResults.created.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-xs font-medium text-green-600">Successfully Created:</div>
                                            <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                                                {importResults.created.slice(0, 10).map((user: any, idx: number) => (
                                                    <div key={idx} className="text-muted-foreground">
                                                        {user.name} ({user.email}) - {user.role}
                                                    </div>
                                                ))}
                                                {importResults.created.length > 10 && (
                                                    <div className="text-muted-foreground">
                                                        ...and {importResults.created.length - 10} more users
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDryRun}
                            disabled={!file || parsing || importing}
                        >
                            {parsing ? "Validating..." : "Validate Data"}
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!file || importing || parsing}
                        >
                            {importing ? "Importing..." : "Import Users"}
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
