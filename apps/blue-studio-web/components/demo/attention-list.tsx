"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionItem } from "@/lib/demo/types";

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle>Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-body">No pending asks right now.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border-soft bg-card p-3 text-sm">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{item.title}</p>
                <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-body">{item.body}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
