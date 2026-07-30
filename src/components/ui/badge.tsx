import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-none border-2 border-[#1A1A2E] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider transition-[transform,shadow,opacity,colors] focus:outline-none shadow-[2px_2px_0px_0px_rgba(26,26,46,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
    {
        variants: {
            variant: {
                default:
                    "bg-[#0F59FF] text-white",
                secondary:
                    "bg-[#64FE3E] text-black",
                destructive:
                    "bg-[#EF4444] text-white",
                outline: "bg-white text-black",
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
