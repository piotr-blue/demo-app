"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getDocumentById,
  getPublicDocumentsForAccount,
  type ProfileSectionKey,
} from "@/lib/demo/selectors";
import { StudioEmptyState, StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobeIcon, Settings2Icon, UserCircle2Icon } from "lucide-react";

const PROFILE_SECTIONS: Array<{ key: ProfileSectionKey; label: string }> = [
  { key: "public-info", label: "Public Info" },
  { key: "public-documents", label: "Public Documents" },
  { key: "settings", label: "Settings" },
];

function resolveSection(input: string | null): ProfileSectionKey {
  return PROFILE_SECTIONS.find((entry) => entry.key === input)?.key ?? "public-info";
}

export function AccountProfileShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot, activeAccount, loading } = useDemoApp();
  const activeSection = resolveSection(searchParams.get("section"));

  const publicDocs = useMemo(
    () => (snapshot && activeAccount ? getPublicDocumentsForAccount(snapshot, activeAccount.id) : []),
    [activeAccount, snapshot]
  );
  const profileDocument = useMemo(
    () =>
      snapshot && activeAccount
        ? getDocumentById(snapshot, activeAccount.profileDocumentId)
        : null,
    [activeAccount, snapshot]
  );

  if (loading || !snapshot || !activeAccount) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading profile…</div>;
  }

  const setSection = (next: ProfileSectionKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border bg-background text-foreground">
                <UserCircle2Icon className="size-6" />
              </span>
              <p className="mt-3 text-sm font-semibold">{activeAccount.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activeAccount.subtitle}</p>
            </div>
            <nav className="space-y-1">
              {PROFILE_SECTIONS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === entry.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSection(entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        <StudioPageHeader
          eyebrow="My Profile"
          title={activeAccount.name}
          description="What another person would see when they open this account’s public profile."
          meta={
            <>
              <Badge variant="outline">{activeAccount.accountId}</Badge>
              <Badge variant="outline">{activeAccount.email}</Badge>
              <Badge variant="outline">{activeAccount.location ?? "No location"}</Badge>
            </>
          }
        />

        {activeSection === "public-info" ? (
          <StudioSectionCard title="Public Info" subtitle="Public-facing account identity and profile document">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Account details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Account ID</span><span>{activeAccount.accountId}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Email</span><span>{activeAccount.email}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Subtitle</span><span>{activeAccount.subtitle}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Location</span><span>{activeAccount.location ?? "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Website</span><span>{activeAccount.website ?? "—"}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground">{activeAccount.description}</p>
                  {profileDocument ? (
                    <div className="rounded-lg border bg-muted/20 px-3 py-3">
                      <p className="text-sm font-medium text-foreground">{profileDocument.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{profileDocument.summary}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </StudioSectionCard>
        ) : null}

        {activeSection === "public-documents" ? (
          <StudioSectionCard title="Public Documents" subtitle="Documents visible to other accounts">
            <div className="space-y-3">
              {publicDocs.length === 0 ? (
                <StudioEmptyState title="No public documents" body="This account does not expose any public documents yet." />
              ) : (
                publicDocs.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{document.title}</p>
                      <Badge variant="secondary">{document.visibilityLabel}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                  </Link>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeSection === "settings" ? (
          <StudioSectionCard title="Settings" subtitle="Owner-side account settings for the current profile">
            <div className="rounded-lg border bg-muted/20 px-4 py-4">
              <div className="flex items-center gap-2">
                <Settings2Icon className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Demo settings preview</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Sharing, contact fields, and public-document controls are display-realistic in this iteration.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline">Edit public info</Button>
                <Button size="sm" variant="outline">Manage public docs</Button>
              </div>
            </div>
          </StudioSectionCard>
        ) : null}
      </div>
    </section>
  );
}

export function AccountProfileShellForAccount({ accountId }: { accountId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot, loading } = useDemoApp();
  const activeSection = resolveSection(searchParams.get("section"));

  const account = useMemo(
    () => (snapshot ? snapshot.accounts.find((entry) => entry.id === accountId) ?? null : null),
    [accountId, snapshot]
  );
  const publicDocs = useMemo(
    () => (snapshot && account ? getPublicDocumentsForAccount(snapshot, account.id) : []),
    [account, snapshot]
  );
  const profileDocument = useMemo(
    () => (snapshot && account ? getDocumentById(snapshot, account.profileDocumentId) : null),
    [account, snapshot]
  );

  if (loading || !snapshot || !account) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading profile…</div>;
  }

  const setSection = (next: ProfileSectionKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border bg-background text-foreground">
                <UserCircle2Icon className="size-6" />
              </span>
              <p className="mt-3 text-sm font-semibold">{account.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{account.subtitle}</p>
            </div>
            <nav className="space-y-1">
              {PROFILE_SECTIONS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === entry.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSection(entry.key)}
                >
                  {entry.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        <StudioPageHeader
          eyebrow="Account Profile"
          title={account.name}
          description="Public account page visible from cross-account search."
          meta={
            <>
              <Badge variant="outline">{account.accountId}</Badge>
              <Badge variant="outline">{account.email}</Badge>
              <Badge variant="outline">{account.location ?? "No location"}</Badge>
            </>
          }
        />

        {activeSection === "public-info" ? (
          <StudioSectionCard title="Public Info" subtitle="Public-facing account identity and profile document">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Account details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Account ID</span><span>{account.accountId}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Email</span><span>{account.email}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Subtitle</span><span>{account.subtitle}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Location</span><span>{account.location ?? "—"}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Website</span><span>{account.website ?? "—"}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground">{account.description}</p>
                  {profileDocument ? (
                    <div className="rounded-lg border bg-muted/20 px-3 py-3">
                      <p className="text-sm font-medium text-foreground">{profileDocument.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{profileDocument.summary}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </StudioSectionCard>
        ) : null}

        {activeSection === "public-documents" ? (
          <StudioSectionCard title="Public Documents" subtitle="Documents visible to other accounts">
            <div className="space-y-3">
              {publicDocs.length === 0 ? (
                <StudioEmptyState title="No public documents" body="This account does not expose any public documents yet." />
              ) : (
                publicDocs.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{document.title}</p>
                      <Badge variant="secondary">{document.visibilityLabel}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                  </Link>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeSection === "settings" ? (
          <StudioSectionCard title="Settings" subtitle="Owner-only settings are not editable from public profile view">
            <div className="rounded-lg border bg-muted/20 px-4 py-4">
              <p className="text-sm text-muted-foreground">
                Public profile pages focus on what others can see. Editable owner controls live in My Profile.
              </p>
            </div>
          </StudioSectionCard>
        ) : null}
      </div>
    </section>
  );
}
