"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScopeRecord } from "@/lib/demo/types";

export function ScopeSettingsTab({ scope }: { scope: ScopeRecord }) {
  return (
    <div className="space-y-3">
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scope details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {scope.name}
          </p>
          <p>
            <span className="font-medium">Type:</span> {scope.type}
          </p>
          {scope.templateKey ? (
            <p>
              <span className="font-medium">Template:</span> {scope.templateKey}
            </p>
          ) : null}
          <p>
            <span className="font-medium">Bootstrap status:</span> {scope.bootstrapStatus}
          </p>
          {scope.bootstrapError ? (
            <p className="text-destructive text-sm">{scope.bootstrapError}</p>
          ) : null}
          <p className="font-mono text-xs text-muted-foreground">scopeId: {scope.id}</p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Anchors</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {scope.anchors.length === 0 ? (
            <p className="text-muted-foreground text-sm">No anchors defined.</p>
          ) : (
            scope.anchors.map((anchor) => (
              <Badge key={anchor} variant="secondary">
                {anchor}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {scope.assistant.name}
          </p>
          <p>
            <span className="font-medium">Tone:</span> {scope.assistant.tone}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
