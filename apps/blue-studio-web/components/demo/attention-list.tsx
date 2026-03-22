"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttentionItem } from "@/lib/demo/types";

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b border-border-soft pb-3">
        <CardTitle>Attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {items.length === 0 ? (
          <div className="demo-empty-state px-4 py-8">
            <p className="text-body">No pending asks right now.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="demo-list-card text-sm">
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
