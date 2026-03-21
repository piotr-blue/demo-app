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
    <div className="flex min-h-screen bg-background">
      <GlobalLeftRail />
      <main className="min-h-screen flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
