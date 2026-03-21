"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GlobalLeftRail } from "@/components/demo/global-left-rail";
import { writeDemoLastRoute } from "@/lib/demo/credentials";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    writeDemoLastRoute(pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <GlobalLeftRail />
      <main className="min-h-screen flex-1 p-4">{children}</main>
    </div>
  );
}
