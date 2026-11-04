"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <main className="bg-profile-grid flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm border border-edge bg-panel p-8">
        <Link href="/" className="display text-xl font-bold">
          TWEAK
        </Link>
        <div className="tag mt-6 mb-4">01 // GET BACK IN</div>
        <form action={action} className="space-y-4">
          <div>
            <label className="tag mb-1 block">EMAIL OR USERNAME</label>
            <input
              name="identifier"
              required
              autoComplete="username"
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </div>
          <div>
            <label className="tag mb-1 block">PASSWORD</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </div>
          {state.error && <p className="text-xs text-siren">{state.error}</p>}
          <button
            disabled={pending}
            className="w-full cursor-pointer bg-(--accent) py-2.5 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80 disabled:opacity-50"
          >
            {pending ? "..." : "LOG IN"}
          </button>
        </form>
        <p className="tag mt-6">
          NO NAME YET?{" "}
          <Link href="/signup" className="text-(--accent) hover:underline">
            CLAIM ONE
          </Link>
        </p>
      </div>
    </main>
  );
}
