"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserCredentials } from "@/lib/workspace/types";

interface CredentialsGateProps {
  onSubmit: (credentials: UserCredentials) => void;
  defaultBaseUrl?: string;
}

export function CredentialsGate({
  onSubmit,
  defaultBaseUrl = "https://api.dev.myos.blue/",
}: CredentialsGateProps) {
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [myOsApiKey, setMyOsApiKey] = useState("");
  const [myOsAccountId, setMyOsAccountId] = useState("");
  const [myOsBaseUrl, setMyOsBaseUrl] = useState(defaultBaseUrl);

  const isValid =
    openAiApiKey.trim().length > 0 &&
    myOsApiKey.trim().length > 0 &&
    myOsAccountId.trim().length > 0 &&
    myOsBaseUrl.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-page-title">Connect credentials</CardTitle>
          <CardDescription>
            Enter your OpenAI and MyOS credentials to start Blue Studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API key</Label>
            <Input
              id="openai-key"
              placeholder="sk-..."
              type="password"
              value={openAiApiKey}
              onChange={(event) => setOpenAiApiKey(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="myos-key">MyOS API key</Label>
            <Input
              id="myos-key"
              placeholder="MyOS key"
              type="password"
              value={myOsApiKey}
              onChange={(event) => setMyOsApiKey(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="myos-account">MyOS accountId</Label>
            <Input
              id="myos-account"
              placeholder="accountId"
              value={myOsAccountId}
              onChange={(event) => setMyOsAccountId(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="myos-base-url">MyOS base URL</Label>
            <Input
              id="myos-base-url"
              placeholder="https://api.dev.myos.blue/"
              value={myOsBaseUrl}
              onChange={(event) => setMyOsBaseUrl(event.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={!isValid}
            onClick={() =>
              onSubmit({
                openAiApiKey: openAiApiKey.trim(),
                myOsApiKey: myOsApiKey.trim(),
                myOsAccountId: myOsAccountId.trim(),
                myOsBaseUrl: myOsBaseUrl.trim(),
              })
            }
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
