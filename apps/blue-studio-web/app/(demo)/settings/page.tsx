"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DemoCredentials } from "@/lib/demo/types";

export default function SettingsPage() {
  const { credentials, setCredentials } = useDemoApp();
  const [draft, setDraft] = useState<DemoCredentials>(credentials);

  useEffect(() => {
    setDraft(credentials);
  }, [credentials]);

  return (
    <section className="space-y-3">
      <div className="rounded-xl border bg-card/80 px-4 py-3">
        <h1 className="font-semibold text-xl">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Local demo credentials and environment info.
        </p>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Credentials (localStorage)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API key</Label>
            <Input
              id="openai-key"
              type="password"
              value={draft.openAiApiKey}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, openAiApiKey: event.target.value }))
              }
              placeholder="sk-..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="myos-key">MyOS API key</Label>
            <Input
              id="myos-key"
              type="password"
              value={draft.myOsApiKey}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsApiKey: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="myos-account-id">MyOS account ID</Label>
            <Input
              id="myos-account-id"
              value={draft.myOsAccountId}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsAccountId: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="myos-base-url">MyOS base URL</Label>
            <Input
              id="myos-base-url"
              value={draft.myOsBaseUrl}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsBaseUrl: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setCredentials({
                  openAiApiKey: draft.openAiApiKey.trim(),
                  myOsApiKey: draft.myOsApiKey.trim(),
                  myOsAccountId: draft.myOsAccountId.trim(),
                  myOsBaseUrl: draft.myOsBaseUrl.trim(),
                })
              }
            >
              Save credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Legacy route</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-2 text-muted-foreground">
            The legacy blueprint/DSL/bootstrap flow remains available for regression safety.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/t/thread_demo_legacy" />}>
            Open legacy /t/[threadId]
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
