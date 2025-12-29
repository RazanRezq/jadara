import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconBadgeProps {
    icon: LucideIcon
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const variantStyles = {
    default: 'bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400',
    primary: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
    success: 'bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400',
    warning: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
    danger: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
    info: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400',
}

const sizeStyles = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
}

const iconSizeStyles = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
}

export const IconBadge: React.FC<IconBadgeProps> = ({
    icon: Icon,
    variant = 'default',
    size = 'md',
    className,
}) => {
    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center shrink-0',
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
        >
            <Icon className={iconSizeStyles[size]} />
        </div>
    )
}
