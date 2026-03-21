"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceTemplateDialog } from "@/components/demo/workspace-template-dialog";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getWorkspaceScopes } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";

function RailLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground/90"
      )}
    >
      {icon ? <span>{icon}</span> : null}
      <span>{label}</span>
    </Link>
  );
}

export function GlobalLeftRail() {
  const pathname = usePathname();
  const { snapshot } = useDemoApp();
  const workspaces = snapshot ? getWorkspaceScopes(snapshot) : [];

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r bg-background/80">
      <div className="border-b px-4 py-3">
        <p className="font-semibold text-sm tracking-wide">MyOS Demo</p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-3">
          <RailLink href="/blink" label="Blink" icon="✨" active={pathname === "/blink"} />
          <RailLink
            href="/documents"
            label="Documents"
            icon="📄"
            active={pathname === "/documents" || pathname.startsWith("/documents/")}
          />

          <Separator className="my-2" />

          <p className="px-2 pt-1 pb-1 text-muted-foreground text-xs uppercase tracking-wide">
            Workspaces
          </p>
          <div className="space-y-1">
            {workspaces.length === 0 ? (
              <p className="px-2 text-muted-foreground text-sm">No workspaces yet.</p>
            ) : (
              workspaces.map((workspace) => (
                <RailLink
                  key={workspace.id}
                  href={`/workspaces/${encodeURIComponent(workspace.id)}`}
                  label={workspace.name}
                  icon={workspace.icon ?? "🧩"}
                  active={pathname === `/workspaces/${workspace.id}`}
                />
              ))
            )}
          </div>

          <div className="pt-2">
            <WorkspaceTemplateDialog buttonClassName="w-full justify-center" />
          </div>

          <Separator className="my-2" />

          <RailLink href="/settings" label="Settings" icon="⚙️" active={pathname === "/settings"} />
        </div>
      </ScrollArea>
    </aside>
  );
}
