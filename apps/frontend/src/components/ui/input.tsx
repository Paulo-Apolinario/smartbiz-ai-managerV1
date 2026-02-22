import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // base
        "flex h-10 w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground shadow-sm",
        "placeholder:text-muted-foreground",
        "transition-colors",
        // focus
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:border-ring",
        // disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // file input
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }