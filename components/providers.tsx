"use client";

import { AppProgressProvider as ProgressProvider } from "@bprogress/next";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="4px"
      color="#0d9488"
      options={{ showSpinner: false }}
      delay={200}
    >
      {children}
    </ProgressProvider>
  );
}
