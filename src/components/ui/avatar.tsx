import * as React from "react"
import { cn, getInitials } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Sizes                                                                     */
/* -------------------------------------------------------------------------- */

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL */
  src?: string | null
  /** Alt text for the image */
  alt?: string
  /** Full name used to derive initials when no image is available */
  name?: string
  /** Size preset */
  size?: keyof typeof sizeClasses
}

export function Avatar({
  src,
  alt,
  name,
  size = "default",
  className,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)
  const showImage = src && !imgError

  const initials = name ? getInitials(name) : "?"

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-medium text-gray-600",
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={alt || name || "avatar"}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || "avatar"}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}
