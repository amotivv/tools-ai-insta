import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300", className)}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }

