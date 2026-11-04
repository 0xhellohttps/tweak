"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendMessage } from "@/lib/actions/rooms";
import { Avatar } from "./avatar";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: { username: string; displayName: string; avatarUrl: string | null };
};

export function Chat({
  channelId,
  initialMessages,
}: {
  channelId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastTs = useRef<string | null>(
    initialMessages.length ? initialMessages[initialMessages.length - 1].createdAt : null
  );

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const qs = lastTs.current ? `?since=${encodeURIComponent(lastTs.current)}` : "";
        const res = await fetch(`/api/channels/${channelId}/messages${qs}`);
        if (!res.ok || !active) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (data.messages.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !seen.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          lastTs.current = data.messages[data.messages.length - 1].createdAt;
        }
      } catch {
        /* offline, retry next tick */
      }
    };
    const t = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="tag pt-8 text-center">DEAD AIR. SAY SOMETHING.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2.5">
            <Link href={`/u/${m.user.username}`} className="shrink-0 pt-0.5">
              <Avatar avatarUrl={m.user.avatarUrl} name={m.user.displayName} size={28} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/u/${m.user.username}`}
                  className="text-xs font-medium hover:underline"
                >
                  {m.user.displayName}
                </Link>
                <span className="tag">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-ink/90">{m.body}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        ref={formRef}
        action={async (fd) => {
          formRef.current?.reset();
          await sendMessage(fd);
        }}
        className="flex gap-2 border-t border-edge p-3"
      >
        <input type="hidden" name="channelId" value={channelId} />
        <input
          name="body"
          autoComplete="off"
          maxLength={1000}
          required
          placeholder="Transmit..."
          className="flex-1 border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
        />
        <button className="cursor-pointer bg-(--accent) px-4 font-mono text-[11px] tracking-[0.15em] text-black transition hover:opacity-80">
          SEND
        </button>
      </form>
    </div>
  );
}
