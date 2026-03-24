"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DemoCredentials } from "@/lib/demo/types";
import { CheckIcon, KeyRoundIcon, RotateCcwIcon, Settings2Icon } from "lucide-react";

export default function SettingsPage() {
  const { credentials, setCredentials, resetDemoData } = useDemoApp();
  const [draft, setDraft] = useState<DemoCredentials>(credentials);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setDraft(credentials);
  }, [credentials]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  return (
    <section className="max-w-6xl">
      <StudioPageHeader
        eyebrow="Demo Controls"
        title="Settings"
        description="Manage local demo credentials, reset seeded state, and keep the legacy route available for regression safety."
        meta={
          <Badge variant="outline" className="gap-1.5">
            <Settings2Icon className="size-3.5" />
            Local-only config
          </Badge>
        }
      />

      <StudioSectionCard
        title="Credentials"
        subtitle="Stored only in your browser for demo workflows."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="openai-key" className="text-xs font-semibold tracking-wide text-muted-foreground">
              OpenAI API key
            </Label>
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
            <Label htmlFor="myos-key" className="text-xs font-semibold tracking-wide text-muted-foreground">
              MyOS API key
            </Label>
            <Input
              id="myos-key"
              type="password"
              value={draft.myOsApiKey}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsApiKey: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-2">
            <Label htmlFor="myos-account-id" className="text-xs font-semibold tracking-wide text-muted-foreground">
              MyOS account ID
            </Label>
            <Input
              id="myos-account-id"
              value={draft.myOsAccountId}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsAccountId: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="myos-base-url" className="text-xs font-semibold tracking-wide text-muted-foreground">
              MyOS base URL
            </Label>
            <Input
              id="myos-base-url"
              value={draft.myOsBaseUrl}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, myOsBaseUrl: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-md border bg-card text-primary">
              <KeyRoundIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium leading-tight">Stored locally only</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                These values stay in this browser and are used only for the demo experience.
              </p>
            </div>
          </div>
          {saved ? (
            <Badge variant="secondary" className="gap-1">
              <CheckIcon className="size-3" />
              Saved
            </Badge>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setCredentials({
                  openAiApiKey: draft.openAiApiKey.trim(),
                  myOsApiKey: draft.myOsApiKey.trim(),
                  myOsAccountId: draft.myOsAccountId.trim(),
                  myOsBaseUrl: draft.myOsBaseUrl.trim(),
                });
                setSaved(true);
              }}
            >
              Save credentials
            </Button>
          </div>
        </div>
      </StudioSectionCard>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Demo state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="leading-relaxed text-muted-foreground">
                Demo data is stored locally in IndexedDB, so your interactions persist across refreshes.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                await resetDemoData();
                setResetting(false);
              }}
            >
              <RotateCcwIcon className="size-3.5" />
              {resetting ? "Resetting…" : "Reset demo data"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Legacy route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              The legacy blueprint / DSL / bootstrap flow remains available for regression safety.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Compatible route
              </p>
              <p className="mt-1 font-medium">/t/[threadId]</p>
            </div>
            <Link href="/t/thread_demo_legacy">
              <Button variant="outline" size="sm">
                Open legacy /t/[threadId]
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
