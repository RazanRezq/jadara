"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  isRTL?: boolean
}

function Progress({
  className,
  value,
  isRTL = false,
  ...props
}: ProgressProps) {
  const progressValue = value || 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full transition-all absolute inset-y-0 start-0"
        style={{ width: `${progressValue}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
