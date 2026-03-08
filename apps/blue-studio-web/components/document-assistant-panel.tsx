"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  BlueprintParticipant,
  DocumentQaExchange,
  DocumentQaMode,
} from "@/lib/workspace/types";

export function DocumentAssistantPanel({
  enabled,
  mode,
  participants,
  viewerChannel,
  history,
  submitting,
  submitBlockedReason,
  onViewerChange,
  onSubmitQuestion,
}: {
  enabled: boolean;
  mode: DocumentQaMode;
  participants: BlueprintParticipant[];
  viewerChannel: string | null;
  history: DocumentQaExchange[];
  submitting: boolean;
  submitBlockedReason: string | null;
  onViewerChange: (viewer: string | null) => void;
  onSubmitQuestion: (question: string) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");
  const [manualViewer, setManualViewer] = useState("");
  const participantNames = useMemo(
    () => new Set(participants.map((entry) => entry.channelName)),
    [participants]
  );
  const hasParsedParticipants = participants.length > 0;
  const hasCustomViewer =
    typeof viewerChannel === "string" &&
    viewerChannel.trim().length > 0 &&
    !participantNames.has(viewerChannel);
  const selectedViewerValue =
    viewerChannel && participantNames.has(viewerChannel)
      ? viewerChannel
      : viewerChannel === null
        ? "__neutral__"
        : "__custom__";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Document assistant</h3>
        <Badge variant="secondary">
          {mode === "blueprint-only" ? "Using blueprint only" : "Using blueprint + live state"}
        </Badge>
      </div>

      {!enabled ? (
        <p className="text-muted-foreground text-sm">
          Assistant becomes available when the blueprint is ready.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Viewer perspective</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={selectedViewerValue}
                onValueChange={(value) => {
                  if (value === "__neutral__") {
                    onViewerChange(null);
                    return;
                  }
                  if (value === "__custom__") {
                    onViewerChange(manualViewer.trim() || null);
                    return;
                  }
                  onViewerChange(value);
                }}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select viewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__neutral__">Neutral (no viewer)</SelectItem>
                  {participants.map((participant) => (
                    <SelectItem key={participant.channelName} value={participant.channelName}>
                      {participant.channelName}
                      {participant.systemLike ? " (system)" : ""}
                    </SelectItem>
                  ))}
                  {hasCustomViewer && (
                    <SelectItem value="__custom__">Custom: {viewerChannel}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!hasParsedParticipants && (
                <p className="text-muted-foreground text-xs">
                  Participants could not be parsed from the blueprint. Use neutral mode or enter
                  a viewer channel manually.
                </p>
              )}
              {!hasParsedParticipants && (
                <div className="flex gap-2">
                  <Input
                    placeholder="viewerChannel"
                    value={manualViewer}
                    onChange={(event) => setManualViewer(event.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => onViewerChange(manualViewer.trim() || null)}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ask a question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What can this document do?"
                rows={4}
                disabled={submitting}
              />
              {submitBlockedReason && (
                <p className="text-destructive text-xs">{submitBlockedReason}</p>
              )}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={
                    submitting || question.trim().length === 0 || Boolean(submitBlockedReason)
                  }
                  onClick={async () => {
                    const trimmed = question.trim();
                    if (!trimmed || submitBlockedReason) {
                      return;
                    }
                    await onSubmitQuestion(trimmed);
                    setQuestion("");
                  }}
                >
                  Ask
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="space-y-2">
        <p className="font-medium text-sm">History</p>
        {history.length === 0 && (
          <p className="text-muted-foreground text-sm">No assistant history yet.</p>
        )}
        {history.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="space-y-2 pt-4 text-sm">
              <div>
                <p className="font-medium">Q: {entry.question}</p>
                <p className="text-muted-foreground">A: {entry.answer}</p>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{entry.createdAt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

