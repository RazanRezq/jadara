"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps
    extends Omit<React.ComponentProps<"input">, "type"> {
    currency?: string
    currencyPosition?: "prefix" | "suffix"
}

export const CurrencyInput = React.forwardRef<
    HTMLInputElement,
    CurrencyInputProps
>(({ className, currency, currencyPosition = "suffix", ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = React.useCallback(
        (node: HTMLInputElement | null) => {
            inputRef.current = node
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                ref.current = node
            }
        },
        [ref]
    )

    if (!currency) {
        return <Input ref={ref} type="number" className={className} {...props} />
    }

    return (
        <div className="relative">
            <Input
                ref={combinedRef}
                type="number"
                className={cn(
                    currencyPosition === "suffix"
                        ? "pe-16"
                        : "ps-16",
                    className
                )}
                {...props}
            />
            <div
                className={cn(
                    "absolute top-0 bottom-0 flex items-center pointer-events-none text-muted-foreground text-sm font-medium",
                    currencyPosition === "suffix"
                        ? "end-3"
                        : "start-3"
                )}
            >
                {currency}
            </div>
        </div>
    )
})

CurrencyInput.displayName = "CurrencyInput"

