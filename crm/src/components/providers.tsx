"use client";

import { ThemeProvider } from "next-themes";
import { Direction } from "radix-ui";
import { Toaster } from "@/components/ui/sonner";

// App-wide wrappers: light/dark theme, text direction (for Arabic later), toasts.
export function Providers({ dir, children }: { dir: "ltr" | "rtl"; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Direction.Provider dir={dir}>
        {children}
        <Toaster />
      </Direction.Provider>
    </ThemeProvider>
  );
}
