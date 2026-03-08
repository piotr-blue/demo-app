"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentQaExchange, DocumentQaMode } from "@/lib/workspace/types";

export function DocumentAssistantPanel({
  enabled,
  mode,
  history,
  submitting,
  onSubmitQuestion,
}: {
  enabled: boolean;
  mode: DocumentQaMode;
  history: DocumentQaExchange[];
  submitting: boolean;
  onSubmitQuestion: (question: string) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");

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
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={submitting || question.trim().length === 0}
                onClick={async () => {
                  const trimmed = question.trim();
                  if (!trimmed) {
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

