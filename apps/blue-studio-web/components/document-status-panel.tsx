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
      <div className="flex flex-wrap items-center gap-2">
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

      <div className="flex items-center gap-2 text-sm">
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

      <Card>
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
          <Card key={entry.id}>
            <CardContent className="pt-4 text-sm">
              <p className="font-medium">{entry.title}</p>
              <p className="text-muted-foreground">{entry.body}</p>
              <p className="font-mono text-xs text-muted-foreground">{entry.createdAt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

