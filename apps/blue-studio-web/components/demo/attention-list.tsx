"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionItem } from "@/lib/demo/types";

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-1.5">
        <CardTitle>Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.length === 0 ? (
          <p className="text-body">No pending asks right now.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border-soft bg-card px-3 py-2.5 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
                <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                  {item.priority}
                </Badge>
              </div>
              <p className="text-[12px] leading-relaxed text-text-secondary">{item.body}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
