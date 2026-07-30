import * as React from "react";

import { cn } from "@/lib/utils/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#1A1A2E] placeholder:text-[#1A1A2E]/60 selection:bg-[#0F59FF] selection:text-white flex h-10 w-full min-w-0 rounded-none border-2 border-[#1A1A2E] bg-[#F7F3EE] px-3 py-2 text-base shadow-[3px_3px_0px_0px_rgba(26,26,46,0.8)] transition-[transform,shadow,opacity,colors] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-medium",
        "focus-visible:border-[#0F59FF] focus-visible:shadow-[0_0_0_3px_#0F59FF]",
        "aria-invalid:border-red-500 aria-invalid:shadow-[0_0_0_3px_#EF4444]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
