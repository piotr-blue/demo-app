"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityRecord } from "@/lib/demo/types";

export function ScopeActivityTab({ activity }: { activity: ActivityRecord[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border-soft pb-3">
        <CardTitle>Activity ledger</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activity.length === 0 ? (
          <p className="py-4 text-center text-body">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[1fr_150px_180px] border-b border-border-soft bg-bg-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                <span>Event</span>
                <span>Type</span>
                <span className="text-right">Created</span>
              </div>
              {activity.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1fr_150px_180px] items-center border-b border-border-soft/80 px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-[13px] font-semibold text-foreground">{entry.title}</p>
                    {entry.detail ? <p className="truncate text-[12px] text-text-secondary">{entry.detail}</p> : null}
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {entry.kind}
                  </Badge>
                  <p className="text-right text-[11px] text-text-muted">{entry.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
