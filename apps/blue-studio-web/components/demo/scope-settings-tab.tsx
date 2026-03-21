"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScopeRecord } from "@/lib/demo/types";

export function ScopeSettingsTab({ scope }: { scope: ScopeRecord }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Scope details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <span className="text-text-muted font-medium">Name</span>
            <span className="text-foreground">{scope.name}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <span className="text-text-muted font-medium">Type</span>
            <span className="text-foreground">{scope.type}</span>
          </div>
          {scope.templateKey ? (
            <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
              <span className="text-text-muted font-medium">Template</span>
              <span className="text-foreground">{scope.templateKey}</span>
            </div>
          ) : null}
          <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <span className="text-text-muted font-medium">Bootstrap</span>
            <Badge variant={scope.bootstrapStatus === "failed" ? "destructive" : "secondary"}>
              {scope.bootstrapStatus}
            </Badge>
          </div>
          {scope.bootstrapError ? (
            <p className="text-destructive text-sm">{scope.bootstrapError}</p>
          ) : null}
          <p className="font-mono text-xs text-text-muted pt-2">scopeId: {scope.id}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Anchors</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {scope.anchors.length === 0 ? (
            <p className="text-body">No anchors defined.</p>
          ) : (
            scope.anchors.map((anchor) => (
              <Badge key={anchor} variant="secondary">
                {anchor}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <span className="text-text-muted font-medium">Name</span>
            <span className="text-foreground">{scope.assistant.name}</span>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 items-baseline">
            <span className="text-text-muted font-medium">Tone</span>
            <span className="text-foreground">{scope.assistant.tone}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
