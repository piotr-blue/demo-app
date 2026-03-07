"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { CredentialsGate } from "@/components/credentials-gate";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  clearCredentials,
  readActiveWorkspaceId,
  readCredentials,
  readSelectedTab,
  writeActiveWorkspaceId,
  writeCredentials,
  writeSelectedTab,
} from "@/lib/storage/local-storage";
import type { UserCredentials } from "@/lib/workspace/types";

function createWorkspaceId(): string {
  return `workspace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function StudioApp() {
  const [hydrated, setHydrated] = useState(false);
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const storedCredentials = readCredentials();
    const storedWorkspaceId = readActiveWorkspaceId();
    const selectedTab = readSelectedTab();

    setCredentials(storedCredentials);
    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId);
    } else if (storedCredentials) {
      const nextWorkspaceId = createWorkspaceId();
      writeActiveWorkspaceId(nextWorkspaceId);
      setWorkspaceId(nextWorkspaceId);
    }

    if (selectedTab) {
      writeSelectedTab(selectedTab);
    }
    setHydrated(true);
  }, []);

  const resolvedWorkspaceId = useMemo(() => {
    if (!workspaceId) {
      return null;
    }
    return workspaceId;
  }, [workspaceId]);

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  if (!credentials || !resolvedWorkspaceId) {
    return (
      <CredentialsGate
        onSubmit={(nextCredentials) => {
          writeCredentials(nextCredentials);
          setCredentials(nextCredentials);
          const nextWorkspaceId = createWorkspaceId();
          writeActiveWorkspaceId(nextWorkspaceId);
          setWorkspaceId(nextWorkspaceId);
        }}
      />
    );
  }

  return (
    <WorkspaceShell
      credentials={credentials}
      workspaceId={resolvedWorkspaceId}
      onLogout={() => {
        clearCredentials();
        setCredentials(null);
        setWorkspaceId(null);
      }}
    />
  );
}
