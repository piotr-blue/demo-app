import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base text-foreground shadow-[0_1px_1px_rgba(16,24,40,0.04)] transition-colors outline-none placeholder:text-muted-foreground/90 focus-visible:border-primary/40 focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-70 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
