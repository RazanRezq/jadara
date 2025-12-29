"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { MagicCard } from "@/components/magicui/magic-card"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  useMagic?: boolean
  gradientFrom?: string
  gradientTo?: string
  gradientSize?: number
}

function Card({
  className,
  useMagic = true,
  gradientFrom = "#4f46e5",
  gradientTo = "#9333ea",
  gradientSize = 200,
  ...props
}: CardProps) {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're in dark mode
  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"))

  // If useMagic is false or not in dark mode, return regular card
  if (!useMagic || !isDark || !mounted) {
    return (
      <div
        data-slot="card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
          className
        )}
        {...props}
      />
    )
  }

  // Wrap with MagicCard in dark mode
  return (
    <MagicCard
      className={cn("rounded-xl", className)}
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
      gradientSize={gradientSize}
    >
      <div
        data-slot="card"
        className="bg-transparent text-card-foreground flex flex-col gap-6 py-6"
        {...props}
      />
    </MagicCard>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
