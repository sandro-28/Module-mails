import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: "line" | "circle" | "rect"
}

const variantClasses: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  line: "h-4 w-full rounded-md",
  circle: "h-10 w-10 rounded-full",
  rect: "h-24 w-full rounded-md",
}

export function Skeleton({
  className,
  variant = "line",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-gray-200",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
