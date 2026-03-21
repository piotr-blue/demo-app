"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionItem } from "@/lib/demo/types";

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending asks right now.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-muted/20 p-2 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-muted-foreground">{item.body}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
