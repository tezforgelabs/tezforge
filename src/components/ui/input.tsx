import * as React from "react";

import { cn } from "@/lib/utils/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-black placeholder:text-black/60 selection:bg-[#7DF9FF] selection:text-black flex h-10 w-full min-w-0 rounded-none border-2 border-black bg-[#FFF9F0] px-3 py-2 text-base shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-medium",
        "focus-visible:border-[#7DF9FF] focus-visible:shadow-[0_0_0_3px_#7DF9FF]",
        "aria-invalid:border-[#FF00F5] aria-invalid:shadow-[0_0_0_3px_#FF00F5]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
