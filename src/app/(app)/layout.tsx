import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-edge bg-void/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/feed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tweak-logo-w.png" alt="TWEAK" className="h-7 w-auto" />
        </Link>
        <nav className="flex gap-4">
          <Link href="/feed" className="tag hover:text-ink">
            FEED
          </Link>
          <Link href="/discover" className="tag hover:text-ink">
            SOUND
          </Link>
          <Link href="/live" className="tag hover:text-ink">
            LIVE
          </Link>
          <Link href="/rooms" className="tag hover:text-ink">
            ROOMS
          </Link>
        </nav>
      </header>
      <main className="pb-24 md:pl-56">{children}</main>
    </div>
  );
}
