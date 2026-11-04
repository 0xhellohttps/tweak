import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { asset } from "@/lib/assets";

const TICKER_ITEMS =
  "TWEAK IS A PROGRAM // EVERYBODY HAS A NAME IN HERE // DROP TRACKS // RUN YOUR ROOMS // GO LIVE // ";

export default async function Landing() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  return (
    <main className="relative flex min-h-dvh flex-col bg-void">
      <header className="flex items-center justify-between px-6 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/brand/tweak-logo-w.png")} alt="TWEAK" className="h-10 w-auto" />
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-panel px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-muted hover:text-ink"
          >
            LOG IN
          </Link>
          <Link
            href="/signup"
            className="bg-hot px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-white transition hover:opacity-85"
          >
            GET IN
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center px-6 md:px-16">
        <div className="tag mb-6">01 // THE NETWORK</div>
        <h1 className="display max-w-4xl text-5xl leading-[0.95] md:text-7xl">
          When rage becomes the norm,{" "}
          <span className="text-hot">TWEAK</span> becomes the next thing.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          A home for the counterculture. Drop tracks, build your space, run your
          rooms, go live. Music first. Community second. Everybody has a name in
          here.
        </p>
        <div className="mt-10 flex gap-3">
          <Link
            href="/signup"
            className="bg-hot px-6 py-3 font-mono text-xs tracking-[0.2em] text-white transition hover:opacity-85"
          >
            CLAIM YOUR NAME
          </Link>
          <Link
            href="/login"
            className="bg-panel px-6 py-3 font-mono text-xs tracking-[0.2em] text-muted transition hover:text-ink"
          >
            I HAVE ONE
          </Link>
        </div>
      </section>

      <div className="ticker py-2 text-lg">
        <div>
          {TICKER_ITEMS}
          {TICKER_ITEMS}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-px border-t border-edge bg-edge md:grid-cols-4">
        {[
          ["01 // SOUND", "Upload tracks. Build playlists. Get played."],
          ["02 // YOUR SPACE", "A profile that's actually yours. Backgrounds, accents, top friends."],
          ["03 // ROOMS", "Run your scene. Channels, roles, invites."],
          ["04 // LIVE", "Broadcast sets. Chat runs hot."],
        ].map(([t, d]) => (
          <div key={t} className="bg-void p-6">
            <div className="tag text-hot">{t}</div>
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
