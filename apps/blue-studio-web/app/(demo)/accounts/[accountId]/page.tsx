"use client";

import { useParams } from "next/navigation";
import { PublicAccountPage } from "@/components/demo/public-account-page";

export default function AccountPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  return <PublicAccountPage accountId={accountId} />;
}
