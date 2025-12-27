"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useTranslate } from "@/hooks/useTranslate"

function Textarea({ className, dir, style, ...props }: React.ComponentProps<"textarea">) {
  const { dir: contextDir } = useTranslate()

  // Use explicit dir prop if provided, otherwise use context direction
  const effectiveDir = dir !== undefined ? dir : contextDir

  // Create inline styles to ensure RTL alignment
  const inlineStyles: React.CSSProperties = {
    ...style,
    textAlign: effectiveDir === "rtl" ? "right" : "left",
  }

  return (
    <textarea
      data-slot="textarea"
      dir={effectiveDir}
      style={inlineStyles}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-[family-name:var(--font-ibm-arabic)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
