"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScopeShell } from "@/components/demo/scope-shell";
import { useBlinkScope } from "@/components/demo/demo-provider";

export default function BlinkPage() {
  const blinkScope = useBlinkScope();

  if (!blinkScope) {
    return (
      <Card>
        <CardContent className="pt-5 text-body">
          Blink scope not available yet.
        </CardContent>
      </Card>
    );
  }

  return <ScopeShell scopeId={blinkScope.id} />;
}
