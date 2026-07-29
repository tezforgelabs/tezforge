import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-none border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase tracking-wider transition-all focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
    {
        variants: {
            variant: {
                default:
                    "bg-[#7DF9FF] text-black",
                secondary:
                    "bg-[#2FFF2F] text-black",
                destructive:
                    "bg-[#FF00F5] text-white",
                outline: "bg-[#FFF9F0] text-black",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
