"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GlobalLeftRail } from "@/components/demo/global-left-rail";
import { TopHeader } from "@/components/demo/top-header";
import { writeDemoLastRoute } from "@/lib/demo/credentials";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    writeDemoLastRoute(pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <TopHeader />
      <GlobalLeftRail />
      <main className="min-h-screen flex-1 overflow-y-auto p-3 pt-15 md:p-5 md:pt-15 lg:p-6 lg:pt-15">
        {children}
      </main>
    </div>
  );
}
