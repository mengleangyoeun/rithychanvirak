import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-zinc-800 placeholder:text-zinc-500 bg-zinc-900/80 flex field-sizing-content min-h-20 w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-xs transition-all outline-none focus-visible:border-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-600/50 disabled:cursor-not-allowed disabled:opacity-50 text-white",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
