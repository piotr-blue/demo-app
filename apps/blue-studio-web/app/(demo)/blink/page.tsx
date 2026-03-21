"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScopeShell } from "@/components/demo/scope-shell";
import { useBlinkScope } from "@/components/demo/demo-provider";

export default function BlinkPage() {
  const blinkScope = useBlinkScope();

  if (!blinkScope) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Blink scope not available yet.
        </CardContent>
      </Card>
    );
  }

  return <ScopeShell scopeId={blinkScope.id} />;
}
