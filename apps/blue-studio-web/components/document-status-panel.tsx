"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  BlueprintParticipant,
  ResolvedStatusMessage,
  StatusTemplateBundle,
} from "@/lib/workspace/types";

export function DocumentStatusPanel({
  blueprintReady,
  viewerChannel,
  participants,
  templateBundle,
  resolvedStatus,
  statusHistory,
  autoRefreshEnabled,
  onViewerChange,
  onAutoRefreshChange,
  onRefreshNow,
  refreshing,
}: {
  blueprintReady: boolean;
  viewerChannel: string | null;
  participants: BlueprintParticipant[];
  templateBundle: StatusTemplateBundle | null;
  resolvedStatus: ResolvedStatusMessage | null;
  statusHistory: ResolvedStatusMessage[];
  autoRefreshEnabled: boolean;
  onViewerChange: (viewer: string) => void;
  onAutoRefreshChange: (enabled: boolean) => void;
  onRefreshNow: () => void;
  refreshing: boolean;
}) {
  if (!blueprintReady) {
    return (
      <p className="text-muted-foreground text-sm">
        Status will be available after the blueprint is ready.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 p-2.5">
        <span className="font-medium text-sm">Viewer</span>
        <Select
          value={viewerChannel ?? undefined}
          onValueChange={(value) => {
            if (value) {
              onViewerChange(value);
            }
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select viewer" />
          </SelectTrigger>
          <SelectContent>
            {participants.map((participant) => (
              <SelectItem key={participant.channelName} value={participant.channelName}>
                {participant.channelName}
                {participant.systemLike ? " (system)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {templateBundle ? (
          <Badge variant="secondary">{templateBundle.templates.length} templates</Badge>
        ) : (
          <Badge variant="outline">No templates yet</Badge>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm">
        <Switch
          checked={autoRefreshEnabled}
          onCheckedChange={(checked) => onAutoRefreshChange(Boolean(checked))}
        />
        <span>Auto refresh</span>
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={refreshing}
          onClick={onRefreshNow}
        >
          Refresh now
        </Button>
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {resolvedStatus ? (
            <>
              <p className="font-medium">{resolvedStatus.title}</p>
              <p className="text-muted-foreground">{resolvedStatus.body}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {resolvedStatus.createdAt}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">No resolved status yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="font-medium text-sm">Status history</p>
        {statusHistory.length === 0 && (
          <p className="text-muted-foreground text-sm">No status history yet.</p>
        )}
        {statusHistory.map((entry) => (
          <Card key={entry.id} className="border-border/80 bg-card/95">
            <CardContent className="pt-4 text-sm">
              <p className="font-medium">{entry.title}</p>
              <p className="text-muted-foreground">{entry.body}</p>
              <p className="font-mono text-xs text-muted-foreground">{entry.createdAt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Template catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!templateBundle ? (
            <p className="text-muted-foreground text-sm">
              Templates will appear after generation for the selected viewer.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {templateBundle.templates.map((template, index) => (
                  <div
                    key={`${template.when}-${index}`}
                    className="rounded-lg border bg-muted/20 p-2 text-xs"
                  >
                    <p className="font-semibold text-foreground/90">when: {template.when}</p>
                    <p className="mt-1">
                      <span className="font-medium">title:</span> {template.title}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground/80">body:</span> {template.body}
                    </p>
                  </div>
                ))}
              </div>
              <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/25 p-3 font-mono text-[11px] whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    viewer: templateBundle.viewer,
                    templates: templateBundle.templates,
                  },
                  null,
                  2
                )}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

