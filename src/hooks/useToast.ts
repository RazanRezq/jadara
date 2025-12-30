"use client"

import { toast as sonnerToast, ExternalToast } from "sonner"
import { useTranslate } from "./useTranslate"

export function useToast() {
    const { t } = useTranslate()

    // Helper to handle both translation keys and plain text
    const processMessage = (message: string, params?: Record<string, string | number>): string => {
        // If message contains dots, assume it's a translation key
        if (message.includes('.')) {
            return t(message, params)
        }
        return message
    }

    return {
        success: (message: string, params?: Record<string, string | number>, options?: ExternalToast) => {
            return sonnerToast.success(processMessage(message, params), options)
        },

        error: (message: string, params?: Record<string, string | number>, options?: ExternalToast) => {
            return sonnerToast.error(processMessage(message, params), options)
        },

        info: (message: string, params?: Record<string, string | number>, options?: ExternalToast) => {
            return sonnerToast.info(processMessage(message, params), options)
        },

        warning: (message: string, params?: Record<string, string | number>, options?: ExternalToast) => {
            return sonnerToast.warning(processMessage(message, params), options)
        },

        loading: (message: string, params?: Record<string, string | number>, options?: ExternalToast) => {
            return sonnerToast.loading(processMessage(message, params), options)
        },

        // Direct access to sonner for advanced usage
        promise: sonnerToast.promise,
        custom: sonnerToast.custom,
        dismiss: sonnerToast.dismiss,
    }
}
