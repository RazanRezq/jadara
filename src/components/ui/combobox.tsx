"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
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

interface ComboboxOption {
    value: string
    label: string
    labelEn?: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    allowCustom?: boolean
    locale?: string
    className?: string
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    allowCustom = true,
    locale = "en",
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    // Find the selected option
    const selectedOption = options.find((option) => option.value === value)
    const displayValue = selectedOption
        ? locale === "ar"
            ? selectedOption.label
            : selectedOption.labelEn || selectedOption.label
        : value || ""

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!searchValue) return options
        const searchLower = searchValue.toLowerCase()
        return options.filter((option) => {
            const label = locale === "ar" ? option.label : option.labelEn || option.label
            return label.toLowerCase().includes(searchLower) || option.value.toLowerCase().includes(searchLower)
        })
    }, [options, searchValue, locale])

    // Check if search value matches any existing option
    const isExistingOption = React.useMemo(() => {
        if (!searchValue) return false
        const searchLower = searchValue.toLowerCase()
        return options.some((option) => {
            const label = locale === "ar" ? option.label : option.labelEn || option.label
            return label.toLowerCase() === searchLower || option.value.toLowerCase() === searchLower
        })
    }, [options, searchValue, locale])

    const handleSelect = (selectedValue: string) => {
        onValueChange(selectedValue)
        setOpen(false)
        setSearchValue("")
    }

    const handleCreateCustom = () => {
        if (searchValue.trim() && !isExistingOption) {
            onValueChange(searchValue.trim())
            setOpen(false)
            setSearchValue("")
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-11",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {displayValue || placeholder}
                    </span>
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom && searchValue.trim() && !isExistingOption ? (
                                <div className="py-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-2"
                                        onClick={handleCreateCustom}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {locale === "ar"
                                            ? `إضافة "${searchValue}"`
                                            : `Add "${searchValue}"`}
                                    </Button>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-sm">
                                    {emptyText}
                                </div>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => {
                                const label = locale === "ar" ? option.label : option.labelEn || option.label
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                    >
                                        <Check
                                            className={cn(
                                                "me-2 h-4 w-4",
                                                value === option.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {label}
                                    </CommandItem>
                                )
                            })}
                            {allowCustom &&
                                searchValue.trim() &&
                                !isExistingOption &&
                                filteredOptions.length > 0 && (
                                    <CommandItem
                                        onSelect={handleCreateCustom}
                                        className="border-t"
                                    >
                                        <Plus className="me-2 h-4 w-4" />
                                        {locale === "ar"
                                            ? `إضافة "${searchValue}"`
                                            : `Add "${searchValue}"`}
                                    </CommandItem>
                                )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

