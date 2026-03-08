"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  readLastVisitedThreadId,
  writeLastVisitedThreadId,
} from "@/lib/storage/local-storage";
import { createThreadId } from "@/lib/workspace/thread-id";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const existing = readLastVisitedThreadId();
    const threadId = existing ?? createThreadId();
    if (!existing) {
      writeLastVisitedThreadId(threadId);
    }
    router.replace(`/t/${encodeURIComponent(threadId)}`);
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
}
