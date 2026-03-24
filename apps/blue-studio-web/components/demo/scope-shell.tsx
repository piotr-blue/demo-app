"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ScopeShell({ scopeId }: { scopeId: string }) {
  return (
    <Card>
      <CardContent className="pt-5 text-sm text-muted-foreground">
        Legacy workspace shell is not part of the primary multi-account demo surface. Requested scope: {scopeId}
      </CardContent>
    </Card>
  );
}
