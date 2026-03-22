"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScopeShell } from "@/components/demo/scope-shell";
import { useBlinkScope } from "@/components/demo/demo-provider";

export default function HomePage() {
  const homeScope = useBlinkScope();

  if (!homeScope) {
    return (
      <Card>
        <CardContent className="pt-5 text-body">Home scope is still loading.</CardContent>
      </Card>
    );
  }

  return <ScopeShell scopeId={homeScope.id} />;
}
