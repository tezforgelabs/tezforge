import * as React from "react"
import { cn } from "@/lib/utils/utils"

export type TextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[120px] w-full rounded-none border-2 border-[#1A1A2E] bg-[#F7F3EE] px-3 py-2 text-sm font-medium shadow-[4px_4px_0px_0px_rgba(26,26,46,0.8)] placeholder:text-[#1A1A2E]/60 focus-visible:outline-none focus-visible:border-[#FF6B35] focus-visible:shadow-[0_0_0_3px_#FF6B35] disabled:cursor-not-allowed disabled:opacity-50 transition-all selection:bg-[#FF6B35] selection:text-[#1A1A2E]",
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
