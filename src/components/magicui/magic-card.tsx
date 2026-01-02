"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientColorLight?: string;
  gradientOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientColorLight = "rgba(99, 102, 241, 0.15)",
  gradientOpacity = 0.8,
  gradientFrom = "var(--primary)",
  gradientTo = "var(--primary)",
}: MagicCardProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const currentGradientColor = isDark ? gradientColor : gradientColorLight;
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (cardRef.current && cardRef.current.parentNode) {
        try {
          const { left, top } = cardRef.current.getBoundingClientRect();
          const clientX = e.clientX;
          const clientY = e.clientY;
          mouseX.set(clientX - left);
          mouseY.set(clientY - top);
        } catch (error) {
          // Silently handle errors during animation
        }
      }
    },
    [mouseX, mouseY],
  );

  const handleMouseOut = useCallback(
    (e: MouseEvent) => {
      try {
        if (!e.relatedTarget) {
          document.removeEventListener("mousemove", handleMouseMove);
          mouseX.set(-gradientSize);
          mouseY.set(-gradientSize);
        }
      } catch (error) {
        // Silently handle errors during animation
      }
    },
    [handleMouseMove, mouseX, gradientSize, mouseY],
  );

  const handleMouseEnter = useCallback(() => {
    try {
      document.addEventListener("mousemove", handleMouseMove);
      mouseX.set(-gradientSize);
      mouseY.set(-gradientSize);
    } catch (error) {
      // Silently handle errors during animation
    }
  }, [handleMouseMove, mouseX, gradientSize, mouseY]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseout", handleMouseOut);
      document.addEventListener("mouseenter", handleMouseEnter);
    } catch (error) {
      // Silently handle errors during animation
    }

    return () => {
      try {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseout", handleMouseOut);
        document.removeEventListener("mouseenter", handleMouseEnter);
      } catch (error) {
        // Silently handle cleanup errors
      }
    };
  }, [handleMouseEnter, handleMouseMove, handleMouseOut]);

  useEffect(() => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  }, [gradientSize, mouseX, mouseY]);

  return (
    <div
      ref={cardRef}
      className={cn("group relative rounded-[inherit]", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-border duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
          radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
          ${gradientFrom},
          ${gradientTo},
          var(--border) 100%
          )
          `,
        }}
      />
      <div className="absolute inset-px rounded-[inherit] bg-card" />
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${currentGradientColor}, transparent 100%)
          `,
          opacity: gradientOpacity,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
