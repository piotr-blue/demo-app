"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { CredentialsGate } from "@/components/credentials-gate";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  clearCredentials,
  readCredentials,
  writeLastVisitedThreadId,
  writeCredentials,
} from "@/lib/storage/local-storage";
import type { UserCredentials } from "@/lib/workspace/types";

export function StudioApp({ workspaceId }: { workspaceId: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);

  useEffect(() => {
    const storedCredentials = readCredentials();
    setCredentials(storedCredentials);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    writeLastVisitedThreadId(workspaceId);
  }, [workspaceId]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  if (!credentials) {
    return (
      <CredentialsGate
        onSubmit={(nextCredentials) => {
          writeCredentials(nextCredentials);
          setCredentials(nextCredentials);
        }}
      />
    );
  }

  return (
    <WorkspaceShell
      credentials={credentials}
      workspaceId={workspaceId}
      onLogout={() => {
        clearCredentials();
        setCredentials(null);
      }}
    />
  );
}
