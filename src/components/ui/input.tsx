"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useTranslate } from "@/hooks/useTranslate"

function Input({ className, type, dir, style, ...props }: React.ComponentProps<"input">) {
  const { dir: contextDir } = useTranslate()

  // Use explicit dir prop if provided, otherwise use context direction
  const effectiveDir = dir !== undefined ? dir : contextDir

  // Create inline styles to ensure RTL alignment
  const inlineStyles: React.CSSProperties = {
    ...style,
    textAlign: effectiveDir === "rtl" ? "right" : "left",
  }

  return (
    <input
      type={type}
      data-slot="input"
      dir={effectiveDir}
      style={inlineStyles}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-11 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-[family-name:var(--font-ibm-arabic)]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
