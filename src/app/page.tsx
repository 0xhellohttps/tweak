import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  return (
    <main className="bg-profile-haze relative flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="display text-xl font-bold tracking-tight">TWEAK</span>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="tag hover:text-ink">
            LOG IN
          </Link>
          <Link
            href="/signup"
            className="border border-(--accent) px-4 py-1.5 font-mono text-[11px] tracking-[0.15em] text-(--accent) transition hover:bg-(--accent) hover:text-black"
          >
            GET IN
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center px-6 md:px-16">
        <div className="tag mb-6">01 // THE NETWORK</div>
        <h1 className="display max-w-3xl text-5xl font-bold leading-[1.02] md:text-7xl">
          When rage becomes the norm,
          <br />
          <span className="text-(--accent)">TWEAK</span> becomes the next thing.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          A home for the counterculture. Drop tracks, build your space, run your
          rooms, go live. Music first. Community second. Everybody has a name in
          here.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="bg-(--accent) px-6 py-3 font-mono text-xs tracking-[0.2em] text-black transition hover:opacity-80"
          >
            CLAIM YOUR NAME
          </Link>
          <Link
            href="/login"
            className="border border-edge2 px-6 py-3 font-mono text-xs tracking-[0.2em] text-ink transition hover:border-ink"
          >
            I HAVE ONE
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-px border-t border-edge bg-edge md:grid-cols-4">
        {[
          ["01 // SOUND", "Upload tracks. Build playlists. Get played."],
          ["02 // YOUR SPACE", "A profile that's actually yours. Backgrounds, accents, top friends."],
          ["03 // ROOMS", "Run your scene. Channels, roles, invites."],
          ["04 // LIVE", "Broadcast sets. Chat runs hot."],
        ].map(([t, d]) => (
          <div key={t} className="bg-void p-6">
            <div className="tag text-(--accent)">{t}</div>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-between border-t border-edge px-6 py-4">
        <span className="tag">// AUSTIN, TEXAS</span>
        <span className="tag">TWEAK © 2026</span>
      </footer>
    </main>
  );
}
