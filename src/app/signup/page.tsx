"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "@/lib/actions/auth";
import { ACCOUNT_ROLES } from "@/lib/constants";

export default function SignupPage() {
  const [state, action, pending] = useActionState(register, {});

  return (
    <main className="bg-profile-grid flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md border border-edge bg-panel p-8">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tweak-logo-w.png" alt="TWEAK" className="h-9 w-auto" />
        </Link>
        <div className="tag mt-6 mb-4">01 // CLAIM YOUR NAME</div>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tag mb-1 block">USERNAME</label>
              <input
                name="username"
                required
                pattern="[a-z0-9_]{2,24}"
                placeholder="lowercase_only"
                className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
            </div>
            <div>
              <label className="tag mb-1 block">DISPLAY NAME</label>
              <input
                name="displayName"
                placeholder="optional"
                className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
              />
            </div>
          </div>
          <div>
            <label className="tag mb-1 block">EMAIL</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </div>
          <div>
            <label className="tag mb-1 block">PASSWORD</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full border border-edge2 bg-void px-3 py-2 text-sm outline-none focus:border-(--accent)"
            />
          </div>
          <div>
            <label className="tag mb-2 block">WHAT ARE YOU // PICK ANY</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ROLES.map((role) => (
                <label key={role} className="cursor-pointer">
                  <input type="checkbox" name="roles" value={role} className="peer sr-only" />
                  <span className="block border border-edge2 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-muted transition peer-checked:border-(--accent) peer-checked:text-(--accent)">
                    {role}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {state.error && <p className="text-xs text-siren">{state.error}</p>}
          <button
            disabled={pending}
            className="w-full cursor-pointer bg-hot py-2.5 font-mono text-xs tracking-[0.2em] text-white transition hover:opacity-85 disabled:opacity-50"
          >
            {pending ? "..." : "GET IN"}
          </button>
        </form>
        <p className="tag mt-6">
          ALREADY IN?{" "}
          <Link href="/login" className="text-(--accent) hover:underline">
            LOG IN
          </Link>
        </p>
      </div>
    </main>
  );
}
