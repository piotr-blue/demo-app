"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useDemoApp } from "@/components/demo/demo-provider";
import { AccountProfileShell } from "@/components/demo/account-profile-shell";

export function PublicAccountPage({ accountId }: { accountId: string }) {
  const { snapshot, loading } = useDemoApp();

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading account…
      </div>
    );
  }

  const account = snapshot.accounts.find((entry) => entry.id === accountId);
  if (!account) {
    return (
      <Card>
        <CardContent className="pt-5 text-body">Account not found.</CardContent>
      </Card>
    );
  }

  return <AccountProfileShell accountId={account.id} />;
}
