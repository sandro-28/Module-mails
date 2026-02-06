import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-100 text-indigo-800 focus:ring-indigo-500",
        secondary:
          "bg-gray-100 text-gray-800 focus:ring-gray-500",
        success:
          "bg-green-100 text-green-800 focus:ring-green-500",
        warning:
          "bg-amber-100 text-amber-800 focus:ring-amber-500",
        destructive:
          "bg-red-100 text-red-800 focus:ring-red-500",
        outline:
          "border border-gray-300 text-gray-700 bg-transparent focus:ring-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
