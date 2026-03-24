"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AccountProfileShell } from "@/components/demo/account-profile-shell";
import { useDemoApp } from "@/components/demo/demo-provider";

export default function PublicAccountPage() {
  const params = useParams<{ accountId: string }>();
  const { activeAccount, setActiveAccountId, snapshot, loading } = useDemoApp();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;

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

  useEffect(() => {
    if (activeAccount?.id !== account.id) {
      setActiveAccountId(account.id);
    }
  }, [account.id, activeAccount?.id, setActiveAccountId]);

  return <AccountProfileShell />;
}
