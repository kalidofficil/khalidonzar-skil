import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-md border border-input bg-card px-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

// text-base on phones stops iOS from zooming in when a field is focused.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={cn(fieldBase, "h-10 py-1", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-2", className)} {...props} />;
}

/**
 * A native <select>: on phones it opens the system picker, which is faster
 * and more reliable than a custom dropdown.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-10 py-1 pe-8", className)} {...props} />;
}

export { Input, Textarea, NativeSelect };
