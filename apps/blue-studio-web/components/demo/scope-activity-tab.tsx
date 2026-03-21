"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityRecord } from "@/lib/demo/types";

export function ScopeActivityTab({ activity }: { activity: ActivityRecord[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Activity ledger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {activity.length === 0 ? (
          <p className="text-body py-4 text-center">No activity yet.</p>
        ) : (
          activity.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border-soft bg-card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{entry.title}</p>
                <Badge variant="secondary">{entry.kind}</Badge>
              </div>
              {entry.detail ? <p className="mt-1.5 text-body">{entry.detail}</p> : null}
              <p className="mt-1.5 text-caption">{entry.createdAt}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
