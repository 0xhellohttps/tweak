"use client";

import { useTransition } from "react";
import { toggleFollow } from "@/lib/actions/social";

export function FollowButton({
  userId,
  following,
}: {
  userId: string;
  following: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleFollow(userId))}
      disabled={pending}
      className={`cursor-pointer border px-4 py-1.5 font-mono text-[11px] tracking-[0.15em] uppercase transition ${
        following
          ? "border-edge2 text-muted hover:border-siren hover:text-siren"
          : "border-(--accent) text-(--accent) hover:bg-(--accent) hover:text-black"
      }`}
    >
      {following ? "FOLLOWING" : "FOLLOW"}
    </button>
  );
}
