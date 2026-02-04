"use client";

import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("sonner").then((m) => m.Toaster),
  { ssr: false },
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="4px"
      color="#0d9488"
      options={{ showSpinner: false }}
      delay={200}
    >
      {children}
      <Toaster position="bottom-center" richColors />
    </ProgressProvider>
  );
}
