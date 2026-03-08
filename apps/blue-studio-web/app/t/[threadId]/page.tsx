import { StudioApp } from "@/components/studio-app";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <StudioApp workspaceId={threadId} />;
}

