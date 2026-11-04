import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "./avatar";
import { logout } from "@/lib/actions/auth";
import { COMMUNITY_NOUN_PLURAL } from "@/lib/constants";

const NAV = [
  ["01", "FEED", "/feed"],
  ["02", "SOUND", "/discover"],
  ["03", "LIVE", "/live"],
  ["04", "ROOMS", "/rooms"],
] as const;

export async function Sidebar() {
  const user = await getCurrentUser();

  const [myRooms, liveStreams] = await Promise.all([
    user
      ? db.communityMember.findMany({
          where: { userId: user.id, status: "ACTIVE" },
          include: { community: { select: { name: true, slug: true } } },
          take: 12,
        })
      : Promise.resolve([]),
    db.stream.findMany({
      where: { isLive: true },
      include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
      take: 8,
    }),
  ]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-edge bg-void md:flex">
      <Link href="/feed" className="block px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/tweak-logo-w.png" alt="TWEAK" className="h-9 w-auto" />
      </Link>

      <nav className="px-3">
        {NAV.map(([n, label, href]) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 px-2 py-2 font-mono text-[11px] tracking-[0.18em] text-muted transition hover:text-ink"
          >
            <span className="text-dim group-hover:text-(--accent)">{n} //</span>
            {label}
          </Link>
        ))}
        {user && (
          <Link
            href="/upload"
            className="mt-3 block border border-(--accent) px-3 py-2 text-center font-mono text-[11px] tracking-[0.18em] text-(--accent) transition hover:bg-(--accent) hover:text-black"
          >
            DROP A TRACK
          </Link>
        )}
      </nav>

      <div className="mt-6 flex-1 overflow-y-auto px-5">
        {liveStreams.length > 0 && (
          <div className="mb-6">
            <div className="tag mb-2">LIVE NOW</div>
            {liveStreams.map((s) => (
              <Link
                key={s.id}
                href={`/u/${s.user.username}`}
                className="mb-2 flex items-center gap-2 text-xs text-muted hover:text-ink"
              >
                <span className="live-dot h-1.5 w-1.5 shrink-0 bg-siren" />
                <Avatar avatarUrl={s.user.avatarUrl} name={s.user.displayName} size={20} />
                <span className="truncate">{s.user.displayName}</span>
              </Link>
            ))}
          </div>
        )}

        {user && myRooms.length > 0 && (
          <div>
            <div className="tag mb-2">MY {COMMUNITY_NOUN_PLURAL.toUpperCase()}</div>
            {myRooms.map((m) => (
              <Link
                key={m.communityId}
                href={`/rooms/${m.community.slug}`}
                className="mb-1.5 block truncate text-xs text-muted hover:text-ink"
              >
                <span className="text-dim">//</span> {m.community.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-edge p-4">
        {user ? (
          <div className="flex items-center gap-2">
            <Link href={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar avatarUrl={user.avatarUrl} name={user.displayName} size={32} />
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{user.displayName}</div>
                <div className="tag truncate">@{user.username}</div>
              </div>
            </Link>
            <Link href="/settings/profile" className="tag hover:text-ink" title="Settings">
              ⚙
            </Link>
            <form action={logout}>
              <button className="tag cursor-pointer hover:text-siren" title="Log out">
                ⏻
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="block border border-(--accent) px-3 py-2 text-center font-mono text-[11px] tracking-[0.18em] text-(--accent) hover:bg-(--accent) hover:text-black"
          >
            GET IN
          </Link>
        )}
      </div>
    </aside>
  );
}
