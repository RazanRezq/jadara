"use client"

import * as React from "react"
import { MagicCard } from "@/components/magicui/magic-card"
import { getCardGradient } from "@/lib/card-gradients"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  useMagic?: boolean
  gradientFrom?: string
  gradientTo?: string
  gradientSize?: number
  gradientVariant?: 'primary' | 'applicants' | 'jobs' | 'interviews' | 'success' | 'warning' | 'danger' | 'settings' | 'analytics' | 'users' | 'reviews' | 'neutral' | 'dark'
}

function Card({
  className,
  useMagic = false,
  gradientFrom,
  gradientTo,
  gradientSize = 200,
  gradientVariant = 'primary',
  ...props
}: CardProps) {
  // Get gradient colors from variant or use custom colors
  const gradient = getCardGradient(gradientVariant)
  const finalGradientFrom = gradientFrom || gradient.from
  const finalGradientTo = gradientTo || gradient.to

  // If useMagic is false, return regular card without any gradient
  if (!useMagic) {
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

  // Use MagicCard with hover effect (no static background gradient)
  return (
    <MagicCard
      className={cn("rounded-xl", className)}
      gradientFrom={finalGradientFrom}
      gradientTo={finalGradientTo}
      gradientSize={gradientSize}
    >
      <div
        data-slot="card"
        className="bg-transparent text-card-foreground"
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
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
      className={cn("px-6 pb-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
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
