"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DemoPageHeader } from "@/components/demo/demo-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    <section className="demo-page-shell max-w-5xl">
      <DemoPageHeader
        eyebrow="Demo controls"
        icon={<Settings2Icon className="size-5" />}
        title="Settings"
        description="Manage local demo credentials, reset seeded state, and keep the legacy route available for regression safety."
      />

      <Card>
        <CardHeader className="border-b border-border-soft pb-4">
          <CardTitle>Credentials (localStorage)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
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
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-border-soft bg-bg-subtle/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-border-soft bg-card text-accent-base">
                <KeyRoundIcon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Stored locally only</p>
                <p className="text-caption">These values stay in the browser for the demo experience.</p>
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
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
        <Card>
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle>Demo state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-[18px] border border-border-soft bg-bg-subtle/75 p-4">
              <p className="text-body">
                Demo data is stored locally (IndexedDB) so your interactions persist across refreshes.
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
          <CardHeader className="border-b border-border-soft pb-4">
            <CardTitle>Legacy route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-body">
              The legacy blueprint / DSL / bootstrap flow remains available for regression safety.
            </p>
            <div className="rounded-[18px] border border-border-soft bg-bg-subtle/75 p-4">
              <p className="text-caption">Compatible route</p>
              <p className="mt-1 font-medium text-foreground">/t/[threadId]</p>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/t/thread_demo_legacy" />}>
              Open legacy /t/[threadId]
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
