"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export const BLINK_AVATAR_SRC = "/demo/avatars/blink.webp";

export function DemoAvatar({
  name,
  src,
  kind = "person",
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  kind?: "person" | "blink";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const resolvedSrc = src ?? (kind === "blink" ? BLINK_AVATAR_SRC : null);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-muted text-[11px] font-semibold text-foreground",
        size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9",
        kind === "blink" ? "bg-primary/10 text-primary" : "",
        className
      )}
    >
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={`${name} avatar`}
          fill
          sizes={size === "sm" ? "32px" : size === "lg" ? "44px" : "36px"}
          className="object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

export function BlinkAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <DemoAvatar
      name="Blink"
      kind="blink"
      size={size}
      className={className}
    />
  );
}
