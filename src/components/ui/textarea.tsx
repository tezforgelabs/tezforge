import * as React from "react"
import { cn } from "@/lib/utils/utils"

export type TextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[120px] w-full rounded-none border-2 border-black bg-[#FFF9F0] px-3 py-2 text-sm font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] placeholder:text-black/60 focus-visible:outline-none focus-visible:border-[#7DF9FF] focus-visible:shadow-[0_0_0_3px_#7DF9FF] disabled:cursor-not-allowed disabled:opacity-50 transition-all selection:bg-[#7DF9FF] selection:text-black",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
