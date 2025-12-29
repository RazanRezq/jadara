"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslate } from "@/hooks/useTranslate"

interface Applicant {
  id: string
  name: string
  email: string
  jobId: string
  jobTitle: string
}

interface ApplicantSearchComboboxProps {
  value: string
  onSelect: (applicant: Applicant) => void
  disabled?: boolean
}

export function ApplicantSearchCombobox({ value, onSelect, disabled }: ApplicantSearchComboboxProps) {
  const { t } = useTranslate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch applicants when search changes
  useEffect(() => {
    const fetchApplicants = async () => {
      if (search.length < 2) {
        setApplicants([])
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          search,
          limit: "10",
        })
        const response = await fetch(`/api/applicants/list?${params}`)
        const data = await response.json()

        if (data.success) {
          setApplicants(
            data.applicants.map((app: any) => ({
              id: app._id || app.id,
              name: app.personalData?.name || "Unknown",
              email: app.personalData?.email || "",
              jobId: app.jobId?._id || app.jobId,
              jobTitle: app.jobId?.title || "Unknown",
            }))
          )
        }
      } catch (error) {
        console.error("Failed to fetch applicants:", error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchApplicants, 300)
    return () => clearTimeout(timer)
  }, [search])

  const selectedApplicant = applicants.find((app) => app.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedApplicant ? (
            <span className="truncate">{selectedApplicant.name}</span>
          ) : (
            <span className="text-muted-foreground">{t("calendar.selectApplicant")}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder={t("calendar.searchApplicants")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? t("common.loading") : t("calendar.noApplicantsFound")}
            </CommandEmpty>
            {applicants.length > 0 && (
              <CommandGroup heading={t("calendar.recentApplicants")}>
                {applicants.map((applicant) => (
                  <CommandItem
                    key={applicant.id}
                    value={applicant.id}
                    onSelect={() => {
                      onSelect(applicant)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === applicant.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{applicant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {applicant.email} • {applicant.jobTitle}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
