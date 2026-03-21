"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityRecord } from "@/lib/demo/types";

export function ScopeActivityTab({ activity }: { activity: ActivityRecord[] }) {
  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Activity ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          activity.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border/75 bg-muted/55 p-3 text-sm">
              <p className="font-medium">{entry.title}</p>
              <p className="text-muted-foreground text-xs">{entry.kind}</p>
              {entry.detail ? <p className="text-muted-foreground text-sm">{entry.detail}</p> : null}
              <p className="text-[11px] text-muted-foreground">{entry.createdAt}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
