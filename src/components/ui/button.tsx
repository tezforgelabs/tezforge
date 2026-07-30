import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-black uppercase tracking-wider transition-[transform,shadow,opacity,colors] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none border-4 border-[#1A1A2E]",
  {
    variants: {
      variant: {
        default:
          "bg-[#0F59FF] text-white shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        destructive:
          "bg-[#64FE3E] text-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        outline:
          "bg-white text-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        secondary:
          "bg-[#64FE3E] text-[#1A1A2E] shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        ghost:
          "border-transparent hover:bg-[#0F59FF] hover:text-white hover:border-[#1A1A2E] shadow-[2px_2px_0px_0px_rgba(26,26,46,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(26,26,46,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
        link: "border-none shadow-none text-[#1A1A2E] underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
