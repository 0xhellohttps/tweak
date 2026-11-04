"use client";

import { useRef } from "react";
import { createPost } from "@/lib/actions/social";
import { Avatar } from "./avatar";

export function Composer({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await createPost(fd);
        formRef.current?.reset();
      }}
      className="border border-edge bg-panel p-4"
    >
      <div className="flex gap-3">
        <Avatar avatarUrl={avatarUrl} name={displayName} size={40} />
        <textarea
          name="body"
          rows={2}
          maxLength={500}
          required
          placeholder="What's moving?"
          className="w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-dim"
        />
      </div>
      <div className="mt-2 flex justify-end">
        <button className="cursor-pointer bg-(--accent) px-5 py-1.5 font-mono text-[11px] tracking-[0.2em] text-black transition hover:opacity-80">
          TRANSMIT
        </button>
      </div>
    </form>
  );
}
